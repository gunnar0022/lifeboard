"""
Direct Garmin Connect scraper using browser session cookies.
Bypasses the garminconnect library's login entirely.
Uses connect.garmin.com/gc-api/ endpoints (same as browser).

Setup:
1. Log into connect.garmin.com in your browser
2. DevTools → Network → click any request → copy cookie header value
3. Save to data/.garmin_cookies
"""
import json
import logging
import os
from pathlib import Path

import httpx

logger = logging.getLogger("lifeboard.garmin")

COOKIE_PATH = Path(__file__).parent.parent.parent / "data" / ".garmin_cookies"
CSRF_PATH = Path(__file__).parent.parent.parent / "data" / ".garmin_csrf"
BASE_URL = "https://connect.garmin.com"


class GarminScraper:
    """Direct HTTP scraper for Garmin Connect using browser cookies."""

    def __init__(self, cookies: str, csrf_token: str = None):
        self.cookies = cookies
        self.csrf_token = csrf_token
        self.client = None

    @classmethod
    def from_file(cls) -> "GarminScraper":
        if not COOKIE_PATH.exists():
            raise FileNotFoundError(
                f"Cookie file not found at {COOKIE_PATH}. "
                "Log into connect.garmin.com, copy cookies, save to this file."
            )
        cookies = COOKIE_PATH.read_text().strip()
        csrf_token = None
        if CSRF_PATH.exists():
            csrf_token = CSRF_PATH.read_text().strip()
        return cls(cookies, csrf_token)

    def _get_client(self) -> httpx.Client:
        if not self.client:
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
        return self.client

    def _get(self, path: str, params: dict = None) -> dict | list | None:
        """Make a GET request to gc-api, return parsed JSON or None."""
        client = self._get_client()
        try:
            resp = client.get(f"{BASE_URL}/gc-api{path}", params=params)
            if resp.status_code == 200 and resp.text and resp.text != "{}":
                return resp.json()
            if resp.status_code == 204:
                return None  # No content
            if resp.status_code != 200:
                logger.debug(f"gc-api {path}: HTTP {resp.status_code}")
        except Exception as e:
            logger.warning(f"gc-api {path} failed: {e}")
        return None

    def test_connection(self) -> bool:
        """Test if the cookies are valid by hitting the stress endpoint."""
        from datetime import date
        today = date.today().isoformat()
        result = self._get(f"/wellness-service/wellness/dailyStress/{today}")
        return result is not None

    def get_stats(self, date_str: str) -> dict:
        result = self._get("/usersummary-service/usersummary/daily", params={"calendarDate": date_str})
        return result or {}

    def get_body_battery(self, date_str: str) -> list:
        result = self._get(
            "/wellness-service/wellness/bodyBattery/reports/daily",
            params={"startDate": date_str, "endDate": date_str},
        )
        return result if isinstance(result, list) else []

    def get_sleep_data(self, date_str: str) -> dict:
        # Sleep endpoint uses display name but also works without it via the date param
        result = self._get(f"/wellness-service/wellness/dailySleepData/gunnar0022", params={"date": date_str})
        if not result:
            # Fallback without display name
            result = self._get("/wellness-service/wellness/dailySleepData", params={"date": date_str})
        return result or {}

    def get_hrv_data(self, date_str: str) -> dict:
        result = self._get(f"/hrv-service/hrv/{date_str}")
        return result or {}

    def get_activities_by_date(self, date_str: str) -> list:
        result = self._get(
            "/activitylist-service/activities/search/activities",
            params={"startDate": date_str, "endDate": date_str, "limit": 20},
        )
        return result if isinstance(result, list) else []

    def get_stress_data(self, date_str: str) -> dict:
        result = self._get(f"/wellness-service/wellness/dailyStress/{date_str}")
        return result or {}

    def close(self):
        if self.client:
            self.client.close()
