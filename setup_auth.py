#!/usr/bin/env python3
"""One-time Garmin authentication setup.

Run this script DIRECTLY in your terminal (not inside Claude Code or Jupyter):
    python setup_auth.py

It will prompt for your MFA code interactively and save tokens to ~/.garminconnect
so the main app never needs to log in again.
"""

import os
import sys
from pathlib import Path

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


def prompt_mfa() -> str:
    print()
    print("Garmin requires Two-Factor Authentication (MFA).")
    print("Check your phone / email for the 6-digit code, then enter it here:")
    code = input("MFA code: ").strip()
    return code


def main():
    print("=" * 50)
    print("  Garmin Connect - One-time Authentication Setup")
    print("=" * 50)

    # Step 1: try cached tokens
    print(f"\nChecking for cached tokens in: {TOKEN_STORE}")
    try:
        api = garminconnect.Garmin()
        api.login(TOKEN_STORE)
        profile = api.get_user_profile()
        display = profile.get("displayName") or profile.get("userName") or "Unknown"
        print(f"\nSUCCESS: Already logged in as '{display}'")
        print("You can now run the main app: python run.py")
        return
    except Exception:
        print("No valid cached tokens found. Logging in with email/password...")

    # Step 2: email/password login
    if not EMAIL or not PASSWORD:
        print("\nERROR: GARMIN_EMAIL or GARMIN_PASSWORD not set in .env")
        print("Make sure your .env file contains:")
        print("  GARMIN_EMAIL=your@email.com")
        print("  GARMIN_PASSWORD=yourpassword")
        sys.exit(1)

    print(f"\nLogging in as: {EMAIL}")
    try:
        api = garminconnect.Garmin(EMAIL, PASSWORD, prompt_mfa=prompt_mfa)
        api.login()
        api.garth.dump(TOKEN_STORE)
        print(f"\nTokens saved to: {TOKEN_STORE}")

        profile = api.get_user_profile()
        display = profile.get("displayName") or profile.get("userName") or "Unknown"
        print(f"SUCCESS: Logged in as '{display}'")
        print("\nYou can now run the main app: python run.py")
        print("Tokens are cached - no login needed next time.")

    except garminconnect.GarminConnectAuthenticationError:
        print("\nERROR: Authentication failed. Check your email/password in .env")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
