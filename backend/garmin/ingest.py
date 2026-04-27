"""
Garmin ingest script — pulls last 3 days from Garmin Connect and upserts into DB.
Tries garminconnect library first, falls back to direct browser cookie scraper.
"""
import asyncio
import logging
import os
import time
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

from backend.garmin.transform import transform_daily, extract_sleep_levels
from backend.database import get_db

logger = logging.getLogger("lifeboard.garmin")


SUMMARY_COLUMNS = [
    "date", "body_battery_max", "body_battery_min", "body_battery_charged",
    "body_battery_drained", "hrv_last_night_avg", "hrv_status",
    "resting_heart_rate", "stress_avg", "stress_max",
    "sleep_duration_seconds", "sleep_score", "sleep_deep_seconds",
    "sleep_light_seconds", "sleep_rem_seconds", "sleep_awake_seconds",
    "bedtime_iso", "wake_iso", "awake_count", "avg_sleep_stress",
    "avg_respiration", "avg_spo2", "lowest_spo2", "nap_seconds",
    "unmeasurable_seconds", "sleep_score_feedback", "sleep_score_insight",
    "steps", "steps_goal", "distance_meters", "floors_climbed",
    "active_calories", "total_calories", "active_minutes",
    "workout_count", "workout_total_seconds", "raw_json",
]


async def upsert_daily_summary(row: dict):
    db = await get_db()
    try:
        values = [row.get(col) for col in SUMMARY_COLUMNS]
        placeholders = ", ".join(["?"] * len(SUMMARY_COLUMNS))
        col_list = ", ".join(SUMMARY_COLUMNS)
        update_clause = ", ".join(f"{col} = excluded.{col}" for col in SUMMARY_COLUMNS if col != "date")

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


async def upsert_sleep_levels(date_str: str, segments: list[dict]):
    """Replace hypnogram rows for the given date."""
    if not segments:
        return
    db = await get_db()
    try:
        await db.execute("DELETE FROM garmin_sleep_levels WHERE date = ?", (date_str,))
        await db.executemany(
            "INSERT INTO garmin_sleep_levels (date, seq, start_ts, end_ts, stage) VALUES (?, ?, ?, ?, ?)",
            [(date_str, s["seq"], s["start_ts"], s["end_ts"], s["stage"]) for s in segments],
        )
        await db.commit()
    finally:
        await db.close()


async def log_ingest(status: str, dates_updated: list = None,
                      error_message: str = None, duration_ms: int = 0):
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
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return
    try:
        from telegram import Bot
        bot = Bot(token=token)
        from datetime import datetime
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        db = await get_db()
        try:
            cursor = await db.execute(
                "SELECT run_at FROM garmin_ingest_log WHERE status = 'success' ORDER BY id DESC LIMIT 1"
            )
            row = await cursor.fetchone()
            last_success = row["run_at"] if row else "never"
        finally:
            await db.close()

        msg = f"⚠️ Garmin ingest failed\nTime: {now}\nError: {error_msg[:200]}\nLast successful run: {last_success}"
        await bot.send_message(chat_id=chat_id, text=msg)
    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")


def _get_data_source():
    """Get the best available data source: Playwright scraper or library."""

    # Strategy 1: Playwright-backed scraper (headless browser — most reliable)
    try:
        from backend.garmin.scraper import GarminScraper
        scraper = GarminScraper.from_env()
        scraper.login()
        logger.info("Using Playwright scraper")
        return scraper, "playwright"
    except Exception as e:
        logger.info(f"Playwright scraper failed: {e}")

    # Strategy 2: garminconnect library (may be rate-limited)
    try:
        from backend.garmin.client import GarminClient
        client = GarminClient.from_env()
        client.login()
        logger.info("Using garminconnect library")
        return client, "library"
    except Exception as e:
        logger.info(f"Library login failed: {e}")

    raise RuntimeError(
        "No Garmin auth method available. Check credentials and try again."
    )


async def run_ingest():
    start = time.monotonic()
    logger.info("Starting Garmin ingest...")

    try:
        source, source_type = _get_data_source()

        today = date.today()
        dates = [today, today - timedelta(days=1), today - timedelta(days=2)]
        updated = []

        for d in dates:
            date_str = d.isoformat()
            logger.info(f"Fetching Garmin data for {date_str}...")

            stats = source.get_stats(date_str)
            body_battery_raw = source.get_body_battery(date_str)
            sleep = source.get_sleep_data(date_str)
            hrv = source.get_hrv_data(date_str)
            activities = source.get_activities_by_date(date_str)
            stress = source.get_stress_data(date_str)

            # body_battery might be a list (library) or dict (scraper)
            body_battery = body_battery_raw if isinstance(body_battery_raw, list) else []

            row = transform_daily(date_str, stats, body_battery, sleep, hrv, activities, stress)
            await upsert_daily_summary(row)
            segments = extract_sleep_levels(sleep)
            if segments:
                await upsert_sleep_levels(date_str, segments)
            updated.append(date_str)
            logger.info(f"  Upserted {date_str}: steps={row.get('steps')}, bb_max={row.get('body_battery_max')}, sleep={row.get('sleep_score')}, segments={len(segments)}")

        if hasattr(source, 'close'):
            source.close()

        duration_ms = int((time.monotonic() - start) * 1000)
        await log_ingest(status="success", dates_updated=updated, duration_ms=duration_ms)
        logger.info(f"Garmin ingest complete ({source_type}): {len(updated)} days in {duration_ms}ms")
        return {"ok": True, "dates": updated, "duration_ms": duration_ms, "source": source_type}

    except Exception as e:
        duration_ms = int((time.monotonic() - start) * 1000)
        error_msg = str(e)
        logger.error(f"Garmin ingest failed: {error_msg}")
        await log_ingest(status="failure", error_message=error_msg, duration_ms=duration_ms)
        await send_failure_alert(error_msg)
        raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
    asyncio.run(run_ingest())
