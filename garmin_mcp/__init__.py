"""Garmin Connect MCP Server — bridges Garmin fitness data with Claude and other MCP clients."""

import os
import sys
import base64

import requests
from mcp.server.fastmcp import FastMCP
from garminconnect import (
    Garmin,
    GarminConnectAuthenticationError,
    GarminConnectConnectionError,
    GarminConnectTooManyRequestsError,
)

from garmin_mcp import (
    activity_management,
    health_wellness,
    training,
    workouts,
    workout_builders,
    user_profile,
    devices,
)
from garmin_mcp.token_utils import get_token_path, get_token_base64_path, token_exists


def is_interactive_terminal() -> bool:
    return sys.stdin.isatty() and sys.stdout.isatty()


def get_mfa() -> str:
    if not is_interactive_terminal():
        raise RuntimeError(
            "MFA required but running in non-interactive mode. "
            "Run 'garmin-mcp-auth' first to pre-authenticate and save tokens."
        )
    print("\nGarmin Connect MFA required. Check your email/phone for the code.")
    return input("Enter MFA code: ")


def init_api(email: str, password: str) -> Garmin:
    token_path = get_token_path()
    token_base64_path = get_token_base64_path()

    # Try token-based login first
    if token_exists(token_path):
        try:
            garmin = Garmin()
            garmin.login(token_path)
            return garmin
        except Exception:
            pass  # Fall through to credential-based login

    # Try base64 token file
    expanded_b64 = os.path.expanduser(token_base64_path)
    if os.path.exists(expanded_b64):
        try:
            with open(expanded_b64, "r") as f:
                token_b64 = f.read().strip()
            token_json = base64.b64decode(token_b64).decode()
            import tempfile, json as _json
            with tempfile.TemporaryDirectory() as tmp:
                token_file = os.path.join(tmp, "garmin_tokens.json")
                with open(token_file, "w") as f:
                    f.write(token_json)
                garmin = Garmin()
                garmin.login(tmp)
                return garmin
        except Exception:
            pass

    # Try GARMINTOKENS_BASE64 env var (base64-encoded token string)
    token_b64_env = os.environ.get("GARMINTOKENS_BASE64_VALUE")
    if token_b64_env:
        try:
            token_json = base64.b64decode(token_b64_env).decode()
            import tempfile
            with tempfile.TemporaryDirectory() as tmp:
                token_file = os.path.join(tmp, "garmin_tokens.json")
                with open(token_file, "w") as f:
                    f.write(token_json)
                garmin = Garmin()
                garmin.login(tmp)
                return garmin
        except Exception:
            pass

    # Credential-based login
    if not email or not password:
        raise GarminConnectAuthenticationError(
            "No valid tokens found and no credentials provided. "
            "Run 'garmin-mcp-auth' to pre-authenticate, or set "
            "GARMIN_EMAIL and GARMIN_PASSWORD environment variables."
        )

    garmin = Garmin(email=email, password=password, prompt_mfa=get_mfa, return_on_mfa=True)
    result1, result2 = garmin.login()

    if result1 == "needs_mfa":
        mfa_code = get_mfa()
        garmin.resume_login(result2, mfa_code)

    # Save tokens for future use
    try:
        garmin.client.dump(token_path)
    except Exception:
        pass

    return garmin


def _get_credential(env_var: str, file_env_var: str) -> str:
    value = os.environ.get(env_var, "")
    file_path = os.environ.get(file_env_var, "")
    if value and file_path:
        raise ValueError(f"Must only provide one of {env_var} and {file_env_var}, got both")
    if file_path:
        with open(file_path, "r") as f:
            return f.read().rstrip()
    return value


def main():
    try:
        email = _get_credential("GARMIN_EMAIL", "GARMIN_EMAIL_FILE")
        password = _get_credential("GARMIN_PASSWORD", "GARMIN_PASSWORD_FILE")
    except ValueError as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        garmin = init_api(email, password)
    except GarminConnectAuthenticationError as e:
        print(
            f"Authentication failed: {e}\n"
            "Run 'garmin-mcp-auth' to pre-authenticate with Garmin Connect.",
            file=sys.stderr,
        )
        sys.exit(1)
    except GarminConnectTooManyRequestsError:
        print("Garmin Connect rate limit exceeded. Please wait a few minutes and try again.", file=sys.stderr)
        sys.exit(1)
    except GarminConnectConnectionError as e:
        err = str(e)
        if "401" in err or "403" in err:
            print("Invalid Garmin credentials. Check GARMIN_EMAIL and GARMIN_PASSWORD.", file=sys.stderr)
        elif "500" in err or "503" in err:
            print("Garmin Connect service unavailable. Please try again later.", file=sys.stderr)
        else:
            print(f"Connection error: {err.split(':')[0]}", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 429:
            print("Rate limited by Garmin Connect. Please wait a few minutes.", file=sys.stderr)
        else:
            print(f"Network error connecting to Garmin Connect: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error during authentication: {e}", file=sys.stderr)
        sys.exit(1)

    # Configure all modules with the authenticated client
    activity_management.configure(garmin)
    health_wellness.configure(garmin)
    training.configure(garmin)
    workouts.configure(garmin)
    workout_builders.configure(garmin)
    user_profile.configure(garmin)
    devices.configure(garmin)

    # Create MCP server and register all tools
    app = FastMCP("garmin-mcp")

    activity_management.register_tools(app)
    health_wellness.register_tools(app)
    training.register_tools(app)
    workouts.register_tools(app)
    workout_builders.register_tools(app)
    user_profile.register_tools(app)
    devices.register_tools(app)

    app.run()


if __name__ == "__main__":
    main()
