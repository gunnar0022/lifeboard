"""
Garmin Connect scraper using Playwright for authentication.
Launches a real headless browser to log in, then uses the
authenticated session cookies for API calls.

Session state is persisted to disk so the browser only needs
to fully log in once — subsequent runs restore the session.
"""
import json
import logging
import os
import time
from pathlib import Path
from datetime import date

import httpx

logger = logging.getLogger("lifeboard.garmin")

SESSION_DIR = Path(__file__).parent.parent.parent / "data" / ".garmin_browser_session"
COOKIE_CACHE = Path(__file__).parent.parent.parent / "data" / ".garmin_cached_cookies.json"
BASE_URL = "https://connect.garmin.com"


def _playwright_login(email: str, password: str) -> dict:
    """
    Use Playwright to log into Garmin Connect and capture session cookies.
    Returns a dict of cookies keyed by name.
    Runs synchronously — call from a thread if inside an async context.
    """
    from playwright.sync_api import sync_playwright

    SESSION_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            storage_state=str(SESSION_DIR / "state.json") if (SESSION_DIR / "state.json").exists() else None,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        )

        page = context.new_page()

        # Try loading the app — if session is valid, it won't redirect to login
        page.goto(f"{BASE_URL}/modern/", wait_until="networkidle", timeout=30000)
        time.sleep(2)

        current_url = page.url
        logger.info(f"Initial page URL: {current_url}")

        # Check if we need to log in
        if "signin" in current_url or "sso.garmin.com" in current_url:
            logger.info("Session expired, performing fresh login...")

            # Navigate to SSO login
            if "sso.garmin.com" not in current_url:
                page.goto("https://sso.garmin.com/portal/sso/en-US/sign-in?clientId=GarminConnect&service=https://connect.garmin.com/modern/", wait_until="networkidle", timeout=30000)

            time.sleep(2)

            # Fill login form
            try:
                # Wait for form to fully load
                time.sleep(3)

                email_field = page.locator('input[name="email"], input[type="email"], #email')
                if email_field.count() > 0:
                    email_field.first.click()
                    time.sleep(0.5)
                    email_field.first.fill(email)
                    logger.info("Filled email field")

                time.sleep(1)

                password_field = page.locator('input[name="password"], input[type="password"], #password')
                if password_field.count() > 0:
                    password_field.first.click()
                    time.sleep(0.5)
                    password_field.first.fill(password)
                    logger.info("Filled password field")

                time.sleep(1)

                # Check "Remember Me" if present
                remember = page.locator('input[name="rememberme"], #rememberme, input[type="checkbox"]')
                if remember.count() > 0:
                    try:
                        remember.first.check()
                        logger.info("Checked Remember Me")
                    except Exception:
                        pass

                time.sleep(1)

                # Click sign-in button
                submit = page.locator('button[type="submit"], #login-btn-signin, button:has-text("Sign In")')
                if submit.count() > 0:
                    submit.first.click()
                    logger.info("Clicked sign-in button")

                # Wait for redirect back to connect — longer timeout
                page.wait_for_url("**/connect.garmin.com/**", timeout=45000)
                time.sleep(3)
                logger.info(f"Login successful, redirected to: {page.url}")

            except Exception as e:
                logger.error(f"Login form interaction failed: {e}")
                # Take screenshot for debugging
                try:
                    page.screenshot(path=str(SESSION_DIR / "login_error.png"))
                    logger.info("Screenshot saved to login_error.png")
                except Exception:
                    pass
                browser.close()
                raise RuntimeError(f"Garmin login failed: {e}")

        else:
            logger.info("Existing session is valid")

        # Save session state for next run
        context.storage_state(path=str(SESSION_DIR / "state.json"))
        logger.info("Session state saved")

        # Extract cookies
        cookies = context.cookies()
        cookie_dict = {}
        for c in cookies:
            if "garmin.com" in c.get("domain", ""):
                cookie_dict[c["name"]] = c["value"]

        # Save cookies to cache file
        COOKIE_CACHE.write_text(json.dumps(cookie_dict))
        logger.info(f"Captured {len(cookie_dict)} Garmin cookies")

        browser.close()
        return cookie_dict


class GarminScraper:
    """Garmin Connect scraper with Playwright-backed authentication."""

    def __init__(self):
        self.cookies = None
        self.cookie_string = None
        self.client = None

    @classmethod
    def from_env(cls) -> "GarminScraper":
        return cls()

    def login(self):
        """Authenticate via Playwright and set up HTTP client."""
        import asyncio
        email = os.getenv("GARMIN_EMAIL", "")
        password = os.getenv("GARMIN_PASSWORD", "")
        if not email or not password:
            raise ValueError("GARMIN_EMAIL and GARMIN_PASSWORD must be set")

        # Try cached cookies first
        if COOKIE_CACHE.exists():
            try:
                cached = json.loads(COOKIE_CACHE.read_text())
                self.cookies = cached
                self._build_client()
                if self._test_session():
                    logger.info("Using cached Playwright cookies")
                    return
                logger.info("Cached cookies expired, re-authenticating...")
            except Exception:
                pass

        # Playwright sync API can't run inside an asyncio loop.
        # Run it in a thread to avoid conflicts.
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(_playwright_login, email, password)
            self.cookies = future.result(timeout=60)

        self._build_client()

        if not self._test_session():
            raise RuntimeError("Playwright login succeeded but API calls fail")

    def _build_client(self):
        """Build the httpx client with current cookies."""
        self.cookie_string = "; ".join(f"{k}={v}" for k, v in self.cookies.items())
        self.client = httpx.Client(
            headers={
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Cookie": self.cookie_string,
                "NK": "NT",
                "x-app-ver": "5.23.0.33a",
                "x-requested-with": "XMLHttpRequest",
                "Referer": f"{BASE_URL}/modern/",
                "Origin": BASE_URL,
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
            },
            timeout=15,
            follow_redirects=True,
        )

    def _test_session(self) -> bool:
        """Quick test if the current cookies work."""
        try:
            resp = self.client.get(
                f"{BASE_URL}/gc-api/usersummary-service/usersummary/daily",
                params={"calendarDate": date.today().isoformat()},
            )
            return resp.status_code == 200 and resp.text != "{}" and len(resp.text) > 10
        except Exception:
            return False

    def _get(self, path: str, params: dict = None) -> dict | list | None:
        try:
            resp = self.client.get(f"{BASE_URL}/gc-api{path}", params=params)
            if resp.status_code == 200 and resp.text and resp.text != "{}":
                return resp.json()
            if resp.status_code == 204:
                return None
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
