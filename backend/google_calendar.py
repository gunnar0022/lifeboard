"""
Google Calendar integration — OAuth flow, sync engine, event management.
Handles bidirectional sync between Google Calendar and the local life_events table.
"""
import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from backend.database import get_db
from backend.config import get_config

logger = logging.getLogger("lifeboard")

PROJECT_ROOT = Path(__file__).parent.parent
TOKEN_PATH = PROJECT_ROOT / "data" / "google_tokens.json"
SCOPES = ["https://www.googleapis.com/auth/calendar"]

# Background sync task
_sync_task: asyncio.Task | None = None
_reminder_task: asyncio.Task | None = None


# --- OAuth ---

def _get_client_config() -> dict:
    return {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost:8000/api/google/callback"],
        }
    }


# Store the flow object between auth and callback (PKCE requires same instance)
_pending_flow: Flow | None = None


def get_auth_url() -> str:
    """Generate the OAuth authorization URL."""
    global _pending_flow
    _pending_flow = Flow.from_client_config(_get_client_config(), scopes=SCOPES)
    _pending_flow.redirect_uri = "http://localhost:8000/api/google/callback"
    auth_url, _ = _pending_flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url


def exchange_code(code: str) -> dict:
    """Exchange the OAuth callback code for tokens."""
    global _pending_flow
    if not _pending_flow:
        # Fallback: create new flow without PKCE (shouldn't happen normally)
        _pending_flow = Flow.from_client_config(_get_client_config(), scopes=SCOPES)
        _pending_flow.redirect_uri = "http://localhost:8000/api/google/callback"
    _pending_flow.fetch_token(code=code)

    creds = _pending_flow.credentials
    _pending_flow = None  # Clear after use
    token_data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes or []),
    }

    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_PATH.write_text(json.dumps(token_data, indent=2))
    logger.info("Google OAuth tokens saved")
    return token_data


def _get_credentials() -> Credentials | None:
    """Load stored credentials, refreshing if needed."""
    if not TOKEN_PATH.exists():
        return None

    token_data = json.loads(TOKEN_PATH.read_text())
    creds = Credentials(
        token=token_data.get("token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri"),
        client_id=token_data.get("client_id"),
        client_secret=token_data.get("client_secret"),
        scopes=token_data.get("scopes"),
    )

    if creds.expired and creds.refresh_token:
        from google.auth.transport.requests import Request
        try:
            creds.refresh(Request())
            # Save refreshed token
            token_data["token"] = creds.token
            TOKEN_PATH.write_text(json.dumps(token_data, indent=2))
        except Exception as e:
            logger.error(f"Failed to refresh Google token: {e}")
            if "invalid_grant" in str(e):
                logger.warning("Removing stale Google token file")
                TOKEN_PATH.unlink(missing_ok=True)
            return None

    return creds


def _get_service():
    """Get an authenticated Google Calendar API service."""
    creds = _get_credentials()
    if not creds:
        return None
    return build("calendar", "v3", credentials=creds)


def is_connected() -> bool:
    return TOKEN_PATH.exists()


# --- Sync Engine ---

async def sync_calendar():
    """Bidirectional sync between Google Calendar and local DB."""
    service = _get_service()
    if not service:
        logger.warning("Google Calendar not connected — skipping sync")
        return

    config = get_config()
    tz_name = config.get("timezone", "UTC")
    tz = ZoneInfo(tz_name)
    now = datetime.now(tz)

    # Fetch events from Google for the next 60 days + past 7 days
    time_min = (now - timedelta(days=7)).isoformat()
    time_max = (now + timedelta(days=60)).isoformat()

    try:
        await _pull_from_google(service, time_min, time_max)
        await _push_to_google(service, tz_name)
        await _detect_google_deletions(service, time_min, time_max)
        logger.info("Google Calendar sync completed")
        try:
            from backend.ws_manager import manager
            await manager.broadcast("life_manager")
            await manager.broadcast("home")
        except Exception:
            pass
    except Exception as e:
        error_str = str(e)
        logger.error(f"Google Calendar sync error: {e}", exc_info=True)
        # If token is expired/revoked, delete it so user gets prompted to reconnect
        if "invalid_grant" in error_str or "Token has been expired or revoked" in error_str:
            logger.warning("Google OAuth token expired or revoked — removing stale token file")
            try:
                TOKEN_PATH.unlink(missing_ok=True)
            except Exception:
                pass


async def _pull_from_google(service, time_min: str, time_max: str):
    """Pull events from Google Calendar and upsert into local DB."""
    # Get personal calendar events
    events_result = await asyncio.to_thread(
        lambda: service.events().list(
            calendarId="primary",
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy="startTime",
            maxResults=500,
        ).execute()
    )
    personal_events = events_result.get("items", [])

    # Get Japanese holidays
    jp_holidays = []
    try:
        jp_result = await asyncio.to_thread(
            lambda: service.events().list(
                calendarId="en.japanese#holiday@group.v.calendar.google.com",
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
                maxResults=100,
            ).execute()
        )
        jp_holidays = jp_result.get("items", [])
    except Exception as e:
        logger.warning(f"Could not fetch Japanese holidays: {e}")

    # Get US holidays
    us_holidays = []
    try:
        us_result = await asyncio.to_thread(
            lambda: service.events().list(
                calendarId="en.usa#holiday@group.v.calendar.google.com",
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
                maxResults=100,
            ).execute()
        )
        us_holidays = us_result.get("items", [])
    except Exception as e:
        logger.warning(f"Could not fetch US holidays: {e}")

    db = await get_db()
    try:
        for event in personal_events:
            await _upsert_google_event(db, event, "personal", is_holiday=False)

        for event in jp_holidays:
            await _upsert_google_event(db, event, "holidays_jp", is_holiday=True)

        for event in us_holidays:
            await _upsert_google_event(db, event, "holidays_us", is_holiday=True)

        await db.commit()
        logger.info(f"Pulled {len(personal_events)} personal + {len(jp_holidays)} JP + {len(us_holidays)} US holidays from Google")
    finally:
        await db.close()


async def _upsert_google_event(db, event: dict, source_calendar: str, is_holiday: bool):
    """Insert or update a Google Calendar event in the local DB."""
    google_id = event.get("id")
    if not google_id:
        return

    # Parse start/end times
    start = event.get("start", {})
    end = event.get("end", {})
    all_day = "date" in start
    start_time = start.get("date") or start.get("dateTime", "")
    end_time = end.get("date") or end.get("dateTime", "")

    title = event.get("summary", "Untitled")
    location = event.get("location")
    description = event.get("description")
    google_updated = event.get("updated", "")

    # Check if we already have this event
    existing = await db.execute_fetchall(
        "SELECT id, google_updated_at, sync_status, local_updated_at FROM life_events WHERE google_event_id = ?",
        (google_id,),
    )

    if existing:
        row = existing[0]
        # Don't overwrite local edits pending push
        if row["sync_status"] == "pending_push":
            # Conflict: compare timestamps, most recent wins
            if google_updated > (row["local_updated_at"] or ""):
                # Google is newer — overwrite
                pass
            else:
                # Local is newer — skip Google's version
                return

        # Update existing
        await db.execute(
            """UPDATE life_events SET title=?, start_time=?, end_time=?, all_day=?,
               location=?, description=?, source_calendar=?, is_holiday=?,
               google_updated_at=?, sync_status='synced'
               WHERE google_event_id=?""",
            (title, start_time, end_time, 1 if all_day else 0,
             location, description, source_calendar, 1 if is_holiday else 0,
             google_updated, google_id),
        )
    else:
        # Insert new
        await db.execute(
            """INSERT INTO life_events
               (google_event_id, title, start_time, end_time, all_day,
                location, description, source_calendar, is_holiday,
                google_updated_at, sync_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')""",
            (google_id, title, start_time, end_time, 1 if all_day else 0,
             location, description, source_calendar, 1 if is_holiday else 0,
             google_updated),
        )


async def _push_to_google(service, tz_name: str):
    """Push locally created/modified events to Google Calendar."""
    db = await get_db()
    try:
        # Events pending push
        rows = await db.execute_fetchall(
            "SELECT * FROM life_events WHERE sync_status = 'pending_push'"
        )

        for row in rows:
            event_body = {
                "summary": row["title"],
                "location": row["location"],
                "description": row["description"],
            }

            if row["all_day"]:
                event_body["start"] = {"date": row["start_time"][:10]}
                event_body["end"] = {"date": (row["end_time"] or row["start_time"])[:10]}
            else:
                event_body["start"] = {"dateTime": row["start_time"], "timeZone": tz_name}
                event_body["end"] = {"dateTime": row["end_time"] or row["start_time"], "timeZone": tz_name}

            try:
                if row["google_event_id"]:
                    # Update existing Google event
                    result = await asyncio.to_thread(
                        lambda eid=row["google_event_id"], body=event_body: service.events().update(
                            calendarId="primary", eventId=eid, body=body
                        ).execute()
                    )
                else:
                    # Create new Google event
                    result = await asyncio.to_thread(
                        lambda body=event_body: service.events().insert(
                            calendarId="primary", body=body
                        ).execute()
                    )

                google_id = result.get("id")
                google_updated = result.get("updated", "")

                await db.execute(
                    """UPDATE life_events SET google_event_id=?, google_updated_at=?,
                       sync_status='synced' WHERE id=?""",
                    (google_id, google_updated, row["id"]),
                )
            except Exception as e:
                logger.error(f"Failed to push event '{row['title']}' to Google: {e}")

        # Events pending delete
        delete_rows = await db.execute_fetchall(
            "SELECT * FROM life_events WHERE sync_status = 'pending_delete'"
        )

        for row in delete_rows:
            if row["google_event_id"]:
                try:
                    await asyncio.to_thread(
                        lambda eid=row["google_event_id"]: service.events().delete(
                            calendarId="primary", eventId=eid
                        ).execute()
                    )
                except Exception as e:
                    logger.warning(f"Failed to delete Google event: {e}")

            await db.execute("DELETE FROM life_events WHERE id=?", (row["id"],))

        await db.commit()
        if rows or delete_rows:
            logger.info(f"Pushed {len(rows)} events, deleted {len(delete_rows)} from Google")
    finally:
        await db.close()


async def _detect_google_deletions(service, time_min: str, time_max: str):
    """Detect events deleted from Google Calendar and remove locally."""
    # Get all Google event IDs currently in the API response
    events_result = await asyncio.to_thread(
        lambda: service.events().list(
            calendarId="primary",
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            maxResults=500,
        ).execute()
    )
    google_ids = {e["id"] for e in events_result.get("items", []) if e.get("id")}

    db = await get_db()
    try:
        # Find local events with google_event_id that are synced but not in Google anymore
        rows = await db.execute_fetchall(
            """SELECT id, google_event_id FROM life_events
               WHERE google_event_id IS NOT NULL
               AND sync_status = 'synced'
               AND source_calendar = 'personal'
               AND start_time >= ? AND start_time <= ?""",
            (time_min, time_max),
        )

        deleted = 0
        for row in rows:
            if row["google_event_id"] not in google_ids:
                await db.execute("DELETE FROM life_events WHERE id=?", (row["id"],))
                deleted += 1

        await db.commit()
        if deleted:
            logger.info(f"Detected {deleted} events deleted from Google Calendar")
    finally:
        await db.close()


# --- Live query (for Telegram) ---

async def get_events_live(days: int = 7) -> list[dict]:
    """Fetch events directly from Google Calendar API (not cache) for Telegram queries."""
    service = _get_service()
    if not service:
        # Fall back to local DB
        return await _get_local_events(days)

    config = get_config()
    tz = ZoneInfo(config.get("timezone", "UTC"))
    now = datetime.now(tz)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=days)).isoformat()

    try:
        result = await asyncio.to_thread(
            lambda: service.events().list(
                calendarId="primary",
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
                maxResults=50,
            ).execute()
        )
        events = []
        for e in result.get("items", []):
            start = e.get("start", {})
            events.append({
                "title": e.get("summary", "Untitled"),
                "start": start.get("dateTime") or start.get("date", ""),
                "end": (e.get("end", {}).get("dateTime") or e.get("end", {}).get("date", "")),
                "location": e.get("location"),
                "description": e.get("description"),
                "all_day": "date" in start,
            })
        return events
    except Exception as e:
        logger.error(f"Live Google Calendar fetch failed: {e}")
        return await _get_local_events(days)


async def _get_local_events(days: int = 7) -> list[dict]:
    """Fallback: get events from local DB."""
    config = get_config()
    tz = ZoneInfo(config.get("timezone", "UTC"))
    now = datetime.now(tz)
    time_min = now.isoformat()
    time_max = (now + timedelta(days=days)).isoformat()

    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            """SELECT * FROM life_events
               WHERE start_time >= ? AND start_time <= ?
               AND sync_status != 'pending_delete'
               ORDER BY start_time""",
            (time_min[:10], time_max[:10]),
        )
        return [dict(r) for r in rows]
    finally:
        await db.close()


# --- Schedulers ---

async def start_sync_scheduler():
    """Start the hourly calendar sync + per-minute reminder check."""
    global _sync_task, _reminder_task

    # Run initial sync
    try:
        await sync_calendar()
    except Exception as e:
        logger.error(f"Initial calendar sync failed: {e}")

    _sync_task = asyncio.create_task(_sync_loop())
    _reminder_task = asyncio.create_task(_reminder_loop())
    logger.info("Google Calendar sync + reminder schedulers started")


async def stop_sync_scheduler():
    global _sync_task, _reminder_task
    for task in [_sync_task, _reminder_task]:
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
    _sync_task = None
    _reminder_task = None
    logger.info("Google Calendar schedulers stopped")


async def _sync_loop():
    """Sync with Google Calendar every hour."""
    while True:
        try:
            await asyncio.sleep(3600)  # 1 hour
            await sync_calendar()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Calendar sync loop error: {e}")
            await asyncio.sleep(300)  # Retry in 5 min on error


async def _reminder_loop():
    """Check for due reminders every minute and send Telegram notifications."""
    while True:
        try:
            await asyncio.sleep(60)
            await _check_reminders()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Reminder loop error: {e}")


async def _check_reminders():
    """Send Telegram notifications for due reminders."""
    config = get_config()
    tz = ZoneInfo(config.get("timezone", "UTC"))
    now = datetime.now(tz)

    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            """SELECT * FROM life_events
               WHERE reminder_offset IS NOT NULL
               AND reminder_sent = 0
               AND sync_status != 'pending_delete'"""
        )

        for row in rows:
            try:
                # Parse event start time
                start_str = row["start_time"]
                if "T" in start_str:
                    event_start = datetime.fromisoformat(start_str)
                    if event_start.tzinfo is None:
                        event_start = event_start.replace(tzinfo=tz)
                else:
                    # All-day event — use midnight
                    event_start = datetime.fromisoformat(start_str + "T00:00:00").replace(tzinfo=tz)

                # Calculate reminder time
                reminder_time = event_start + timedelta(minutes=row["reminder_offset"])

                if now >= reminder_time:
                    # Send Telegram notification
                    offset = row["reminder_offset"]
                    if offset > 0:
                        time_desc = f"in {offset} minutes"
                        if offset >= 60:
                            time_desc = f"in {offset // 60} hour{'s' if offset >= 120 else ''}"
                        if offset >= 1440:
                            time_desc = f"in {offset // 1440} day{'s' if offset >= 2880 else ''}"
                    elif offset == 0:
                        time_desc = "now"
                    else:
                        abs_offset = abs(offset)
                        time_desc = f"{abs_offset} minutes ago"
                        if abs_offset >= 60:
                            time_desc = f"{abs_offset // 60} hour{'s' if abs_offset >= 120 else ''} ago"

                    location_str = f"\n📍 {row['location']}" if row.get("location") else ""
                    message = (
                        f"🔔 *Reminder*: {row['title']}\n"
                        f"⏰ Event starts {time_desc}{location_str}"
                    )

                    try:
                        from telegram import Bot
                        bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN", ""))
                        chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
                        if chat_id:
                            await bot.send_message(
                                chat_id=chat_id,
                                text=message,
                                parse_mode="Markdown",
                            )
                    except Exception as e:
                        logger.error(f"Failed to send reminder: {e}")

                    await db.execute(
                        "UPDATE life_events SET reminder_sent = 1 WHERE id = ?",
                        (row["id"],),
                    )
            except Exception as e:
                logger.error(f"Reminder check error for event {row['id']}: {e}")

        await db.commit()
    finally:
        await db.close()
