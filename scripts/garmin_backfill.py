"""
Garmin backfill — pulls a custom date range from Garmin Connect and upserts
into the DB. Reuses the same scraper, transform, and upsert logic as the
scheduled ingest (backend.garmin.ingest), just over an arbitrary range.

Usage:
    python3 -m scripts.garmin_backfill --since 2026-05-28
    python3 -m scripts.garmin_backfill --since 2026-05-28 --until 2026-06-09

Requires fresh browser cookies in data/.garmin_cookies and the
connect-csrf-token in data/.garmin_csrf (see backend/garmin/scraper.py).
"""
import argparse
import asyncio
import logging
from datetime import date, timedelta

from backend.garmin.ingest import (
    _get_data_source,
    upsert_daily_summary,
    upsert_sleep_levels,
    log_ingest,
)
from backend.garmin.transform import transform_daily, extract_sleep_levels

logger = logging.getLogger("lifeboard.garmin.backfill")


def _daterange(start: date, end: date):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


async def run_backfill(since: date, until: date):
    source, source_type = _get_data_source()
    logger.info(f"Backfilling {since.isoformat()} → {until.isoformat()} via {source_type}")

    updated, failed = [], []
    try:
        for d in _daterange(since, until):
            date_str = d.isoformat()
            try:
                stats = source.get_stats(date_str)
                body_battery_raw = source.get_body_battery(date_str)
                sleep = source.get_sleep_data(date_str)
                hrv = source.get_hrv_data(date_str)
                activities = source.get_activities_by_date(date_str)
                stress = source.get_stress_data(date_str)

                body_battery = body_battery_raw if isinstance(body_battery_raw, list) else []

                row = transform_daily(date_str, stats, body_battery, sleep, hrv, activities, stress)
                await upsert_daily_summary(row)
                segments = extract_sleep_levels(sleep)
                if segments:
                    await upsert_sleep_levels(date_str, segments)
                updated.append(date_str)
                logger.info(
                    f"  {date_str}: steps={row.get('steps')}, bb_max={row.get('body_battery_max')}, "
                    f"sleep={row.get('sleep_score')}, segments={len(segments)}"
                )
            except Exception as e:
                failed.append(date_str)
                logger.warning(f"  {date_str}: FAILED — {e}")
    finally:
        if hasattr(source, "close"):
            source.close()

    await log_ingest(
        status="success" if updated else "failure",
        dates_updated=updated,
        error_message=(f"failed: {', '.join(failed)}" if failed else None),
    )
    logger.info(f"Backfill complete: {len(updated)} days upserted, {len(failed)} failed")
    if failed:
        logger.info(f"Failed dates: {', '.join(failed)}")
    return {"ok": bool(updated), "updated": updated, "failed": failed, "source": source_type}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
    parser = argparse.ArgumentParser(description="Backfill Garmin data over a date range.")
    parser.add_argument("--since", required=True, help="Start date (inclusive), YYYY-MM-DD")
    parser.add_argument("--until", default=date.today().isoformat(), help="End date (inclusive), YYYY-MM-DD (default: today)")
    args = parser.parse_args()

    since = date.fromisoformat(args.since)
    until = date.fromisoformat(args.until)
    asyncio.run(run_backfill(since, until))
