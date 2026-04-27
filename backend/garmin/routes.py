"""Garmin data API endpoints for the dashboard."""
import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from fastapi import APIRouter

from backend.config import get_config
from backend.database import get_db

logger = logging.getLogger("lifeboard.garmin")

router = APIRouter(prefix="/api/garmin", tags=["garmin"])


# ─────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────


def _user_tz() -> ZoneInfo:
    return ZoneInfo(get_config().get("timezone", "UTC"))


def _to_local_dt(value: Any) -> datetime | None:
    """
    Coerce Garmin's *Local bedtime/wake field → wall-clock datetime.

    Garmin encodes `*Local` fields as the user's local wall-clock interpreted
    as a UTC epoch (ms). So 22:51 Tokyo time becomes ms = epoch of "2026-04-26
    22:51 UTC". To recover the user's clock value, format the ms as UTC.

    Accepts numeric (int/float), numeric-looking strings (SQLite TEXT affinity
    can store integers as text), and ISO-8601 strings.
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return _epoch_ms_as_utc_clock(int(value))
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return None
        if s.lstrip("-").isdigit():
            try:
                return _epoch_ms_as_utc_clock(int(s))
            except (OverflowError, OSError, ValueError):
                return None
        s = s.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(s)
        except ValueError:
            if "." in s:
                s = s.split(".")[0]
            try:
                dt = datetime.fromisoformat(s)
            except ValueError:
                return None
        # ISO `*Local` from Garmin is bare wall-clock — treat as such; if
        # tz-aware came in, normalize to user TZ for display.
        if dt.tzinfo is None:
            return dt
        return dt.astimezone(_user_tz()).replace(tzinfo=None)
    return None


def _epoch_ms_as_utc_clock(ms: int) -> datetime | None:
    """Read epoch ms as if its UTC representation IS the local wall-clock."""
    try:
        secs = ms / 1000 if ms >= 10_000_000_000 else float(ms)
        return datetime.fromtimestamp(secs, tz=timezone.utc).replace(tzinfo=None)
    except (OverflowError, OSError, ValueError):
        return None


def _clock_str(dt: datetime | None) -> str | None:
    return dt.strftime("%H:%M") if dt else None


def _to_minutes_from_6pm(dt: datetime | None) -> float | None:
    """
    Map a wall-clock datetime onto 'minutes since 18:00 of the previous day' so
    bedtimes that span midnight average correctly. 18:00 → 0, 22:00 → 240,
    01:00 → 420, 07:00 → 780. Wraps at 24h to keep a stable scale.
    """
    if dt is None:
        return None
    m = dt.hour * 60 + dt.minute
    # Anchor at 18:00. Times before noon are "next day", offset by +24h.
    anchor = 18 * 60
    rel = m - anchor
    if rel < 0:
        rel += 24 * 60
    # That gives bedtimes 18:00–17:59 a value 0..1439. Clamp wakes the same way.
    return float(rel)


def _minutes_from_6pm_to_clock(m: float | None) -> str | None:
    if m is None or math.isnan(m):
        return None
    total = (int(round(m)) + 18 * 60) % (24 * 60)
    return f"{total // 60:02d}:{total % 60:02d}"


def _stats(values: list[float]) -> dict | None:
    """Mean, min, max, stdev, count for a non-empty list of numbers."""
    vals = [v for v in values if v is not None]
    if not vals:
        return None
    n = len(vals)
    mean = sum(vals) / n
    if n > 1:
        var = sum((v - mean) ** 2 for v in vals) / (n - 1)
        stdev = math.sqrt(var)
    else:
        stdev = 0.0
    return {
        "mean": round(mean, 2),
        "min": round(min(vals), 2),
        "max": round(max(vals), 2),
        "stdev": round(stdev, 2),
        "n": n,
    }


def _delta_direction(curr: float | None, prior: float | None,
                     lower_is_better: bool = False) -> str:
    if curr is None or prior is None:
        return "flat"
    if abs(curr - prior) < 1e-6:
        return "flat"
    rising = curr > prior
    if lower_is_better:
        return "down" if rising else "up"  # invert: lower is "good"
    return "up" if rising else "down"


# Metric definitions: which DB column → human label, and whether lower is "better"
METRIC_DEFS = [
    # (key,                column,                      label,             unit,    lower_is_better)
    ("score",             "sleep_score",              "Sleep score",      None,     False),
    ("duration_min",      None,                        "Total sleep",     "min",    False),  # derived from sleep_duration_seconds
    ("deep_min",          None,                        "Deep sleep",      "min",    False),
    ("light_min",         None,                        "Light sleep",     "min",    False),
    ("rem_min",           None,                        "REM sleep",       "min",    False),
    ("awake_min",         None,                        "Awake time",      "min",    True),
    ("awake_count",       "awake_count",              "Awakenings",       None,     True),
    ("avg_sleep_stress",  "avg_sleep_stress",         "Sleep stress",     None,     True),
    ("avg_respiration",   "avg_respiration",          "Avg respiration", "br/min", False),
    ("avg_spo2",          "avg_spo2",                 "Avg SpO₂",         "%",      False),
    ("lowest_spo2",       "lowest_spo2",              "Lowest SpO₂",      "%",      False),
    ("rhr",               "resting_heart_rate",       "Resting HR",      "bpm",    True),
    ("stress_avg",        "stress_avg",               "Daytime stress",   None,     True),
    ("steps",             "steps",                    "Steps",            None,     False),
    ("body_battery_max",  "body_battery_max",         "Body Battery max", None,     False),
    ("body_battery_min",  "body_battery_min",         "Body Battery min", None,     True),
]


# ─────────────────────────────────────────────────────────────────────────
# Dashboard endpoint
# ─────────────────────────────────────────────────────────────────────────


@router.get("/dashboard")
async def garmin_dashboard(days: int = 30):
    """
    Rich aggregated view for the health UI.
    Returns: last_night (with hypnogram), timeline, stats, prior-period comparison.
    """
    days = max(1, min(days, 365))
    db = await get_db()
    try:
        # Pull current window (most recent N days that have rows)
        cur = await db.execute(
            "SELECT * FROM garmin_daily_summary ORDER BY date DESC LIMIT ?",
            (days,),
        )
        current_rows = [dict(r) for r in await cur.fetchall()]

        # Pull prior window of equal length, immediately before current window
        prior_rows: list[dict] = []
        if current_rows:
            oldest_date = current_rows[-1]["date"]
            cur = await db.execute(
                "SELECT * FROM garmin_daily_summary WHERE date < ? ORDER BY date DESC LIMIT ?",
                (oldest_date, days),
            )
            prior_rows = [dict(r) for r in await cur.fetchall()]

        # Last-night hypnogram
        hypnogram: list[dict] = []
        last_night_row: dict | None = current_rows[0] if current_rows else None
        if last_night_row:
            cur = await db.execute(
                "SELECT seq, start_ts, end_ts, stage FROM garmin_sleep_levels "
                "WHERE date = ? ORDER BY seq",
                (last_night_row["date"],),
            )
            hypnogram = [dict(r) for r in await cur.fetchall()]
    finally:
        await db.close()

    if not current_rows:
        return {
            "window_days": days,
            "last_night": None,
            "timeline": [],
            "stats": {},
            "comparison": {},
        }

    # ── Build last_night detail ──────────────────────────────────────────
    ln = last_night_row or {}
    bed_dt = _to_local_dt(ln.get("bedtime_iso"))
    wake_dt = _to_local_dt(ln.get("wake_iso"))
    last_night = {
        "date":              ln.get("date"),
        "score":             ln.get("sleep_score"),
        "score_feedback":    ln.get("sleep_score_feedback"),
        "score_insight":     ln.get("sleep_score_insight"),
        "duration_seconds":  ln.get("sleep_duration_seconds"),
        "bedtime":           _clock_str(bed_dt),
        "wake":              _clock_str(wake_dt),
        "bedtime_iso":       bed_dt.isoformat() if bed_dt else None,
        "wake_iso":          wake_dt.isoformat() if wake_dt else None,
        "stages": {
            "deep":   ln.get("sleep_deep_seconds"),
            "light":  ln.get("sleep_light_seconds"),
            "rem":    ln.get("sleep_rem_seconds"),
            "awake":  ln.get("sleep_awake_seconds"),
        },
        "awake_count":     ln.get("awake_count"),
        "avg_sleep_stress": ln.get("avg_sleep_stress"),
        "avg_respiration": ln.get("avg_respiration"),
        "avg_spo2":        ln.get("avg_spo2"),
        "lowest_spo2":     ln.get("lowest_spo2"),
        "nap_seconds":     ln.get("nap_seconds"),
        "resting_hr":      ln.get("resting_heart_rate"),
        "body_battery_max": ln.get("body_battery_max"),
        "body_battery_min": ln.get("body_battery_min"),
        "steps":           ln.get("steps"),
        "steps_goal":      ln.get("steps_goal"),
        "hypnogram":       [
            {"start_ts": s["start_ts"], "end_ts": s["end_ts"], "stage": s["stage"]}
            for s in hypnogram
        ],
    }

    # ── Timeline (oldest → newest for chart-friendliness) ────────────────
    timeline = []
    for r in reversed(current_rows):
        b = _to_local_dt(r.get("bedtime_iso"))
        w = _to_local_dt(r.get("wake_iso"))
        timeline.append({
            "date":             r["date"],
            "score":            r.get("sleep_score"),
            "duration_seconds": r.get("sleep_duration_seconds"),
            "deep":             r.get("sleep_deep_seconds"),
            "light":            r.get("sleep_light_seconds"),
            "rem":              r.get("sleep_rem_seconds"),
            "awake":            r.get("sleep_awake_seconds"),
            "awake_count":      r.get("awake_count"),
            "bedtime":          _clock_str(b),
            "wake":             _clock_str(w),
            "bedtime_min_from_6pm": _to_minutes_from_6pm(b),
            "wake_min_from_6pm":    _to_minutes_from_6pm(w),
            "rhr":              r.get("resting_heart_rate"),
            "stress_avg":       r.get("stress_avg"),
            "steps":            r.get("steps"),
            "body_battery_max": r.get("body_battery_max"),
            "body_battery_min": r.get("body_battery_min"),
            "avg_spo2":         r.get("avg_spo2"),
            "avg_respiration":  r.get("avg_respiration"),
            "avg_sleep_stress": r.get("avg_sleep_stress"),
        })

    # ── Stats over the window ────────────────────────────────────────────
    def _series(rows: list[dict], key: str) -> list[float]:
        if key == "duration_min":
            return [r["sleep_duration_seconds"] / 60 for r in rows if r.get("sleep_duration_seconds")]
        if key == "deep_min":
            return [r["sleep_deep_seconds"] / 60 for r in rows if r.get("sleep_deep_seconds")]
        if key == "light_min":
            return [r["sleep_light_seconds"] / 60 for r in rows if r.get("sleep_light_seconds")]
        if key == "rem_min":
            return [r["sleep_rem_seconds"] / 60 for r in rows if r.get("sleep_rem_seconds")]
        if key == "awake_min":
            return [r["sleep_awake_seconds"] / 60 for r in rows if r.get("sleep_awake_seconds")]
        col = next((c for k, c, *_ in METRIC_DEFS if k == key), None)
        if not col:
            return []
        return [r[col] for r in rows if r.get(col) is not None]

    stats: dict[str, Any] = {}
    for key, _col, _label, _unit, _lib in METRIC_DEFS:
        s = _stats(_series(current_rows, key))
        if s:
            stats[key] = s

    # Bedtime / wake — circular-aware mean using "minutes from 6pm"
    def _clock_stats(rows: list[dict], col: str) -> dict | None:
        mins = []
        for r in rows:
            dt = _to_local_dt(r.get(col))
            v = _to_minutes_from_6pm(dt)
            if v is not None:
                mins.append(v)
        if not mins:
            return None
        s = _stats(mins)
        if not s:
            return None
        return {
            "mean_clock": _minutes_from_6pm_to_clock(s["mean"]),
            "earliest":   _minutes_from_6pm_to_clock(s["min"]),
            "latest":     _minutes_from_6pm_to_clock(s["max"]),
            "stdev_min":  s["stdev"],
            "n":          s["n"],
        }

    stats["bedtime"] = _clock_stats(current_rows, "bedtime_iso")
    stats["wake"]    = _clock_stats(current_rows, "wake_iso")

    # ── Comparison vs prior window ───────────────────────────────────────
    comparison: dict[str, Any] = {}
    if prior_rows:
        for key, _col, _label, _unit, lower_better in METRIC_DEFS:
            curr_s = _stats(_series(current_rows, key))
            prior_s = _stats(_series(prior_rows, key))
            if not curr_s or not prior_s:
                continue
            comparison[key] = {
                "current":    curr_s["mean"],
                "prior":      prior_s["mean"],
                "delta":      round(curr_s["mean"] - prior_s["mean"], 2),
                "direction":  _delta_direction(curr_s["mean"], prior_s["mean"], lower_better),
                "lower_is_better": lower_better,
            }
        # Bedtime/wake comparisons (circular)
        for key, col in (("bedtime", "bedtime_iso"), ("wake", "wake_iso")):
            cs = _clock_stats(current_rows, col)
            ps = _clock_stats(prior_rows, col)
            if cs and ps:
                comparison[key] = {
                    "current": cs["mean_clock"],
                    "prior":   ps["mean_clock"],
                    "delta_min": round(
                        ((_to_minutes_from_6pm(_to_local_dt(0)) or 0)),  # placeholder; real diff below
                        0,
                    ),
                }
                # Real signed minute diff (handle wrap)
                cm = sum([_to_minutes_from_6pm(_to_local_dt(r.get(col))) or 0 for r in current_rows]) / len(current_rows)
                pm = sum([_to_minutes_from_6pm(_to_local_dt(r.get(col))) or 0 for r in prior_rows]) / len(prior_rows)
                diff = cm - pm
                comparison[key]["delta_min"] = round(diff, 1)

    # Metric metadata for the frontend
    metric_meta = {
        k: {"label": label, "unit": unit, "lower_is_better": lib}
        for k, _c, label, unit, lib in METRIC_DEFS
    }
    metric_meta["bedtime"] = {"label": "Bedtime",  "unit": None, "lower_is_better": False}
    metric_meta["wake"]    = {"label": "Wake time","unit": None, "lower_is_better": False}

    return {
        "window_days": days,
        "last_night":  last_night,
        "timeline":    timeline,
        "stats":       stats,
        "comparison":  comparison,
        "metric_meta": metric_meta,
        "prior_window_days": len(prior_rows),
    }


# ─────────────────────────────────────────────────────────────────────────
# Legacy summary endpoint (kept; HRV stripped)
# ─────────────────────────────────────────────────────────────────────────


@router.get("/summary")
async def garmin_summary(range: str = "compact"):
    """Legacy summary for any callers that still depend on it. HRV omitted."""
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
