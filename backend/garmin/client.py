"""
Garmin Connect client with session caching.
Wraps the garminconnect library to handle auth, session persistence,
and graceful retries.
"""
import json
import logging
import os
from pathlib import Path

from garminconnect import Garmin

logger = logging.getLogger("lifeboard.garmin")

SESSION_CACHE_PATH = Path(__file__).parent.parent.parent / "data" / ".garmin_session"


class GarminClient:
    """Thin wrapper around garminconnect with session cache."""

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
        """Login to Garmin Connect, using cached session if available."""
        self.api = Garmin(self.email, self.password)

        # Try resuming cached session
        if SESSION_CACHE_PATH.exists():
            try:
                session_data = json.loads(SESSION_CACHE_PATH.read_text())
                self.api.garth.loads(session_data)
                # Test the session
                self.api.display_name
                logger.info("Garmin session resumed from cache")
                return
            except Exception as e:
                logger.info(f"Cached session expired, re-authenticating: {e}")

        # Full login
        self.api.login()
        self._save_session()
        logger.info("Garmin login successful, session cached")

    def _save_session(self):
        """Save the auth session for reuse."""
        try:
            session_data = self.api.garth.dumps()
            SESSION_CACHE_PATH.write_text(session_data)
        except Exception as e:
            logger.warning(f"Failed to cache Garmin session: {e}")

    def get_stats(self, date_str: str) -> dict:
        """Get daily stats summary."""
        try:
            return self.api.get_stats(date_str) or {}
        except Exception as e:
            logger.warning(f"get_stats({date_str}) failed: {e}")
            return {}

    def get_body_battery(self, date_str: str) -> list:
        """Get body battery data for a date."""
        try:
            result = self.api.get_body_battery(date_str)
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.warning(f"get_body_battery({date_str}) failed: {e}")
            return []

    def get_sleep_data(self, date_str: str) -> dict:
        """Get sleep data for a date."""
        try:
            return self.api.get_sleep_data(date_str) or {}
        except Exception as e:
            logger.warning(f"get_sleep_data({date_str}) failed: {e}")
            return {}

    def get_hrv_data(self, date_str: str) -> dict:
        """Get HRV data for a date."""
        try:
            return self.api.get_hrv_data(date_str) or {}
        except Exception as e:
            logger.warning(f"get_hrv_data({date_str}) failed: {e}")
            return {}

    def get_activities_by_date(self, date_str: str) -> list:
        """Get activities (workouts) for a date."""
        try:
            result = self.api.get_activities_by_date(date_str, date_str)
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.warning(f"get_activities_by_date({date_str}) failed: {e}")
            return []

    def get_stress_data(self, date_str: str) -> dict:
        """Get stress data for a date."""
        try:
            return self.api.get_stress_data(date_str) or {}
        except Exception as e:
            logger.warning(f"get_stress_data({date_str}) failed: {e}")
            return {}
