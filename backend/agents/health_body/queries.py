"""
Health & Body agent — SQL query functions.
Raw SQL with aiosqlite (no ORM per LM-01).
Weight stored in grams (81kg = 81000) per LM-06.
"""
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from backend.database import get_db
from backend.config import get_config


def _today() -> date:
    """Get today's date in the user's configured timezone."""
    cfg = get_config()
    tz = ZoneInfo(cfg.get("timezone", "UTC"))
    return datetime.now(tz).date()


# ──────────────────────── Profile ────────────────────────

async def get_profile() -> dict | None:
    db = await get_db()
    try:
        rows = await db.execute_fetchall("SELECT * FROM health_profile WHERE id = 1")
        return dict(rows[0]) if rows else None
    finally:
        await db.close()


async def upsert_profile(**fields) -> dict:
    db = await get_db()
    try:
        existing = await db.execute_fetchall("SELECT * FROM health_profile WHERE id = 1")
        if existing:
            allowed = {"height_cm", "weight_g", "age", "activity_level",
                        "daily_calorie_goal", "evening_checkin_time"}
            updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
            if updates:
                updates["updated_at"] = _today().isoformat()
                set_clause = ", ".join(f"{k} = ?" for k in updates)
                params = list(updates.values()) + [1]
                await db.execute(
                    f"UPDATE health_profile SET {set_clause} WHERE id = ?", params
                )
        else:
            cols = ["id"]
            vals = [1]
            allowed = {"height_cm", "weight_g", "age", "activity_level",
                        "daily_calorie_goal", "evening_checkin_time"}
            for k, v in fields.items():
                if k in allowed and v is not None:
                    cols.append(k)
                    vals.append(v)
            placeholders = ", ".join("?" for _ in cols)
            col_str = ", ".join(cols)
            await db.execute(
                f"INSERT INTO health_profile ({col_str}) VALUES ({placeholders})", vals
            )
        await db.commit()
    finally:
        await db.close()
    return await get_profile()


# ──────────────────────── Meals ────────────────────────

async def get_meals(
    date_from: str = None,
    date_to: str = None,
    limit: int = 50,
) -> list[dict]:
    db = await get_db()
    try:
        sql = "SELECT * FROM health_meals WHERE 1=1"
        params = []
        if date_from:
            sql += " AND date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND date <= ?"
            params.append(date_to)
        sql += " ORDER BY date DESC, time DESC LIMIT ?"
        params.append(limit)
        rows = await db.execute_fetchall(sql, params)
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_meals_for_date(date_str: str) -> list[dict]:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_meals WHERE date = ? ORDER BY time ASC",
            [date_str],
        )
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_meal(meal_id: int) -> dict | None:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_meals WHERE id = ?", [meal_id]
        )
        return dict(rows[0]) if rows else None
    finally:
        await db.close()


async def add_meal(
    meal_date: str = None,
    time: str = None,
    description: str = "",
    calories: int = 0,
    protein_g: int = 0,
    carbs_g: int = 0,
    fat_g: int = 0,
) -> dict:
    if not meal_date:
        meal_date = _today().isoformat()
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO health_meals (date, time, description, calories,
               protein_g, carbs_g, fat_g) VALUES (?, ?, ?, ?, ?, ?, ?)""",
            [meal_date, time, description, calories, protein_g, carbs_g, fat_g],
        )
        await db.commit()
        return await get_meal(cursor.lastrowid)
    finally:
        await db.close()


async def edit_meal(meal_id: int, **fields) -> dict:
    db = await get_db()
    try:
        allowed = {"date", "time", "description", "calories", "protein_g", "carbs_g", "fat_g"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if not updates:
            return await get_meal(meal_id)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        params = list(updates.values()) + [meal_id]
        await db.execute(f"UPDATE health_meals SET {set_clause} WHERE id = ?", params)
        await db.commit()
        return await get_meal(meal_id)
    finally:
        await db.close()


async def delete_meal(meal_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute("DELETE FROM health_meals WHERE id = ?", [meal_id])
        await db.commit()
        return True
    finally:
        await db.close()


# ──────────────────────── Exercises ────────────────────────

async def get_exercises(
    date_from: str = None,
    date_to: str = None,
    limit: int = 50,
) -> list[dict]:
    db = await get_db()
    try:
        sql = "SELECT * FROM health_exercises WHERE 1=1"
        params = []
        if date_from:
            sql += " AND date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND date <= ?"
            params.append(date_to)
        sql += " ORDER BY date DESC, time DESC LIMIT ?"
        params.append(limit)
        rows = await db.execute_fetchall(sql, params)
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_exercises_for_date(date_str: str) -> list[dict]:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_exercises WHERE date = ? ORDER BY time ASC",
            [date_str],
        )
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_exercise(exercise_id: int) -> dict | None:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_exercises WHERE id = ?", [exercise_id]
        )
        return dict(rows[0]) if rows else None
    finally:
        await db.close()


async def add_exercise(
    exercise_date: str = None,
    time: str = None,
    description: str = "",
    duration_minutes: int = 0,
    estimated_calories: int = 0,
) -> dict:
    if not exercise_date:
        exercise_date = _today().isoformat()
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO health_exercises (date, time, description,
               duration_minutes, estimated_calories) VALUES (?, ?, ?, ?, ?)""",
            [exercise_date, time, description, duration_minutes, estimated_calories],
        )
        await db.commit()
        return await get_exercise(cursor.lastrowid)
    finally:
        await db.close()


async def edit_exercise(exercise_id: int, **fields) -> dict:
    db = await get_db()
    try:
        allowed = {"date", "time", "description", "duration_minutes", "estimated_calories"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if not updates:
            return await get_exercise(exercise_id)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        params = list(updates.values()) + [exercise_id]
        await db.execute(f"UPDATE health_exercises SET {set_clause} WHERE id = ?", params)
        await db.commit()
        return await get_exercise(exercise_id)
    finally:
        await db.close()


async def delete_exercise(exercise_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute("DELETE FROM health_exercises WHERE id = ?", [exercise_id])
        await db.commit()
        return True
    finally:
        await db.close()


# ──────────────────────── Daily Summary ────────────────────────

async def get_daily_summary(date_str: str) -> dict | None:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_daily_summary WHERE date = ?", [date_str]
        )
        return dict(rows[0]) if rows else None
    finally:
        await db.close()


async def get_daily_summaries(date_from: str, date_to: str) -> list[dict]:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_daily_summary WHERE date >= ? AND date <= ? ORDER BY date ASC",
            [date_from, date_to],
        )
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def upsert_daily_summary(date_str: str, **fields) -> dict:
    db = await get_db()
    try:
        existing = await db.execute_fetchall(
            "SELECT * FROM health_daily_summary WHERE date = ?", [date_str]
        )
        allowed = {"total_calories", "total_protein_g", "total_carbs_g", "total_fat_g",
                    "total_exercise_minutes", "total_exercise_calories", "mood", "energy"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if existing:
            if updates:
                set_clause = ", ".join(f"{k} = ?" for k in updates)
                params = list(updates.values()) + [date_str]
                await db.execute(
                    f"UPDATE health_daily_summary SET {set_clause} WHERE date = ?", params
                )
        else:
            cols = ["date"] + list(updates.keys())
            vals = [date_str] + list(updates.values())
            placeholders = ", ".join("?" for _ in cols)
            col_str = ", ".join(cols)
            await db.execute(
                f"INSERT INTO health_daily_summary ({col_str}) VALUES ({placeholders})", vals
            )
        await db.commit()
    finally:
        await db.close()
    return await get_daily_summary(date_str)


async def set_mood_energy(date_str: str = None, mood: int = None, energy: int = None) -> dict:
    if not date_str:
        date_str = _today().isoformat()
    updates = {}
    if mood is not None:
        updates["mood"] = mood
    if energy is not None:
        updates["energy"] = energy
    return await upsert_daily_summary(date_str, **updates)


# ──────────────────────── Measurements ────────────────────────

async def get_measurements(limit: int = 30) -> list[dict]:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_measurements ORDER BY date DESC LIMIT ?", [limit]
        )
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def add_measurement(
    measurement_date: str = None,
    weight_g: int = None,
    notes: str = None,
) -> dict:
    if not measurement_date:
        measurement_date = _today().isoformat()
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO health_measurements (date, weight_g, notes) VALUES (?, ?, ?)",
            [measurement_date, weight_g, notes],
        )
        await db.commit()
        rows = await db.execute_fetchall(
            "SELECT * FROM health_measurements WHERE id = ?", [cursor.lastrowid]
        )
        return dict(rows[0]) if rows else {}
    finally:
        await db.close()


async def get_latest_measurement() -> dict | None:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_measurements ORDER BY date DESC LIMIT 1"
        )
        return dict(rows[0]) if rows else None
    finally:
        await db.close()


# ──────────────────────── Medical Documents ────────────────────────

async def get_health_documents(
    category: str = None,
    search: str = None,
    limit: int = 50,
) -> list[dict]:
    db = await get_db()
    try:
        sql = "SELECT * FROM health_documents WHERE 1=1"
        params = []
        if category:
            sql += " AND category = ?"
            params.append(category)
        if search:
            sql += " AND (name LIKE ? OR notes LIKE ? OR provider LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        sql += " ORDER BY COALESCE(date, created_at) DESC LIMIT ?"
        params.append(limit)
        rows = await db.execute_fetchall(sql, params)
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_health_document(doc_id: int) -> dict | None:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_documents WHERE id = ?", [doc_id]
        )
        return dict(rows[0]) if rows else None
    finally:
        await db.close()


async def add_health_document(
    name: str,
    category: str = "other",
    doc_date: str = None,
    provider: str = None,
    notes: str = None,
) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO health_documents (name, category, date, provider, notes) VALUES (?, ?, ?, ?, ?)",
            [name, category, doc_date, provider, notes],
        )
        await db.commit()
        return await get_health_document(cursor.lastrowid)
    finally:
        await db.close()


async def edit_health_document(doc_id: int, **fields) -> dict:
    db = await get_db()
    try:
        allowed = {"name", "category", "date", "provider", "notes"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if not updates:
            return await get_health_document(doc_id)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        params = list(updates.values()) + [doc_id]
        await db.execute(f"UPDATE health_documents SET {set_clause} WHERE id = ?", params)
        await db.commit()
        return await get_health_document(doc_id)
    finally:
        await db.close()


async def delete_health_document(doc_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute("DELETE FROM health_files WHERE linked_document_id = ?", [doc_id])
        await db.execute("DELETE FROM health_documents WHERE id = ?", [doc_id])
        await db.commit()
        return True
    finally:
        await db.close()


# ──────────────────────── Health Files ────────────────────────

async def store_health_file(
    file_path: str,
    original_filename: str,
    mime_type: str = None,
    file_size: int = None,
    linked_document_id: int = None,
    description: str = "",
    extracted_data: str = None,
) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO health_files (file_path, original_filename, mime_type, file_size,
               linked_document_id, description, extracted_data)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            [file_path, original_filename, mime_type, file_size,
             linked_document_id, description, extracted_data],
        )
        await db.commit()
        rows = await db.execute_fetchall(
            "SELECT * FROM health_files WHERE id = ?", [cursor.lastrowid]
        )
        return dict(rows[0]) if rows else {}
    finally:
        await db.close()


async def get_health_file(
    file_id: int = None,
    search: str = None,
    linked_document_id: int = None,
) -> dict | None:
    db = await get_db()
    try:
        if file_id:
            rows = await db.execute_fetchall(
                "SELECT * FROM health_files WHERE id = ?", [file_id]
            )
        elif linked_document_id:
            rows = await db.execute_fetchall(
                "SELECT * FROM health_files WHERE linked_document_id = ? ORDER BY created_at DESC LIMIT 1",
                [linked_document_id],
            )
        elif search:
            rows = await db.execute_fetchall(
                "SELECT * FROM health_files WHERE description LIKE ? OR original_filename LIKE ? ORDER BY created_at DESC LIMIT 1",
                [f"%{search}%", f"%{search}%"],
            )
        else:
            return None
        return dict(rows[0]) if rows else None
    finally:
        await db.close()


async def get_files_for_document(doc_id: int) -> list[dict]:
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            "SELECT * FROM health_files WHERE linked_document_id = ? ORDER BY created_at DESC",
            [doc_id],
        )
        return [dict(r) for r in rows]
    finally:
        await db.close()


# ──────────────────────── Aggregates ────────────────────────

async def get_heatmap_data(days: int = 90) -> list[dict]:
    """Return per-day data for the heatmap grid."""
    today = _today()
    start = today - timedelta(days=days - 1)
    start_str = start.isoformat()
    today_str = today.isoformat()

    profile = await get_profile()
    calorie_goal = (profile or {}).get("daily_calorie_goal", 2000)

    # Get compressed daily summaries
    summaries = await get_daily_summaries(start_str, today_str)
    summary_map = {s["date"]: s for s in summaries}

    # Recent days: always compute from individual entries (meals/exercises
    # are still in raw tables) and merge mood/energy from daily_summary.
    # Older days: use compressed daily_summary if available.
    # This prevents mood-only summary rows from masking actual meal/exercise data.
    recent_cutoff = 3

    result = []
    for i in range(days):
        d = start + timedelta(days=i)
        d_str = d.isoformat()
        days_ago = (today - d).days

        if days_ago <= recent_cutoff:
            # Recent: compute from raw entries, merge mood/energy from summary
            meals = await get_meals_for_date(d_str)
            exercises = await get_exercises_for_date(d_str)
            total_cal = sum(m.get("calories", 0) for m in meals)
            total_ex_min = sum(e.get("duration_minutes", 0) for e in exercises)
            total_ex_cal = sum(e.get("estimated_calories", 0) for e in exercises)
            summary = summary_map.get(d_str) or await get_daily_summary(d_str)
            result.append({
                "date": d_str,
                "total_calories": total_cal,
                "total_exercise_minutes": total_ex_min,
                "total_exercise_calories": total_ex_cal,
                "mood": (summary or {}).get("mood"),
                "energy": (summary or {}).get("energy"),
                "calorie_goal": calorie_goal,
            })
        elif d_str in summary_map:
            # Older: use compressed summary
            s = summary_map[d_str]
            result.append({
                "date": d_str,
                "total_calories": s["total_calories"],
                "total_exercise_minutes": s["total_exercise_minutes"],
                "total_exercise_calories": s["total_exercise_calories"],
                "mood": s.get("mood"),
                "energy": s.get("energy"),
                "calorie_goal": calorie_goal,
            })
        else:
            # No data for this day
            result.append({
                "date": d_str,
                "total_calories": 0,
                "total_exercise_minutes": 0,
                "total_exercise_calories": 0,
                "mood": None,
                "energy": None,
                "calorie_goal": calorie_goal,
            })

    return result


async def get_recent_detail(days: int = 3) -> list[dict]:
    """Return individual meals and exercises for the last N days."""
    today = _today()
    result = []
    for i in range(days):
        d = today - timedelta(days=i)
        d_str = d.isoformat()
        meals = await get_meals_for_date(d_str)
        exercises = await get_exercises_for_date(d_str)
        summary = await get_daily_summary(d_str)

        total_cal = sum(m.get("calories", 0) for m in meals)
        total_ex_min = sum(e.get("duration_minutes", 0) for e in exercises)

        result.append({
            "date": d_str,
            "day_name": d.strftime("%A"),
            "meals": meals,
            "exercises": exercises,
            "total_calories": total_cal,
            "total_exercise_minutes": total_ex_min,
            "mood": (summary or {}).get("mood"),
            "energy": (summary or {}).get("energy"),
        })
    return result


async def get_pulse() -> dict:
    """Return key metrics for the Home panel pulse card."""
    today_str = _today().isoformat()
    profile = await get_profile()
    goal = (profile or {}).get("daily_calorie_goal", 0)

    meals = await get_meals_for_date(today_str)
    today_cal = sum(m.get("calories", 0) for m in meals)

    summary = await get_daily_summary(today_str)
    mood = (summary or {}).get("mood")

    latest = await get_latest_measurement()
    weight_kg = round(latest["weight_g"] / 1000, 1) if latest and latest.get("weight_g") else None

    return {
        "today_calories": today_cal,
        "calorie_goal": goal,
        "meal_count": len(meals),
        "mood": mood,
        "weight_kg": weight_kg,
    }


# ──────────────────────── Compression ────────────────────────

async def get_uncompressed_dates(older_than_days: int = 3) -> list[str]:
    """Find dates with individual meal/exercise rows older than N days."""
    cutoff = (_today() - timedelta(days=older_than_days)).isoformat()
    db = await get_db()
    try:
        meal_dates = await db.execute_fetchall(
            "SELECT DISTINCT date FROM health_meals WHERE date < ?", [cutoff]
        )
        exercise_dates = await db.execute_fetchall(
            "SELECT DISTINCT date FROM health_exercises WHERE date < ?", [cutoff]
        )
        dates = set()
        for r in meal_dates:
            dates.add(r[0] if isinstance(r, tuple) else dict(r)["date"])
        for r in exercise_dates:
            dates.add(r[0] if isinstance(r, tuple) else dict(r)["date"])
        return sorted(dates)
    finally:
        await db.close()


async def compress_day(date_str: str) -> bool:
    """Compress a day's meals and exercises into a daily summary row, then delete originals."""
    db = await get_db()
    try:
        # Gather meal totals
        meal_rows = await db.execute_fetchall(
            "SELECT calories, protein_g, carbs_g, fat_g FROM health_meals WHERE date = ?",
            [date_str],
        )
        meals = [dict(r) for r in meal_rows]
        total_cal = sum(m["calories"] for m in meals)
        total_pro = sum(m["protein_g"] for m in meals)
        total_carb = sum(m["carbs_g"] for m in meals)
        total_fat = sum(m["fat_g"] for m in meals)

        # Gather exercise totals
        ex_rows = await db.execute_fetchall(
            "SELECT duration_minutes, estimated_calories FROM health_exercises WHERE date = ?",
            [date_str],
        )
        exercises = [dict(r) for r in ex_rows]
        total_ex_min = sum(e["duration_minutes"] for e in exercises)
        total_ex_cal = sum(e["estimated_calories"] for e in exercises)

        # Check existing summary (may have mood/energy already set)
        existing = await db.execute_fetchall(
            "SELECT * FROM health_daily_summary WHERE date = ?", [date_str]
        )

        if existing:
            ex_row = dict(existing[0])
            await db.execute(
                """UPDATE health_daily_summary SET
                   total_calories = ?, total_protein_g = ?, total_carbs_g = ?, total_fat_g = ?,
                   total_exercise_minutes = ?, total_exercise_calories = ?
                   WHERE date = ?""",
                [total_cal, total_pro, total_carb, total_fat,
                 total_ex_min, total_ex_cal, date_str],
            )
        else:
            await db.execute(
                """INSERT INTO health_daily_summary
                   (date, total_calories, total_protein_g, total_carbs_g, total_fat_g,
                    total_exercise_minutes, total_exercise_calories)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                [date_str, total_cal, total_pro, total_carb, total_fat,
                 total_ex_min, total_ex_cal],
            )

        # Delete individual entries
        await db.execute("DELETE FROM health_meals WHERE date = ?", [date_str])
        await db.execute("DELETE FROM health_exercises WHERE date = ?", [date_str])

        await db.commit()
        return True
    except Exception:
        await db.execute("ROLLBACK")
        raise
    finally:
        await db.close()
