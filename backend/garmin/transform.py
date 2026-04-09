"""
Transform raw Garmin API responses into flat dicts matching garmin_daily_summary schema.
"""
import json
import logging

logger = logging.getLogger("lifeboard.garmin")


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

        # Sleep stages
        levels = daily_sleep.get("sleepLevels") or {}
        if isinstance(levels, dict):
            row["sleep_deep_seconds"] = levels.get("deepSleepSeconds")
            row["sleep_light_seconds"] = levels.get("lightSleepSeconds")
            row["sleep_rem_seconds"] = levels.get("remSleepSeconds")
            row["sleep_awake_seconds"] = levels.get("awakeSleepSeconds")

    # --- HRV ---
    if hrv:
        summary = hrv.get("hrvSummary") or hrv
        if isinstance(summary, dict):
            row["hrv_last_night_avg"] = summary.get("lastNightAvg") or summary.get("weeklyAvg")
            row["hrv_status"] = summary.get("status") or summary.get("hrvStatus")
            # Normalize status
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
            # duration might be in seconds or milliseconds
            if dur > 100000:
                dur = dur / 1000  # was milliseconds
            total_secs += int(dur)
        row["workout_total_seconds"] = total_secs

    # --- Raw JSON blob ---
    raw = {
        "stats": stats,
        "body_battery_count": len(body_battery) if body_battery else 0,
        "sleep_keys": list((sleep or {}).keys()),
        "hrv_keys": list((hrv or {}).keys()),
        "stress_keys": list((stress or {}).keys()),
        "activity_count": len(activities) if activities else 0,
    }
    row["raw_json"] = json.dumps(raw, default=str)

    return row
