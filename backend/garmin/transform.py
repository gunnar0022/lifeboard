"""
Transform raw Garmin API responses into flat dicts matching garmin_daily_summary schema.
Also exposes hypnogram flattening (sleepLevels array → per-segment rows).
"""
import json
import logging

logger = logging.getLogger("lifeboard.garmin")


# Garmin sleep level activityLevel codes:
#  0 = deep, 1 = light, 2 = REM, 3 = awake (and rare values for unmeasurable)
_LEVEL_CODE_TO_STAGE = {
    0: "deep",
    1: "light",
    2: "rem",
    3: "awake",
}


def transform_daily(date_str: str, stats: dict, body_battery: list,
                     sleep: dict, hrv: dict, activities: list,
                     stress: dict) -> dict:
    """
    Combine all Garmin data sources for a single day into a flat row
    matching the garmin_daily_summary schema.
    """
    row = {"date": date_str}

    # --- Stats (daily summary) ---
    if stats:
        row["steps"] = stats.get("totalSteps")
        row["steps_goal"] = stats.get("dailyStepGoal")
        row["distance_meters"] = stats.get("totalDistanceMeters")
        row["floors_climbed"] = stats.get("floorsAscended")
        row["active_calories"] = stats.get("activeKilocalories")
        row["total_calories"] = stats.get("totalKilocalories")
        row["resting_heart_rate"] = stats.get("restingHeartRate")

        # Active minutes = moderate + vigorous
        moderate = stats.get("moderateIntensityMinutes") or 0
        vigorous = stats.get("vigorousIntensityMinutes") or 0
        row["active_minutes"] = moderate + vigorous if (moderate or vigorous) else None

    # --- Body Battery ---
    if body_battery:
        values = []
        for entry in body_battery:
            val = None
            if isinstance(entry, dict):
                val = entry.get("bodyBatteryLevel") or entry.get("charged")
            elif isinstance(entry, (int, float)):
                val = int(entry)
            if val is not None and val > 0:
                values.append(int(val))

        if values:
            row["body_battery_max"] = max(values)
            row["body_battery_min"] = min(values)

        # Try to extract charged/drained from the data
        if isinstance(body_battery, list) and len(body_battery) > 0:
            first = body_battery[0] if isinstance(body_battery[0], dict) else {}
            row["body_battery_charged"] = first.get("bodyBatteryChargedValue") or first.get("charged")
            row["body_battery_drained"] = first.get("bodyBatteryDrainedValue") or first.get("drained")

    # --- Sleep ---
    if sleep:
        daily_sleep = sleep.get("dailySleepDTO") or sleep
        row["sleep_duration_seconds"] = daily_sleep.get("sleepTimeSeconds")
        row["sleep_score"] = daily_sleep.get("sleepScores", {}).get("overall", {}).get("value") if isinstance(daily_sleep.get("sleepScores"), dict) else daily_sleep.get("sleepScore")

        # Per-stage seconds (these come directly on dailySleepDTO, NOT under sleepLevels —
        # sleepLevels is the per-segment timeline, see below)
        row["sleep_deep_seconds"]  = daily_sleep.get("deepSleepSeconds")
        row["sleep_light_seconds"] = daily_sleep.get("lightSleepSeconds")
        row["sleep_rem_seconds"]   = daily_sleep.get("remSleepSeconds")
        row["sleep_awake_seconds"] = daily_sleep.get("awakeSleepSeconds")

        # Bedtime / wake (local ISO strings — preserve TZ from device)
        row["bedtime_iso"] = daily_sleep.get("sleepStartTimestampLocal")
        row["wake_iso"]    = daily_sleep.get("sleepEndTimestampLocal")

        # Quality / fragmentation
        row["awake_count"]          = daily_sleep.get("awakeCount")
        row["avg_sleep_stress"]     = daily_sleep.get("avgSleepStress")
        row["avg_respiration"]      = daily_sleep.get("averageRespirationValue")
        row["avg_spo2"]             = daily_sleep.get("averageSpO2Value")
        row["lowest_spo2"]          = daily_sleep.get("lowestSpO2Value")
        row["nap_seconds"]          = daily_sleep.get("napTimeSeconds")
        row["unmeasurable_seconds"] = daily_sleep.get("unmeasurableSleepSeconds")

        # Garmin's narrative analysis
        row["sleep_score_feedback"] = daily_sleep.get("sleepScoreFeedback")
        row["sleep_score_insight"]  = daily_sleep.get("sleepScoreInsight")

    # --- HRV (still extract; will be None for users without HRV-capable wear pattern) ---
    if hrv:
        summary = hrv.get("hrvSummary") or hrv
        if isinstance(summary, dict):
            row["hrv_last_night_avg"] = summary.get("lastNightAvg") or summary.get("weeklyAvg")
            row["hrv_status"] = summary.get("status") or summary.get("hrvStatus")
            status = row.get("hrv_status")
            if status and isinstance(status, str):
                row["hrv_status"] = status.lower().replace("_", " ")

    # --- Stress ---
    if stress:
        row["stress_avg"] = stress.get("overallStressLevel") or stress.get("avgStressLevel")
        row["stress_max"] = stress.get("maxStressLevel")

    # --- Activities (workouts) ---
    if activities:
        row["workout_count"] = len(activities)
        total_secs = 0
        for act in activities:
            dur = act.get("duration") or act.get("elapsedDuration") or 0
            if dur > 100000:
                dur = dur / 1000  # was milliseconds
            total_secs += int(dur)
        row["workout_total_seconds"] = total_secs

    # --- Raw JSON blob (kept lightweight) ---
    raw = {
        "stats_keys": list((stats or {}).keys()),
        "body_battery_count": len(body_battery) if body_battery else 0,
        "sleep_keys": list((sleep or {}).keys()),
        "hrv_keys": list((hrv or {}).keys()),
        "stress_keys": list((stress or {}).keys()),
        "activity_count": len(activities) if activities else 0,
    }
    row["raw_json"] = json.dumps(raw, default=str)

    return row


def extract_sleep_levels(sleep: dict) -> list[dict]:
    """
    Pull the per-segment hypnogram out of the sleep payload.
    Returns a list of dicts ready to be inserted into garmin_sleep_levels.

    Garmin returns either:
      - dailySleepDTO.sleepLevels: list of {startGMT, endGMT, activityLevel}
      - top-level sleepLevels: same shape
    The DTO version is nested per-stage seconds (deep/light/rem/awake) — we use that
    for totals, not for the timeline. The TIMELINE comes from a *list* of segments.
    """
    if not sleep:
        return []

    # The timeline can live at top level OR in a list-shaped dailySleepDTO key
    candidates = []
    top_levels = sleep.get("sleepLevels")
    if isinstance(top_levels, list):
        candidates = top_levels
    else:
        # Some payloads put it under sleepMovement-adjacent keys
        dto = sleep.get("dailySleepDTO") or {}
        nested = dto.get("sleepLevels")
        if isinstance(nested, list):
            candidates = nested

    out = []
    for i, seg in enumerate(candidates):
        if not isinstance(seg, dict):
            continue
        start_gmt = seg.get("startGMT") or seg.get("startTimeGMT")
        end_gmt   = seg.get("endGMT")   or seg.get("endTimeGMT")
        level     = seg.get("activityLevel")
        if start_gmt is None or end_gmt is None or level is None:
            continue
        # activityLevel might be an int code or a float; normalize to int
        try:
            code = int(round(float(level)))
        except (ValueError, TypeError):
            continue
        stage = _LEVEL_CODE_TO_STAGE.get(code)
        if stage is None:
            continue  # skip unmeasurable / unknown
        # Convert ISO-8601 → epoch ms if needed
        start_ts = _to_epoch_ms(start_gmt)
        end_ts   = _to_epoch_ms(end_gmt)
        if start_ts is None or end_ts is None or end_ts <= start_ts:
            continue
        out.append({
            "seq": i,
            "start_ts": start_ts,
            "end_ts": end_ts,
            "stage": stage,
        })
    return out


def _to_epoch_ms(value) -> int | None:
    """Accepts an int (already epoch ms), a long-int seconds, or an ISO-8601 string."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        v = int(value)
        # Heuristic: < 10^11 means seconds, else ms
        return v * 1000 if v < 10_000_000_000 else v
    if isinstance(value, str):
        try:
            from datetime import datetime, timezone
            # Garmin sometimes uses "2026-04-26T13:30:00.0" without TZ — assume UTC
            s = value.replace("Z", "+00:00")
            try:
                dt = datetime.fromisoformat(s)
            except ValueError:
                # Strip fractional seconds
                if "." in s:
                    s = s.split(".")[0]
                dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return int(dt.timestamp() * 1000)
        except Exception:
            return None
    return None
