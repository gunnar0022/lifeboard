#!/usr/bin/env python3
"""
Manual token helper for Garmin Connect.
If the automated login is blocked by Cloudflare, use this to paste
tokens from a browser session.

Usage:
1. Log into connect.garmin.com in your browser
2. Open DevTools → Network tab
3. Click any API request (e.g., reload the page, click on a widget)
4. Find a request to connect.garmin.com that has an Authorization header
5. Copy the Bearer token (starts with 'eyJ...')
6. Run this script and paste it when prompted
"""
import json
import os
import sys
from pathlib import Path

TOKEN_DIR = Path(__file__).parent.parent / "data" / ".garmin_tokens"

def main():
    print("=" * 60)
    print("Garmin Token Helper")
    print("=" * 60)
    print()
    print("This tool creates a token file so the Garmin ingest")
    print("can authenticate without hitting the login endpoint.")
    print()
    print("Steps:")
    print("1. Go to connect.garmin.com in your browser (log in)")
    print("2. Open DevTools (F12) → Network tab")
    print("3. Refresh the page")
    print("4. Click on any request to connect.garmin.com")
    print("5. In Request Headers, find 'Authorization: Bearer eyJ...'")
    print("6. Copy everything after 'Bearer ' (the eyJ... part)")
    print()

    token = input("Paste the Bearer token here: ").strip()

    if not token:
        print("No token provided. Exiting.")
        sys.exit(1)

    if not token.startswith("eyJ"):
        print("Warning: Token doesn't look like a JWT (should start with 'eyJ').")
        proceed = input("Continue anyway? (y/n): ").strip().lower()
        if proceed != "y":
            sys.exit(1)

    # Try to extract client_id from the JWT
    client_id = None
    try:
        import base64
        # JWT is base64url encoded: header.payload.signature
        parts = token.split(".")
        if len(parts) >= 2:
            # Decode payload
            payload = parts[1]
            # Add padding
            payload += "=" * (4 - len(payload) % 4)
            decoded = json.loads(base64.urlsafe_b64decode(payload))
            client_id = decoded.get("cid") or decoded.get("client_id") or decoded.get("azp")
            print(f"Extracted client_id: {client_id}")
    except Exception as e:
        print(f"Could not extract client_id from JWT: {e}")

    if not client_id:
        client_id = input("Enter client_id (or press Enter to skip): ").strip() or None

    # Build the token file
    token_data = {
        "di_token": token,
        "di_refresh_token": None,  # We don't have this from browser
        "di_client_id": client_id,
    }

    TOKEN_DIR.mkdir(parents=True, exist_ok=True)
    token_path = TOKEN_DIR / "garmin_tokens.json"
    token_path.write_text(json.dumps(token_data, indent=2))

    print()
    print(f"Token saved to: {token_path}")
    print()
    print("Now try running the ingest:")
    print("  /opt/homebrew/bin/python3.14 -m backend.garmin.ingest")
    print()
    print("Note: This token will expire eventually (hours/days).")
    print("Once the ingest runs successfully, it should be able to")
    print("refresh the token on its own without hitting login again.")


if __name__ == "__main__":
    main()
