"""
Health & Body agent — nudge checks.
Returns a list of {text, severity, agent} dicts for the dashboard notification bar.
"""
from datetime import date, datetime
from backend.config import get_today
from backend.agents.health_body import queries


async def check_nudges() -> list[dict]:
    """Return active health nudges."""
    nudges = []
    today_str = get_today().isoformat()

    profile = await queries.get_profile()
    if not profile:
        nudges.append({
            "text": "Health profile not set up yet — tell the Telegram bot your height, weight, and age",
            "severity": "info",
            "agent": "health_body",
        })
        return nudges

    goal = profile.get("daily_calorie_goal", 0)

    # Check today's calorie intake vs goal
    if goal:
        meals = await queries.get_meals_for_date(today_str)
        today_cal = sum(m.get("calories", 0) for m in meals)
        if today_cal > 0:
            pct = round(today_cal / goal * 100)
            if pct >= 120:
                nudges.append({
                    "text": f"Over calorie goal: {today_cal}/{goal} kcal ({pct}%)",
                    "severity": "warning",
                    "agent": "health_body",
                })

    # Check if no meals logged after 2 PM
    now = datetime.now()
    if now.hour >= 14:
        meals = await queries.get_meals_for_date(today_str)
        if not meals:
            nudges.append({
                "text": "No meals logged today",
                "severity": "info",
                "agent": "health_body",
            })

    return nudges
