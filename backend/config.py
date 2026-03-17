import json
import os
from pathlib import Path
from functools import lru_cache

PROJECT_ROOT = Path(__file__).parent.parent
CONFIG_PATH = PROJECT_ROOT / "user_config.json"

_config_cache = None
_config_mtime = None


def get_config() -> dict:
    """Read user_config.json. Caches result, reloads if file has changed."""
    global _config_cache, _config_mtime

    try:
        current_mtime = CONFIG_PATH.stat().st_mtime
    except FileNotFoundError:
        return _default_config()

    if _config_cache is not None and _config_mtime == current_mtime:
        return _config_cache

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        _config_cache = json.load(f)
    _config_mtime = current_mtime
    return _config_cache


CURRENCY_SYMBOLS = {
    "USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥",
    "CNY": "¥", "KRW": "₩", "SEK": "kr", "NOK": "kr",
    "DKK": "kr", "AUD": "A$", "CAD": "C$",
}


def get_currency_symbol(currency_code: str = None) -> str:
    """Return the symbol for the configured or given currency."""
    if currency_code is None:
        currency_code = get_config().get("primary_currency", "USD")
    return CURRENCY_SYMBOLS.get(currency_code, "$")


def _default_config() -> dict:
    return {
        "user_name": "User",
        "display_name": "friend",
        "timezone": "UTC",
        "primary_currency": "USD",
        "secondary_currency": None,
        "pay_cycle_day": 1,
        "salary_is_net": None,
        "active_agents": ["finance", "life_manager"],
        "quiet_hours": {"weekday": None, "weekend": None},
        "locale": "en",
    }
