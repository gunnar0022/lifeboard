"""
Health & Body agent — ACTION_REGISTRY.
Maps action names to handler functions and required field schemas.
LM-40: Health agent has write access to fleet_concern_logs for user_log entries.
"""
from backend.agents.health_body import queries


# --- Meal handlers ---

async def handle_log_meal(data: dict) -> dict:
    return await queries.add_meal(
        meal_date=data.get("date"),
        time=data.get("time"),
        description=data["description"],
        calories=data["calories"],
        protein_g=data.get("protein_g", 0),
        carbs_g=data.get("carbs_g", 0),
        fat_g=data.get("fat_g", 0),
    )


async def handle_edit_meal(data: dict) -> dict:
    meal_id = data.pop("meal_id")
    return await queries.edit_meal(meal_id, **data)


async def handle_delete_meal(data: dict) -> bool:
    return await queries.delete_meal(data["meal_id"])


# --- Exercise handlers ---

async def handle_log_exercise(data: dict) -> dict:
    return await queries.add_exercise(
        exercise_date=data.get("date"),
        time=data.get("time"),
        description=data["description"],
        duration_minutes=data["duration_minutes"],
        estimated_calories=data["estimated_calories"],
        intensity=data.get("intensity", "light"),
    )


async def handle_edit_exercise(data: dict) -> dict:
    exercise_id = data.pop("exercise_id")
    return await queries.edit_exercise(exercise_id, **data)


async def handle_delete_exercise(data: dict) -> bool:
    return await queries.delete_exercise(data["exercise_id"])


# --- Mood/Energy handlers ---

async def handle_set_mood_energy(data: dict) -> dict:
    return await queries.set_mood_energy(
        date_str=data.get("date"),
        mood=data.get("mood"),
        energy=data.get("energy"),
    )


# --- Measurement handlers ---

async def handle_log_measurement(data: dict) -> dict:
    result = await queries.add_measurement(
        measurement_date=data.get("date"),
        weight_g=data["weight_g"],
        notes=data.get("notes"),
    )
    # Also update profile weight
    await queries.upsert_profile(weight_g=data["weight_g"])
    return result


# --- Profile handlers ---

async def handle_update_profile(data: dict) -> dict:
    return await queries.upsert_profile(**data)


# --- Concern log handler (LM-40: Health writes user_log entries) ---

async def handle_log_concern_update(data: dict) -> dict:
    from backend.agents.fleet.queries import add_concern_log, get_active_concerns
    concern_id = data.get("concern_id")
    content = data["content"]

    # If no concern_id provided, try to find active concerns
    if not concern_id:
        active = await get_active_concerns()
        if len(active) == 1:
            concern_id = active[0]["id"]
        elif not active:
            return {"error": "No active concerns to log against"}
        else:
            # Return concern options for clarify action
            return {
                "needs_clarify": True,
                "concerns": [{"id": c["id"], "title": c["title"]} for c in active],
            }

    result = await add_concern_log(concern_id, "user_log", content)
    return result


async def handle_get_active_concerns(data: dict) -> list:
    from backend.agents.fleet.queries import get_active_concerns
    return await get_active_concerns()


# --- Food database handlers ---

async def handle_add_food(data: dict) -> dict:
    return await queries.add_food(
        name=data["name"],
        calories=data["calories"],
        protein_g=data.get("protein_g", 0),
        carbs_g=data.get("carbs_g", 0),
        fat_g=data.get("fat_g", 0),
    )


async def handle_remove_food(data: dict) -> bool:
    return await queries.delete_food(data["food_id"])


async def handle_list_foods(data: dict) -> list:
    return await queries.get_foods()


# --- Read action handlers ---

async def handle_get_profile(data: dict) -> dict:
    return await queries.get_profile() or {}


async def handle_get_today_nutrition(data: dict) -> dict:
    from datetime import date as dt_date
    today_str = dt_date.today().isoformat()
    meals = await queries.get_meals_for_date(today_str)
    exercises = await queries.get_exercises_for_date(today_str)
    profile = await queries.get_profile()
    return {
        "date": today_str,
        "meals": meals,
        "exercises": exercises,
        "total_calories": sum(m.get("calories", 0) for m in meals),
        "total_protein_g": sum(m.get("protein_g", 0) for m in meals),
        "total_carbs_g": sum(m.get("carbs_g", 0) for m in meals),
        "total_fat_g": sum(m.get("fat_g", 0) for m in meals),
        "calorie_goal": (profile or {}).get("daily_calorie_goal", 0),
    }


async def handle_get_recent_detail(data: dict) -> list:
    return await queries.get_recent_detail(days=data.get("days", 3))


async def handle_get_heatmap_data(data: dict) -> list:
    return await queries.get_heatmap_data(days=data.get("days", 90))


async def handle_get_measurements(data: dict) -> list:
    return await queries.get_measurements(limit=data.get("limit", 30))



# --- ACTION_REGISTRY ---

ACTION_REGISTRY = {
    # Write — Meals
    "log_meal": {
        "handler": handle_log_meal,
        "required": ["description", "calories"],
        "optional": ["date", "time", "protein_g", "carbs_g", "fat_g"],
    },
    "edit_meal": {
        "handler": handle_edit_meal,
        "required": ["meal_id"],
        "optional": ["description", "calories", "protein_g", "carbs_g", "fat_g", "date", "time"],
    },
    "delete_meal": {
        "handler": handle_delete_meal,
        "required": ["meal_id"],
    },

    # Write — Exercises
    "log_exercise": {
        "handler": handle_log_exercise,
        "required": ["description", "duration_minutes", "estimated_calories"],
        "optional": ["date", "time", "intensity"],
    },
    "edit_exercise": {
        "handler": handle_edit_exercise,
        "required": ["exercise_id"],
        "optional": ["description", "duration_minutes", "estimated_calories", "date", "time"],
    },
    "delete_exercise": {
        "handler": handle_delete_exercise,
        "required": ["exercise_id"],
    },

    # Write — Mood/Energy
    "set_mood_energy": {
        "handler": handle_set_mood_energy,
        "required": [],
        "optional": ["mood", "energy", "date"],
    },

    # Write — Measurements
    "log_measurement": {
        "handler": handle_log_measurement,
        "required": ["weight_g"],
        "optional": ["date", "notes"],
    },

    # Write — Profile
    "update_profile": {
        "handler": handle_update_profile,
        "required": [],
        "optional": ["height_cm", "weight_g", "age", "activity_level",
                      "daily_calorie_goal", "evening_checkin_time"],
    },

    # Read actions
    "get_profile": {
        "handler": handle_get_profile,
        "required": [],
        "is_read": True,
    },
    "get_today_nutrition": {
        "handler": handle_get_today_nutrition,
        "required": [],
        "is_read": True,
    },
    "get_recent_detail": {
        "handler": handle_get_recent_detail,
        "required": [],
        "optional": ["days"],
        "is_read": True,
    },
    "get_heatmap_data": {
        "handler": handle_get_heatmap_data,
        "required": [],
        "optional": ["days"],
        "is_read": True,
    },
    "get_measurements": {
        "handler": handle_get_measurements,
        "required": [],
        "optional": ["limit"],
        "is_read": True,
    },
    # Write — Concern logs (LM-40)
    "log_concern_update": {
        "handler": handle_log_concern_update,
        "required": ["content"],
        "optional": ["concern_id"],
    },

    # Write — Food Database
    "add_food": {
        "handler": handle_add_food,
        "required": ["name", "calories"],
        "optional": ["protein_g", "carbs_g", "fat_g"],
    },
    "remove_food": {
        "handler": handle_remove_food,
        "required": ["food_id"],
    },

    # Read — Food Database
    "list_foods": {
        "handler": handle_list_foods,
        "required": [],
        "is_read": True,
    },

    # Read — Active concerns
    "get_active_concerns": {
        "handler": handle_get_active_concerns,
        "required": [],
        "is_read": True,
    },
}
