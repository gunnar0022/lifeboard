"""
Garmin Connect client with multiple auth strategies.
Supports: tokenstore (DI tokens), JWT_WEB cookie injection, and standard login.
"""
import json
import logging
import os
from pathlib import Path

from garminconnect import Garmin

logger = logging.getLogger("lifeboard.garmin")

TOKEN_STORE_PATH = str(Path(__file__).parent.parent.parent / "data" / ".garmin_tokens")
JWT_WEB_PATH = Path(__file__).parent.parent.parent / "data" / ".garmin_jwt_web"


class GarminClient:
    """Wrapper around garminconnect with fallback auth strategies."""

    def __init__(self, email: str, password: str):
        self.email = email
        self.password = password
        self.api = None

    @classmethod
    def from_env(cls) -> "GarminClient":
        email = os.getenv("GARMIN_EMAIL", "")
        password = os.getenv("GARMIN_PASSWORD", "")
        if not email or not password:
            raise ValueError("GARMIN_EMAIL and GARMIN_PASSWORD must be set in .env")
        return cls(email, password)

    def login(self):
        """Login using best available method: JWT_WEB → tokenstore → credentials."""
        self.api = Garmin(self.email, self.password)
        os.makedirs(TOKEN_STORE_PATH, exist_ok=True)

        # Strategy 1: Try JWT_WEB cookie (extracted from browser — bypasses Cloudflare)
        if JWT_WEB_PATH.exists():
            try:
                jwt_web = JWT_WEB_PATH.read_text().strip()
                if jwt_web:
                    # Inject the cookie directly into the client
                    self.api.client.jwt_web = jwt_web
                    # Test by fetching display name
                    name = self.api.display_name
                    logger.info(f"Garmin auth via JWT_WEB cookie successful (user: {name})")
                    return
            except Exception as e:
                logger.info(f"JWT_WEB auth failed (token may be expired): {e}")

        # Strategy 2: Try tokenstore (DI tokens with refresh capability)
        token_file = Path(TOKEN_STORE_PATH) / "garmin_tokens.json"
        if token_file.exists():
            try:
                self.api.login(tokenstore=TOKEN_STORE_PATH)
                logger.info("Garmin auth via tokenstore successful")
                return
            except Exception as e:
                logger.info(f"Tokenstore auth failed: {e}")

        # Strategy 3: Standard login (last resort — may hit Cloudflare 429)
        try:
            self.api.login()
            logger.info("Garmin login via credentials successful")
            try:
                self.api.client.dump(TOKEN_STORE_PATH)
            except Exception:
                pass
            return
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "rate limit" in error_str:
                logger.error(
                    "Garmin login rate-limited (429). "
                    "Extract JWT_WEB from browser and save to data/.garmin_jwt_web"
                )
            raise

    def get_stats(self, date_str: str) -> dict:
        try:
            return self.api.get_stats(date_str) or {}
        except Exception as e:
            logger.warning(f"get_stats({date_str}) failed: {e}")
            return {}

    def get_body_battery(self, date_str: str) -> list:
        try:
            result = self.api.get_body_battery(date_str)
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.warning(f"get_body_battery({date_str}) failed: {e}")
            return []

    def get_sleep_data(self, date_str: str) -> dict:
        try:
            return self.api.get_sleep_data(date_str) or {}
        except Exception as e:
            logger.warning(f"get_sleep_data({date_str}) failed: {e}")
            return {}

    def get_hrv_data(self, date_str: str) -> dict:
        try:
            return self.api.get_hrv_data(date_str) or {}
        except Exception as e:
            logger.warning(f"get_hrv_data({date_str}) failed: {e}")
            return {}

    def get_activities_by_date(self, date_str: str) -> list:
        try:
            result = self.api.get_activities_by_date(date_str, date_str)
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.warning(f"get_activities_by_date({date_str}) failed: {e}")
            return []

    def get_stress_data(self, date_str: str) -> dict:
        try:
            return self.api.get_stress_data(date_str) or {}
        except Exception as e:
            logger.warning(f"get_stress_data({date_str}) failed: {e}")
            return {}
