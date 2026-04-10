"""
Garmin Connect scraper using browser session cookies.
Reads cookies from data/.garmin_cookies (pasted from browser DevTools).
The session cookie lasts ~3 months; JWT_WEB refreshes are handled
by the Garmin API itself via set-cookie headers.

Setup:
1. Log into connect.garmin.com in your browser
2. DevTools → Network → click any request → copy cookie header value
3. Save to data/.garmin_cookies
4. Also save the connect-csrf-token header value to data/.garmin_csrf
"""
import json
import logging
import os
from datetime import date
from pathlib import Path

import httpx

logger = logging.getLogger("lifeboard.garmin")

COOKIE_PATH = Path(__file__).parent.parent.parent / "data" / ".garmin_cookies"
CSRF_PATH = Path(__file__).parent.parent.parent / "data" / ".garmin_csrf"
BASE_URL = "https://connect.garmin.com"


class GarminScraper:
    """Direct HTTP scraper for Garmin Connect using browser cookies."""

    def __init__(self):
        self.cookies = None
        self.csrf_token = None
        self.client = None
        self._jwt_refreshed = False

    @classmethod
    def from_env(cls) -> "GarminScraper":
        return cls()

    def login(self):
        """Load cookies from file and verify they work."""
        if not COOKIE_PATH.exists():
            raise FileNotFoundError(
                f"Cookie file not found at {COOKIE_PATH}. "
                "Log into connect.garmin.com, copy cookies from DevTools."
            )

        self.cookies = COOKIE_PATH.read_text().strip()
        if CSRF_PATH.exists():
            self.csrf_token = CSRF_PATH.read_text().strip()

        self._build_client()

        # Test the session
        if not self._test_session():
            raise RuntimeError(
                "Garmin cookies are expired or invalid. "
                "Refresh by logging into connect.garmin.com and copying new cookies."
            )

        logger.info("Garmin cookie session verified")

    def _build_client(self):
        headers = {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Cookie": self.cookies,
            "NK": "NT",
            "x-app-ver": "5.23.0.33a",
            "x-requested-with": "XMLHttpRequest",
            "Referer": f"{BASE_URL}/modern/",
            "Origin": BASE_URL,
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
        }
        if self.csrf_token:
            headers["connect-csrf-token"] = self.csrf_token
        self.client = httpx.Client(headers=headers, timeout=15, follow_redirects=True)

    def _test_session(self) -> bool:
        try:
            resp = self.client.get(
                f"{BASE_URL}/gc-api/usersummary-service/usersummary/daily",
                params={"calendarDate": date.today().isoformat()},
            )
            if resp.status_code == 200 and resp.text != "{}" and len(resp.text) > 10:
                # Update cookies if server sent new ones (JWT_WEB refresh)
                self._capture_response_cookies(resp)
                return True
            return False
        except Exception:
            return False

    def _capture_response_cookies(self, resp):
        """Capture any set-cookie headers to keep session fresh."""
        for header in resp.headers.get_list("set-cookie"):
            name = header.split("=")[0]
            if name in ("JWT_WEB", "SESSIONID", "session"):
                value = header.split(";")[0]
                # Update the cookie string
                if f"{name}=" in self.cookies:
                    # Replace existing
                    import re
                    self.cookies = re.sub(
                        f"{name}=[^;]+",
                        value,
                        self.cookies,
                    )
                else:
                    self.cookies += f"; {value}"
                self._jwt_refreshed = True

        # Persist updated cookies if any were refreshed
        if self._jwt_refreshed:
            COOKIE_PATH.write_text(self.cookies)
            self._jwt_refreshed = False
            # Rebuild client with new cookies
            self._build_client()

    def _get(self, path: str, params: dict = None) -> dict | list | None:
        try:
            resp = self.client.get(f"{BASE_URL}/gc-api{path}", params=params)
            self._capture_response_cookies(resp)
            if resp.status_code == 200 and resp.text and resp.text != "{}":
                return resp.json()
            if resp.status_code == 204:
                return None
            if resp.status_code in (401, 403):
                logger.warning(f"gc-api {path}: HTTP {resp.status_code} — cookies may need refresh")
        except Exception as e:
            logger.warning(f"gc-api {path} failed: {e}")
        return None

    def get_stats(self, date_str: str) -> dict:
        return self._get("/usersummary-service/usersummary/daily", params={"calendarDate": date_str}) or {}

    def get_body_battery(self, date_str: str) -> list:
        result = self._get("/wellness-service/wellness/bodyBattery/reports/daily", params={"startDate": date_str, "endDate": date_str})
        return result if isinstance(result, list) else []

    def get_sleep_data(self, date_str: str) -> dict:
        return self._get("/wellness-service/wellness/dailySleepData/gunnar0022", params={"date": date_str}) or {}

    def get_hrv_data(self, date_str: str) -> dict:
        return self._get(f"/hrv-service/hrv/{date_str}") or {}

    def get_activities_by_date(self, date_str: str) -> list:
        result = self._get("/activitylist-service/activities/search/activities", params={"startDate": date_str, "endDate": date_str, "limit": 20})
        return result if isinstance(result, list) else []

    def get_stress_data(self, date_str: str) -> dict:
        return self._get(f"/wellness-service/wellness/dailyStress/{date_str}") or {}

    def close(self):
        if self.client:
            self.client.close()
