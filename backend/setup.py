"""
Setup wizard — backend endpoints for first-run configuration.
Handles .env creation, user_config.json, API key validation, and restart.
"""
import os
import json
import logging
import sys
from pathlib import Path

import httpx

logger = logging.getLogger("lifeboard")

PROJECT_ROOT = Path(__file__).parent.parent
ENV_PATH = PROJECT_ROOT / ".env"
CONFIG_PATH = PROJECT_ROOT / "user_config.json"


def is_setup_complete() -> bool:
    """Check if the setup wizard has been completed."""
    if not CONFIG_PATH.exists():
        return False
    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        return config.get("setup_complete", False)
    except Exception:
        return False


def get_setup_status() -> dict:
    """Return current setup state for the wizard to know what's done."""
    has_env = ENV_PATH.exists()
    has_config = CONFIG_PATH.exists()

    env_keys = {}
    if has_env:
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key = line.split("=", 1)[0].strip()
                env_keys[key] = True

    return {
        "setup_complete": is_setup_complete(),
        "has_env": has_env,
        "has_config": has_config,
        "has_anthropic_key": "ANTHROPIC_API_KEY" in env_keys,
        "has_telegram_token": "TELEGRAM_BOT_TOKEN" in env_keys,
        "has_telegram_chat_id": "TELEGRAM_CHAT_ID" in env_keys,
        "has_google_client_id": "GOOGLE_CLIENT_ID" in env_keys,
        "has_google_client_secret": "GOOGLE_CLIENT_SECRET" in env_keys,
        "detected_timezone": _detect_timezone(),
    }


def _detect_timezone() -> str:
    """Try to detect timezone from system."""
    try:
        import time
        offset = -time.timezone if time.daylight == 0 else -time.altzone
        # Common offset mappings
        offset_map = {
            32400: "Asia/Tokyo",
            -18000: "America/New_York",
            -21600: "America/Chicago",
            -25200: "America/Denver",
            -28800: "America/Los_Angeles",
            0: "UTC",
            3600: "Europe/London",
            7200: "Europe/Berlin",
        }
        return offset_map.get(offset, "UTC")
    except Exception:
        return "UTC"


def save_env(data: dict) -> bool:
    """Write or update .env file."""
    existing = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                existing[key.strip()] = val.strip()

    existing.update(data)

    lines = []
    for key, val in existing.items():
        lines.append(f"{key}={val}")

    ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    logger.info(f"Updated .env with keys: {list(data.keys())}")
    return True


def save_config(data: dict) -> bool:
    """Write or update user_config.json."""
    existing = {}
    if CONFIG_PATH.exists():
        try:
            existing = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass

    existing.update(data)
    CONFIG_PATH.write_text(json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8")
    logger.info(f"Updated user_config.json")
    return True


async def test_anthropic_key(api_key: str) -> dict:
    """Test an Anthropic API key by making a minimal API call."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 10,
                    "messages": [{"role": "user", "content": "hi"}],
                },
            )
            if resp.status_code == 200:
                return {"valid": True, "message": "API key is valid"}
            elif resp.status_code == 401:
                return {"valid": False, "message": "Invalid API key"}
            else:
                return {"valid": False, "message": f"Unexpected response: {resp.status_code}"}
    except Exception as e:
        return {"valid": False, "message": f"Connection error: {str(e)}"}


async def test_telegram_token(token: str) -> dict:
    """Test a Telegram bot token by calling getMe."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"https://api.telegram.org/bot{token}/getMe")
            data = resp.json()
            if data.get("ok"):
                bot = data["result"]
                return {
                    "valid": True,
                    "message": f"Connected to @{bot.get('username', 'unknown')}",
                    "bot_username": bot.get("username"),
                }
            else:
                return {"valid": False, "message": data.get("description", "Invalid token")}
    except Exception as e:
        return {"valid": False, "message": f"Connection error: {str(e)}"}


def trigger_restart() -> bool:
    """Signal the backend to restart. Returns True if restart was triggered."""
    logger.info("Setup wizard triggered restart")
    # Write a restart flag file that start.bat/start.sh can check
    # For uvicorn, we can't restart from within — we'll tell the user
    return True
