#!/usr/bin/env python3
"""Web-based Garmin MFA authentication setup.

Starts a local HTTP server. Open http://localhost:8080 in your browser,
enter your MFA code, and tokens will be saved automatically.
"""

import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import garminconnect
except ImportError:
    print("Missing dependency. Run: pip install garminconnect")
    sys.exit(1)

TOKEN_STORE = os.environ.get("GARMINTOKENS", str(Path.home() / ".garminconnect"))
EMAIL = os.environ.get("GARMIN_EMAIL", "").strip()
PASSWORD = os.environ.get("GARMIN_PASSWORD", "").strip()

PORT = 8080
mfa_code_event = threading.Event()
mfa_code_value = {"code": None}
auth_result = {"success": False, "message": "", "done": False}


HTML_WAITING = """<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Garmin Authentication</title>
<style>
  body {{ font-family: Arial, sans-serif; max-width: 400px; margin: 60px auto; padding: 20px; text-align: center; }}
  h2 {{ color: #1a73e8; }}
  input {{ font-size: 24px; text-align: center; width: 160px; padding: 10px; border: 2px solid #1a73e8; border-radius: 8px; letter-spacing: 8px; }}
  button {{ font-size: 18px; padding: 10px 30px; background: #1a73e8; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 15px; }}
  button:hover {{ background: #1558b0; }}
  .hint {{ color: #888; font-size: 13px; margin-top: 10px; }}
</style>
</head>
<body>
<h2>Garmin Connect - אימות דו-שלבי</h2>
<p>פתח את הטלפון ומצא את קוד MFA של גרמין.</p>
<p>הזן את הקוד כאן:</p>
<form method="POST" action="/mfa">
  <input type="text" name="code" maxlength="6" autofocus placeholder="000000"><br>
  <button type="submit">אשר</button>
</form>
<p class="hint">הקוד תקף כ-30 שניות. מהר!</p>
</body>
</html>"""

HTML_SUCCESS = """<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><title>הצלחה!</title>
<style>body{{font-family:Arial;max-width:400px;margin:60px auto;text-align:center;}}h2{{color:#0b8043;}}</style>
</head>
<body>
<h2>✅ התחברת בהצלחה!</h2>
<p>הטוקנים נשמרו. ניתן לסגור דף זה.</p>
<p>כעת הרץ: <code>python run.py</code></p>
</body></html>"""

HTML_ERROR = """<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><title>שגיאה</title>
<style>body{{font-family:Arial;max-width:400px;margin:60px auto;text-align:center;}}h2{{color:#d93025;}}</style>
</head>
<body>
<h2>❌ שגיאה</h2>
<p>{msg}</p>
<p><a href="/">נסה שוב</a></p>
</body></html>"""


class AuthHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # suppress default logging

    def do_GET(self):
        if auth_result["done"] and auth_result["success"]:
            self._respond(200, HTML_SUCCESS)
        else:
            self._respond(200, HTML_WAITING)

    def do_POST(self):
        if self.path == "/mfa":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode()
            params = parse_qs(body)
            code = params.get("code", [""])[0].strip()
            if code:
                mfa_code_value["code"] = code
                mfa_code_event.set()
                self._respond(200, "<html><body><p>ממתין לאימות...</p><script>setTimeout(()=>location.href='/',3000)</script></body></html>")
            else:
                self._respond(400, HTML_ERROR.format(msg="לא הוזן קוד"))

    def _respond(self, code, html):
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode())


def prompt_mfa() -> str:
    print(f"\n>>> פתח את הדפדפן וגש ל: http://localhost:{PORT}")
    print(">>> הזן שם את קוד ה-MFA מהטלפון")
    mfa_code_event.wait(timeout=120)
    code = mfa_code_value.get("code", "")
    if not code:
        raise RuntimeError("לא התקבל קוד MFA תוך 120 שניות")
    print(f">>> קוד התקבל: {code}")
    return code


def run_auth():
    # Step 1: try cached tokens
    print(f"בודק טוקנים קיימים ב: {TOKEN_STORE}")
    try:
        api = garminconnect.Garmin()
        api.login(TOKEN_STORE)
        profile = api.get_user_profile()
        display = profile.get("displayName") or profile.get("userName") or "Unknown"
        auth_result["success"] = True
        auth_result["message"] = f"Connected as {display}"
        auth_result["done"] = True
        print(f"\n✅ כבר מחובר בתור '{display}' (טוקנים קיימים)")
        return
    except Exception:
        pass

    # Step 2: email/password + MFA via browser
    if not EMAIL or not PASSWORD:
        auth_result["message"] = "Missing GARMIN_EMAIL or GARMIN_PASSWORD in .env"
        auth_result["done"] = True
        return

    print(f"מתחבר בתור: {EMAIL}")
    try:
        api = garminconnect.Garmin(EMAIL, PASSWORD, prompt_mfa=prompt_mfa)
        api.login()
        api.garth.dump(TOKEN_STORE)
        profile = api.get_user_profile()
        display = profile.get("displayName") or profile.get("userName") or "Unknown"
        auth_result["success"] = True
        auth_result["message"] = f"Connected as {display}"
        auth_result["done"] = True
        print(f"\n✅ התחברת בהצלחה בתור '{display}'")
        print(f"✅ טוקנים נשמרו ב: {TOKEN_STORE}")
        print("\nכעת הרץ: python run.py")
    except Exception as e:
        auth_result["success"] = False
        auth_result["message"] = str(e)
        auth_result["done"] = True
        print(f"\n❌ שגיאה: {e}")


def main():
    print("=" * 55)
    print("  Garmin Connect - Web-Based Authentication Setup")
    print("=" * 55)

    server = HTTPServer(("0.0.0.0", PORT), AuthHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    print(f"\nשרת פועל על: http://localhost:{PORT}")

    auth_thread = threading.Thread(target=run_auth)
    auth_thread.start()
    auth_thread.join()

    # Keep server alive a few seconds so user sees the result page
    if auth_result["success"]:
        time.sleep(5)

    server.shutdown()


if __name__ == "__main__":
    main()
