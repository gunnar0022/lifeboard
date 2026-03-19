"""Health & Body agent — FastAPI routes (dashboard API)."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
from backend.agents.health_body import queries

router = APIRouter(prefix="/api/health_body", tags=["health_body"])

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


# --- Request models ---

class ProfileUpdate(BaseModel):
    height_cm: Optional[float] = None
    weight_g: Optional[int] = None
    age: Optional[int] = None
    activity_level: Optional[str] = None
    daily_calorie_goal: Optional[int] = None
    evening_checkin_time: Optional[str] = None


class MealCreate(BaseModel):
    description: str
    calories: int = 0
    protein_g: int = 0
    carbs_g: int = 0
    fat_g: int = 0
    date: Optional[str] = None
    time: Optional[str] = None


class MealUpdate(BaseModel):
    description: Optional[str] = None
    calories: Optional[int] = None
    protein_g: Optional[int] = None
    carbs_g: Optional[int] = None
    fat_g: Optional[int] = None
    date: Optional[str] = None
    time: Optional[str] = None


class ExerciseCreate(BaseModel):
    description: str
    duration_minutes: int = 0
    estimated_calories: int = 0
    date: Optional[str] = None
    time: Optional[str] = None


class ExerciseUpdate(BaseModel):
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    estimated_calories: Optional[int] = None
    date: Optional[str] = None
    time: Optional[str] = None


class MoodEnergySet(BaseModel):
    mood: Optional[int] = None
    energy: Optional[int] = None
    date: Optional[str] = None


class MeasurementCreate(BaseModel):
    weight_g: int
    date: Optional[str] = None
    notes: Optional[str] = None


class DocumentCreate(BaseModel):
    name: str
    category: str = "other"
    date: Optional[str] = None
    provider: Optional[str] = None
    notes: Optional[str] = None


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    provider: Optional[str] = None
    notes: Optional[str] = None


# --- Pulse ---

@router.get("/pulse")
async def get_pulse():
    """Return key metrics for the Home panel pulse card."""
    try:
        pulse = await queries.get_pulse()
        today_cal = pulse.get("today_calories", 0)
        goal = pulse.get("calorie_goal", 0)
        mood = pulse.get("mood")
        weight = pulse.get("weight_kg")

        metrics = []
        if goal:
            metrics.append({
                "label": "Today",
                "value": f"{today_cal:,}",
                "suffix": f"/ {goal:,} kcal",
            })
        else:
            metrics.append({
                "label": "Today",
                "value": f"{today_cal:,}" if today_cal else "--",
                "suffix": "kcal",
            })
        metrics.append({
            "label": "Mood",
            "value": f"{mood}/5" if mood else "--",
        })
        metrics.append({
            "label": "Weight",
            "value": f"{weight}kg" if weight else "--",
        })
        return {"metrics": metrics}
    except Exception:
        return {"metrics": [{"label": "Status", "value": "--"}]}


# --- Profile ---

@router.get("/profile")
async def get_profile():
    profile = await queries.get_profile()
    return profile or {}


@router.post("/profile")
async def update_profile(body: ProfileUpdate):
    fields = body.model_dump(exclude_none=True)
    return await queries.upsert_profile(**fields)


# --- Meals ---

@router.get("/meals")
async def get_meals(date_from: str = None, date_to: str = None, limit: int = 50):
    return await queries.get_meals(date_from=date_from, date_to=date_to, limit=limit)


@router.post("/meals")
async def add_meal(body: MealCreate):
    return await queries.add_meal(
        meal_date=body.date,
        time=body.time,
        description=body.description,
        calories=body.calories,
        protein_g=body.protein_g,
        carbs_g=body.carbs_g,
        fat_g=body.fat_g,
    )


@router.put("/meals/{meal_id}")
async def edit_meal(meal_id: int, body: MealUpdate):
    existing = await queries.get_meal(meal_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Meal not found")
    fields = body.model_dump(exclude_none=True)
    return await queries.edit_meal(meal_id, **fields)


@router.delete("/meals/{meal_id}")
async def delete_meal(meal_id: int):
    existing = await queries.get_meal(meal_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Meal not found")
    await queries.delete_meal(meal_id)
    return {"ok": True}


# --- Exercises ---

@router.get("/exercises")
async def get_exercises(date_from: str = None, date_to: str = None, limit: int = 50):
    return await queries.get_exercises(date_from=date_from, date_to=date_to, limit=limit)


@router.post("/exercises")
async def add_exercise(body: ExerciseCreate):
    return await queries.add_exercise(
        exercise_date=body.date,
        time=body.time,
        description=body.description,
        duration_minutes=body.duration_minutes,
        estimated_calories=body.estimated_calories,
    )


@router.put("/exercises/{exercise_id}")
async def edit_exercise(exercise_id: int, body: ExerciseUpdate):
    existing = await queries.get_exercise(exercise_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Exercise not found")
    fields = body.model_dump(exclude_none=True)
    return await queries.edit_exercise(exercise_id, **fields)


@router.delete("/exercises/{exercise_id}")
async def delete_exercise(exercise_id: int):
    existing = await queries.get_exercise(exercise_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Exercise not found")
    await queries.delete_exercise(exercise_id)
    return {"ok": True}


# --- Daily Summary / Mood-Energy ---

@router.get("/daily-summary")
async def get_daily_summary(date: str = None):
    if not date:
        from datetime import date as dt_date
        date = dt_date.today().isoformat()
    return await queries.get_daily_summary(date) or {}


@router.post("/mood-energy")
async def set_mood_energy(body: MoodEnergySet):
    return await queries.set_mood_energy(
        date_str=body.date,
        mood=body.mood,
        energy=body.energy,
    )


# --- Measurements ---

@router.get("/measurements")
async def get_measurements(limit: int = 30):
    return await queries.get_measurements(limit=limit)


@router.post("/measurements")
async def add_measurement(body: MeasurementCreate):
    result = await queries.add_measurement(
        measurement_date=body.date,
        weight_g=body.weight_g,
        notes=body.notes,
    )
    # Also update profile weight
    await queries.upsert_profile(weight_g=body.weight_g)
    return result


# --- Heatmap & Recent ---

@router.get("/heatmap")
async def get_heatmap(days: int = 90):
    return await queries.get_heatmap_data(days=days)


@router.get("/recent")
async def get_recent(days: int = 3):
    return await queries.get_recent_detail(days=days)


# --- Medical Documents ---

@router.get("/documents")
async def get_documents(category: str = None, search: str = None):
    return await queries.get_health_documents(category=category, search=search)


@router.post("/documents")
async def add_document(body: DocumentCreate):
    return await queries.add_health_document(
        name=body.name,
        category=body.category,
        doc_date=body.date,
        provider=body.provider,
        notes=body.notes,
    )


@router.put("/documents/{doc_id}")
async def edit_document(doc_id: int, body: DocumentUpdate):
    existing = await queries.get_health_document(doc_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")
    fields = body.model_dump(exclude_none=True)
    return await queries.edit_health_document(doc_id, **fields)


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: int):
    existing = await queries.get_health_document(doc_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Document not found")
    await queries.delete_health_document(doc_id)
    return {"ok": True}


@router.get("/documents/{doc_id}/files")
async def get_document_files(doc_id: int):
    return await queries.get_files_for_document(doc_id)


@router.get("/files/{file_id}/view")
async def view_file(file_id: int):
    f = await queries.get_health_file(file_id=file_id)
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    full_path = PROJECT_ROOT / "data" / "files" / f["file_path"]
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(str(full_path), media_type=f.get("mime_type", "application/octet-stream"))


# --- Health Concerns (Fleet data, displayed in Health panel per LM-40) ---

@router.get("/concerns")
async def get_concerns():
    """Get health concerns for the dashboard."""
    from backend.agents.fleet.queries import get_concerns_for_dashboard
    return await get_concerns_for_dashboard()
