"""
Health & Body agent — LLM system prompt with dynamic state injection.
Rebuilt on every message with current health data.
"""
from datetime import date
from backend.config import get_config
from backend.agents.health_body import queries


async def build_system_prompt() -> str:
    """Build the Health & Body system prompt with injected current state."""
    config = get_config()
    today = date.today()
    day_name = today.strftime("%A")
    date_str = today.strftime("%B %d, %Y")
    today_iso = today.isoformat()

    # Profile
    profile = await queries.get_profile()
    profile_str = _format_profile(profile)

    # Today's nutrition
    meals_today = await queries.get_meals_for_date(today_iso)
    nutrition_str = _format_today_nutrition(meals_today, profile)

    # Today's exercise
    exercises_today = await queries.get_exercises_for_date(today_iso)
    exercise_str = _format_today_exercise(exercises_today)

    # Mood/energy
    summary = await queries.get_daily_summary(today_iso)
    mood_str = _format_mood_energy(summary)

    # Recent 3-day overview
    recent = await queries.get_recent_detail(days=3)
    recent_str = _format_recent(recent)

    # Latest weight
    latest = await queries.get_latest_measurement()
    weight_str = _format_latest_weight(latest)

    # Medical documents count (from unified documents table)
    try:
        from backend.documents import get_medical_summary
        med_summary = await get_medical_summary()
        docs_str = f"MEDICAL RECORDS: {med_summary['total']} documents on file"
    except Exception:
        docs_str = "MEDICAL RECORDS: None"

    # Active health concerns
    try:
        from backend.agents.fleet.queries import get_active_concerns
        active_concerns = await get_active_concerns()
        concerns_str = _format_active_concerns(active_concerns)
    except Exception:
        concerns_str = "ACTIVE CONCERNS: None"

    # Onboarding
    onboarding_note = ""
    if not profile:
        onboarding_note = """
IMPORTANT: No health profile exists yet. Start an onboarding conversation:
Ask for height (cm), weight (kg), age, and activity level (sedentary/light/moderate/active/very_active).
Then suggest a daily calorie goal using Mifflin-St Jeor equation and let them confirm or override.
Use update_profile to save everything.
"""

    return f"""You are the Health & Body agent for LifeBoard. You help a single user track nutrition, exercise, mood, energy, body measurements, and medical records through natural conversation.

TODAY: {day_name}, {date_str}
{onboarding_note}
{profile_str}

{nutrition_str}

{exercise_str}

{mood_str}

{recent_str}

{weight_str}

{docs_str}

{concerns_str}

RULES:
- When the user reports food ("Had katsu curry for lunch", "ate a convenience store bento"), estimate calories, protein (g), carbs (g), and fat (g). Use reasonable estimates for Japanese food portions. Log silently with log_meal — NO confirmation step needed.
- When the user reports exercise ("Jogged 30 minutes", "gym for an hour"), estimate calorie burn using their profile (weight, activity level). Log with log_exercise. NEVER mention the specific calorie burn number in your reply — just acknowledge the exercise naturally.
- For mood/energy, use 1-5 scales (1=very low, 5=excellent). Use set_mood_energy.
- Weight is stored in grams internally. Convert from user input: "81kg" = 81000, "81.5kg" = 81500, "180lbs" = ~81600. When user mentions a weigh-in, use log_measurement (which also updates profile weight).
- Medical documents and photos are handled by a separate classifier system. Do NOT try to store files — just respond conversationally if the user mentions documents.
- For evening check-in responses, parse everything from one natural message: mood, energy, exercise, any meals.
- ACT IMMEDIATELY on ALL actions including deletes. Do NOT ask the user to confirm. Just do it and report what you did. If the user says "remove that meal" or "delete the last exercise", identify the item from context and execute the delete action directly.
- Resolve relative dates ("yesterday", "this morning") using today's date above.
- If the user asks about nutrition on a day older than 3 days, daily totals will be available but individual meals won't. Just present whatever data exists without explaining the difference.
- For multi-part messages (meal + exercise + mood in one message), use multi_action to log everything at once.
- When the user mentions an update about a health concern (e.g., "back pain was better today", "headache hit again at 3pm"), log it with log_concern_update. Match the update to the most relevant active concern by title/context. If ambiguous, use clarify with concern titles as options. Concern logs are casual notes, not formal entries.

RESPOND WITH A SINGLE JSON OBJECT:
- "action": one of the action names below (NEVER use "respond" when the user asked you to do something — use the actual action name)
- "data": object with the action's fields
- "reply": string message for the user
CRITICAL: When the user asks to delete, edit, or log something, you MUST return the specific action (delete_meal, edit_meal, log_meal, etc.) — NOT "respond". Using "respond" does nothing to the database. Only use "respond" for conversational replies where no database action is needed.

AVAILABLE ACTIONS:

Write actions — Nutrition:
- log_meal: data={{description (str), calories (int), protein_g (int, optional), carbs_g (int, optional), fat_g (int, optional), date (ISO, optional), time (HH:MM, optional)}}
- edit_meal: data={{meal_id (int), ...fields to update}}
- delete_meal: data={{meal_id (int)}}

Write actions — Exercise:
- log_exercise: data={{description (str), duration_minutes (int), estimated_calories (int), date (ISO, optional), time (HH:MM, optional)}}
- edit_exercise: data={{exercise_id (int), ...fields to update}}
- delete_exercise: data={{exercise_id (int)}}

Write actions — Mood/Energy:
- set_mood_energy: data={{mood (1-5, optional), energy (1-5, optional), date (ISO, optional)}}

Write actions — Measurements:
- log_measurement: data={{weight_g (int), date (ISO, optional), notes (optional)}}

Write actions — Profile:
- update_profile: data={{height_cm (float), weight_g (int), age (int), activity_level (sedentary/light/moderate/active/very_active), daily_calorie_goal (int), evening_checkin_time (HH:MM)}}

Write actions — Health Concerns:
- log_concern_update: data={{content (str), concern_id (int, optional — omit if only one active concern)}}

Read actions:
- get_profile: data={{}}
- get_today_nutrition: data={{}}
- get_active_concerns: data={{}}
- get_recent_detail: data={{days (int, default 3)}}
- get_heatmap_data: data={{days (int, default 90)}}
- get_measurements: data={{limit (int, default 30)}}
Meta actions:
- respond: Just reply, no DB write.
- clarify: data={{options (list of strings)}} — Inline keyboard buttons.
- multi_action: data={{actions (list of action objects)}} — Execute multiple. Max 10.
"""


def _format_profile(profile: dict | None) -> str:
    if not profile:
        return "PROFILE: Not set up yet"
    height = profile.get("height_cm", "?")
    weight_kg = round(profile["weight_g"] / 1000, 1) if profile.get("weight_g") else "?"
    age = profile.get("age", "?")
    activity = profile.get("activity_level", "?")
    goal = profile.get("daily_calorie_goal", "?")
    return f"PROFILE: Height {height}cm | Weight {weight_kg}kg | Age {age} | Activity: {activity} | Daily goal: {goal} kcal"


def _format_today_nutrition(meals: list[dict], profile: dict | None) -> str:
    goal = (profile or {}).get("daily_calorie_goal", 0)
    if not meals:
        goal_str = f" (goal: {goal} kcal)" if goal else ""
        return f"TODAY'S INTAKE (0 meals): No meals logged{goal_str}"
    total_cal = sum(m.get("calories", 0) for m in meals)
    total_pro = sum(m.get("protein_g", 0) for m in meals)
    total_carb = sum(m.get("carbs_g", 0) for m in meals)
    total_fat = sum(m.get("fat_g", 0) for m in meals)
    goal_str = f"/{goal}" if goal else ""
    lines = [f"TODAY'S INTAKE ({len(meals)} meals): {total_cal}{goal_str} kcal | P:{total_pro}g C:{total_carb}g F:{total_fat}g"]
    for m in meals:
        time_str = f" {m['time']}" if m.get("time") else ""
        lines.append(f"  [{m['id']}]{time_str} {m['description']} — {m['calories']} kcal")
    return "\n".join(lines)


def _format_today_exercise(exercises: list[dict]) -> str:
    if not exercises:
        return "TODAY'S EXERCISE: None logged"
    total_min = sum(e.get("duration_minutes", 0) for e in exercises)
    lines = [f"TODAY'S EXERCISE ({total_min} min total):"]
    for e in exercises:
        time_str = f" {e['time']}" if e.get("time") else ""
        lines.append(f"  [{e['id']}]{time_str} {e['description']} — {e['duration_minutes']} min")
    return "\n".join(lines)


def _format_mood_energy(summary: dict | None) -> str:
    if not summary:
        return "MOOD/ENERGY: Not set today"
    mood = summary.get("mood")
    energy = summary.get("energy")
    parts = []
    if mood:
        parts.append(f"Mood: {mood}/5")
    if energy:
        parts.append(f"Energy: {energy}/5")
    if not parts:
        return "MOOD/ENERGY: Not set today"
    return f"MOOD/ENERGY: {' | '.join(parts)}"


def _format_recent(recent: list[dict]) -> str:
    if not recent:
        return "RECENT 3 DAYS: No data"
    lines = ["RECENT 3 DAYS:"]
    for day in recent:
        meals = day.get("meals", [])
        exercises = day.get("exercises", [])
        cal = day.get("total_calories", 0)
        ex_min = day.get("total_exercise_minutes", 0)
        mood = day.get("mood")
        mood_str = f" | Mood:{mood}/5" if mood else ""
        lines.append(f"  {day['date']} ({day['day_name']}): {cal} kcal ({len(meals)} meals) | Exercise: {ex_min} min{mood_str}")
        for m in meals:
            time_str = f" {m['time']}" if m.get("time") else ""
            lines.append(f"    [meal:{m['id']}]{time_str} {m['description']} — {m['calories']} kcal")
        for e in exercises:
            time_str = f" {e['time']}" if e.get("time") else ""
            lines.append(f"    [exercise:{e['id']}]{time_str} {e['description']} — {e['duration_minutes']} min")
    return "\n".join(lines)


def _format_latest_weight(latest: dict | None) -> str:
    if not latest or not latest.get("weight_g"):
        return "LATEST WEIGHT: No measurements"
    kg = round(latest["weight_g"] / 1000, 1)
    return f"LATEST WEIGHT: {kg}kg on {latest['date']}"



def _format_active_concerns(concerns: list[dict]) -> str:
    if not concerns:
        return "ACTIVE CONCERNS: None"
    lines = [f"ACTIVE CONCERNS ({len(concerns)}):"]
    for c in concerns:
        log_count = len(c.get("logs", []))
        lines.append(f"  [#{c['id']}] {c['title']} ({log_count} logs)")
    return "\n".join(lines)
