"""
Garmin ingest script — pulls last 3 days from Garmin Connect and upserts into DB.
Can be run standalone (python -m backend.garmin.ingest) or imported.
"""
import asyncio
import logging
import os
import time
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv

# Load env before imports that need it
PROJECT_ROOT = Path(__file__).parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

from backend.garmin.client import GarminClient
from backend.garmin.transform import transform_daily
from backend.database import get_db

logger = logging.getLogger("lifeboard.garmin")


async def upsert_daily_summary(row: dict):
    """Upsert a transformed daily summary row into the database."""
    db = await get_db()
    try:
        columns = [
            "date", "body_battery_max", "body_battery_min", "body_battery_charged",
            "body_battery_drained", "hrv_last_night_avg", "hrv_status",
            "resting_heart_rate", "stress_avg", "stress_max",
            "sleep_duration_seconds", "sleep_score", "sleep_deep_seconds",
            "sleep_light_seconds", "sleep_rem_seconds", "sleep_awake_seconds",
            "steps", "steps_goal", "distance_meters", "floors_climbed",
            "active_calories", "total_calories", "active_minutes",
            "workout_count", "workout_total_seconds", "raw_json",
        ]
        values = [row.get(col) for col in columns]

        placeholders = ", ".join(["?"] * len(columns))
        col_list = ", ".join(columns)
        update_clause = ", ".join(f"{col} = excluded.{col}" for col in columns if col != "date")

        await db.execute(
            f"""INSERT INTO garmin_daily_summary ({col_list})
                VALUES ({placeholders})
                ON CONFLICT(date) DO UPDATE SET {update_clause},
                ingested_at = strftime('%Y-%m-%dT%H:%M:%S', 'now')""",
            values,
        )
        await db.commit()
    finally:
        await db.close()


async def log_ingest(status: str, dates_updated: list = None,
                      error_message: str = None, duration_ms: int = 0):
    """Log an ingest run to the tracking table."""
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO garmin_ingest_log (status, dates_updated, error_message, duration_ms) VALUES (?, ?, ?, ?)",
            (status, ",".join(dates_updated) if dates_updated else None, error_message, duration_ms),
        )
        await db.commit()
    finally:
        await db.close()


async def send_failure_alert(error_msg: str):
    """Send Telegram alert on ingest failure."""
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return
    try:
        from telegram import Bot
        bot = Bot(token=token)
        from datetime import datetime
        now = datetime.now().strftime("%Y-%m-%d %H:%M")

        # Get last successful run
        db = await get_db()
        try:
            cursor = await db.execute(
                "SELECT run_at FROM garmin_ingest_log WHERE status = 'success' ORDER BY id DESC LIMIT 1"
            )
            row = await cursor.fetchone()
            last_success = row["run_at"] if row else "never"
        finally:
            await db.close()

        msg = (
            f"⚠️ Garmin ingest failed\n"
            f"Time: {now}\n"
            f"Error: {error_msg[:200]}\n"
            f"Last successful run: {last_success}"
        )
        await bot.send_message(chat_id=chat_id, text=msg)
    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")


async def run_ingest():
    """Main ingest function — pulls last 3 days from Garmin Connect."""
    start = time.monotonic()
    logger.info("Starting Garmin ingest...")

    try:
        client = GarminClient.from_env()
        client.login()

        today = date.today()
        dates = [today, today - timedelta(days=1), today - timedelta(days=2)]
        updated = []

        for d in dates:
            date_str = d.isoformat()
            logger.info(f"Fetching Garmin data for {date_str}...")

            stats = client.get_stats(date_str)
            body_battery = client.get_body_battery(date_str)
            sleep = client.get_sleep_data(date_str)
            hrv = client.get_hrv_data(date_str)
            activities = client.get_activities_by_date(date_str)
            stress = client.get_stress_data(date_str)

            row = transform_daily(date_str, stats, body_battery, sleep, hrv, activities, stress)
            await upsert_daily_summary(row)
            updated.append(date_str)
            logger.info(f"  Upserted {date_str}: steps={row.get('steps')}, bb_max={row.get('body_battery_max')}, sleep={row.get('sleep_score')}")

        duration_ms = int((time.monotonic() - start) * 1000)
        await log_ingest(status="success", dates_updated=updated, duration_ms=duration_ms)
        logger.info(f"Garmin ingest complete: {len(updated)} days updated in {duration_ms}ms")
        return {"ok": True, "dates": updated, "duration_ms": duration_ms}

    except Exception as e:
        duration_ms = int((time.monotonic() - start) * 1000)
        error_msg = str(e)
        logger.error(f"Garmin ingest failed: {error_msg}")
        await log_ingest(status="failure", error_message=error_msg, duration_ms=duration_ms)
        await send_failure_alert(error_msg)
        raise


# CLI entry point
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
    asyncio.run(run_ingest())
