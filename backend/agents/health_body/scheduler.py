"""
Health & Body agent — background scheduler.
Two async loops running inside the FastAPI process:
1. Evening check-in: sends a Telegram message at configured time
2. Daily compression: collapses old meal/exercise data into daily summaries
"""
import os
import asyncio
import logging
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from backend.config import get_config, get_today
from backend.agents.health_body import queries

logger = logging.getLogger(__name__)

_scheduler_task: asyncio.Task | None = None
_compression_task: asyncio.Task | None = None


async def start_scheduler():
    """Start background scheduler tasks."""
    global _scheduler_task, _compression_task
    _scheduler_task = asyncio.create_task(_evening_checkin_loop())
    _compression_task = asyncio.create_task(_daily_compression_loop())
    logger.info("Health scheduler started")


async def stop_scheduler():
    """Cancel background tasks."""
    global _scheduler_task, _compression_task
    for task in [_scheduler_task, _compression_task]:
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
    _scheduler_task = None
    _compression_task = None
    logger.info("Health scheduler stopped")


async def _evening_checkin_loop():
    """Send evening check-in message at the configured time each day."""
    while True:
        try:
            config = get_config()
            tz = ZoneInfo(config.get("timezone", "UTC"))
            profile = await queries.get_profile()
            checkin_time_str = (profile or {}).get("evening_checkin_time", "21:00")
            hour, minute = map(int, checkin_time_str.split(":"))

            now = datetime.now(tz)
            target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if target <= now:
                target += timedelta(days=1)

            wait_seconds = (target - now).total_seconds()
            logger.info(f"Next evening check-in in {wait_seconds / 3600:.1f} hours")
            await asyncio.sleep(wait_seconds)

            if not get_config().get("evening_checkin_enabled", True):
                continue

            # Check if we already have mood/energy for today (skip if so)
            today_str = get_today().isoformat()
            summary = await queries.get_daily_summary(today_str)
            if summary and summary.get("mood"):
                continue

            await _send_checkin_message()

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Evening check-in error: {e}")
            await asyncio.sleep(3600)


async def _send_checkin_message():
    """Send the evening check-in message via Telegram."""
    from telegram import Bot

    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return

    profile = await queries.get_profile()
    if not profile:
        return

    today_str = get_today().isoformat()
    meals = await queries.get_meals_for_date(today_str)
    meal_count = len(meals)

    goal = profile.get("daily_calorie_goal", 0)
    today_cal = sum(m.get("calories", 0) for m in meals)

    parts = ["Hey! Quick evening check-in:"]
    if meal_count < 3:
        parts.append(
            f"I only have {meal_count} meal{'s' if meal_count != 1 else ''} logged today "
            "-- anything else?"
        )
    if goal and today_cal > 0:
        pct = round(today_cal / goal * 100)
        parts.append(f"Nutrition: {today_cal}/{goal} kcal ({pct}%)")
    parts.append("How's your energy and mood? (1-5 each)")
    parts.append("Any exercise today?")

    bot = Bot(token=token)
    await bot.send_message(chat_id=chat_id, text="\n".join(parts))
    logger.info("Evening check-in message sent")


async def _daily_compression_loop():
    """Run daily data compression at 3 AM."""
    while True:
        try:
            config = get_config()
            tz = ZoneInfo(config.get("timezone", "UTC"))
            now = datetime.now(tz)
            target = now.replace(hour=3, minute=0, second=0, microsecond=0)
            if target <= now:
                target += timedelta(days=1)

            wait_seconds = (target - now).total_seconds()
            logger.info(f"Next health data compression in {wait_seconds / 3600:.1f} hours")
            await asyncio.sleep(wait_seconds)

            # Find and compress expired dates
            expired_dates = await queries.get_uncompressed_dates(older_than_days=3)
            for date_str in expired_dates:
                try:
                    await queries.compress_day(date_str)
                    logger.info(f"Compressed health data for {date_str}")
                except Exception as e:
                    logger.error(f"Failed to compress {date_str}: {e}")

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Health compression error: {e}")
            await asyncio.sleep(3600)
