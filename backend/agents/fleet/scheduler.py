"""
Dr. Fleet — background scheduler.
- Daily compression of resolved concerns > 90 days old (delete logs, mark compressed).
- Orphaned session recovery on startup (LM-41).
"""
import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from backend.config import get_config
from backend.agents.fleet import queries
from backend.agents.fleet.telegram import clear_session

logger = logging.getLogger(__name__)

_compression_task: asyncio.Task | None = None


async def start_scheduler():
    """Start the daily compression task and recover orphaned sessions."""
    global _compression_task

    # LM-41: Recover orphaned sessions on startup
    await _recover_orphaned_sessions()

    _compression_task = asyncio.create_task(_daily_compression_loop())
    logger.info("Fleet compression scheduler started")


async def stop_scheduler():
    global _compression_task
    if _compression_task and not _compression_task.done():
        _compression_task.cancel()
        try:
            await _compression_task
        except asyncio.CancelledError:
            pass
    _compression_task = None
    logger.info("Fleet compression scheduler stopped")


async def _recover_orphaned_sessions():
    """LM-41: Close any visits with null ended_at on startup."""
    try:
        orphaned = await queries.get_orphaned_visits()
        if orphaned:
            for visit in orphaned:
                await queries.close_orphaned_visit(visit["id"])
                logger.info(f"Closed orphaned Fleet visit #{visit['id']}")
            # Clear in-memory session lock just in case
            clear_session()
    except Exception as e:
        logger.error(f"Orphaned session recovery failed: {e}")


async def _daily_compression_loop():
    """Run concern compression daily at 4 AM."""
    config = get_config()
    tz_name = config.get("timezone", "UTC")
    tz = ZoneInfo(tz_name)

    while True:
        try:
            now = datetime.now(tz)
            target = now.replace(hour=4, minute=0, second=0, microsecond=0)
            if now >= target:
                from datetime import timedelta
                target = target + timedelta(days=1)

            wait_seconds = (target - now).total_seconds()
            logger.info(f"Fleet compression: next run in {wait_seconds / 3600:.1f}h")
            await asyncio.sleep(wait_seconds)

            await _run_compression()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Fleet compression loop error: {e}")
            await asyncio.sleep(3600)


async def _run_compression():
    """Compress resolved concerns older than 90 days."""
    try:
        concerns = await queries.get_concerns_for_compression()
        if not concerns:
            logger.info("Fleet compression: no concerns to compress")
            return

        for c in concerns:
            await queries.compress_concern(c["id"])
            logger.info(f"Compressed Fleet concern #{c['id']}: {c['title']}")

        logger.info(f"Fleet compression: compressed {len(concerns)} concern(s)")
    except Exception as e:
        logger.error(f"Fleet compression failed: {e}")
