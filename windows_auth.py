"""
Run this script on YOUR WINDOWS MACHINE in PyCharm's terminal.
It will log in to Garmin, handle MFA interactively, and print the tokens.

Steps:
  1. Open PyCharm
  2. Open Terminal (Alt+F12)
  3. Run: pip install garminconnect
  4. Run: python windows_auth.py
  5. Copy the output and paste it to Claude
"""

import json
import os
import sys
import tempfile
from pathlib import Path

EMAIL = "Hadar.breslav@gmail.com"
PASSWORD = "h7GyAG=%$g4YyYu"

try:
    import garminconnect
except ImportError:
    print("ERROR: garminconnect not installed.")
    print("Run: pip install garminconnect")
    sys.exit(1)


def prompt_mfa():
    print()
    print("Garmin requires MFA code.")
    print("Check your phone/email NOW and enter the 6-digit code:")
    return input("MFA code: ").strip()


def main():
    print("Logging in to Garmin Connect...")
    print(f"Email: {EMAIL}")

    token_dir = tempfile.mkdtemp()

    api = garminconnect.Garmin(EMAIL, PASSWORD, prompt_mfa=prompt_mfa)
    api.login()
    api.garth.dump(token_dir)

    profile = api.get_user_profile()
    display = profile.get("displayName") or profile.get("userName") or "OK"
    print(f"\nSuccess! Logged in as: {display}")

    print("\n" + "=" * 60)
    print("COPY EVERYTHING BELOW THIS LINE AND PASTE TO CLAUDE:")
    print("=" * 60)

    token_path = Path(token_dir)
    output = {}
    for f in token_path.iterdir():
        if f.is_file():
            output[f.name] = f.read_text()

    print(json.dumps(output, ensure_ascii=False, indent=2))
    print("=" * 60)


if __name__ == "__main__":
    main()
