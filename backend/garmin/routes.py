"""Garmin data API endpoints for the dashboard."""
import logging
from fastapi import APIRouter
from backend.database import get_db

logger = logging.getLogger("lifeboard.garmin")

router = APIRouter(prefix="/api/garmin", tags=["garmin"])


@router.get("/summary")
async def garmin_summary(range: str = "compact"):
    """
    Get Garmin health data for the dashboard tile.
    range: 'compact' (today+yesterday), '7d', '30d'
    """
    db = await get_db()
    try:
        if range == "compact":
            limit = 2
        elif range == "7d":
            limit = 7
        elif range == "30d":
            limit = 30
        else:
            limit = 2

        cursor = await db.execute(
            "SELECT * FROM garmin_daily_summary ORDER BY date DESC LIMIT ?",
            (limit,),
        )
        rows = [dict(r) for r in await cursor.fetchall()]

        days = []
        for row in rows:
            days.append({
                "date": row["date"],
                "body_battery": {
                    "max": row.get("body_battery_max"),
                    "min": row.get("body_battery_min"),
                    "charged": row.get("body_battery_charged"),
                    "drained": row.get("body_battery_drained"),
                },
                "hrv": {
                    "avg_ms": row.get("hrv_last_night_avg"),
                    "status": row.get("hrv_status"),
                },
                "resting_hr": row.get("resting_heart_rate"),
                "stress": {
                    "avg": row.get("stress_avg"),
                    "max": row.get("stress_max"),
                },
                "sleep": {
                    "duration_seconds": row.get("sleep_duration_seconds"),
                    "score": row.get("sleep_score"),
                    "deep_seconds": row.get("sleep_deep_seconds"),
                    "light_seconds": row.get("sleep_light_seconds"),
                    "rem_seconds": row.get("sleep_rem_seconds"),
                    "awake_seconds": row.get("sleep_awake_seconds"),
                },
                "steps": row.get("steps"),
                "steps_goal": row.get("steps_goal"),
                "distance_meters": row.get("distance_meters"),
                "active_calories": row.get("active_calories"),
                "total_calories": row.get("total_calories"),
                "active_minutes": row.get("active_minutes"),
                "workouts": {
                    "count": row.get("workout_count") or 0,
                    "total_seconds": row.get("workout_total_seconds") or 0,
                },
            })

        return {"range": range, "days": days}
    finally:
        await db.close()


@router.get("/status")
async def garmin_status():
    """Get the last ingest run status and timing."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM garmin_ingest_log ORDER BY id DESC LIMIT 1"
        )
        row = await cursor.fetchone()
        if not row:
            return {"last_run": None, "status": "never", "message": "No ingest runs yet"}

        return {
            "last_run": row["run_at"],
            "status": row["status"],
            "dates_updated": row["dates_updated"],
            "error_message": row["error_message"],
            "duration_ms": row["duration_ms"],
        }
    finally:
        await db.close()


@router.post("/ingest")
async def trigger_ingest():
    """Manually trigger a Garmin data ingest. Disabled until session is established."""
    # Safety: don't allow API-triggered ingests until we have a valid session
    from pathlib import Path
    session_file = Path(__file__).parent.parent.parent / "data" / ".garmin_browser_session" / "state.json"
    if not session_file.exists():
        return {"ok": False, "error": "No Garmin session established yet. Run the ingest manually first."}

    from backend.garmin.ingest import run_ingest
    try:
        result = await run_ingest()
        return result
    except Exception as e:
        return {"ok": False, "error": str(e)}
