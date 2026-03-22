"""
Life Manager agent — API routes (LM-08: namespaced under /api/life).
"""
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from backend.agents.life_manager import queries

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "files"

router = APIRouter(prefix="/api/life", tags=["life_manager"])


# ──────────────────────── Pulse (Home panel) ────────────────────────

@router.get("/pulse")
async def get_pulse():
    """Return key metrics for the Home panel pulse card."""
    pulse = await queries.get_pulse()
    return {
        "metrics": [
            {"label": "Tasks due today", "value": str(pulse["tasks_due_today"])},
            {"label": "Upcoming bills (7d)", "value": str(pulse["upcoming_bills"])},
            {"label": "Overdue items", "value": str(pulse["overdue_count"])},
        ]
    }


@router.get("/health")
async def health():
    return {"agent": "life_manager", "status": "ok"}


# ──────────────────────── Timeline ────────────────────────

@router.get("/timeline")
async def get_timeline(days: int = 14):
    return await queries.get_timeline(days)


# ──────────────────────── Events ────────────────────────

@router.get("/events")
async def list_events(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    include_completed: bool = False,
    limit: int = 50,
):
    return await queries.get_events(
        date_from=date_from, date_to=date_to, category=category,
        search=search, include_completed=include_completed, limit=limit,
    )


@router.get("/events/{event_id}")
async def get_event(event_id: int):
    event = await queries.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


class EventCreate(BaseModel):
    title: str
    date: str
    time: Optional[str] = None
    category: str = "reminder"
    description: Optional[str] = None
    is_recurring: bool = False
    recurring_rule: Optional[str] = None

@router.post("/events")
async def create_event(body: EventCreate):
    return await queries.add_event(
        title=body.title, event_date=body.date, time=body.time,
        category=body.category, description=body.description,
        is_recurring=body.is_recurring, recurring_rule=body.recurring_rule,
    )


class EventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

@router.put("/events/{event_id}")
async def update_event(event_id: int, body: EventUpdate):
    return await queries.edit_event(event_id, **body.model_dump(exclude_none=True))


@router.post("/events/{event_id}/complete")
async def complete_event(event_id: int):
    return await queries.complete_event(event_id)


@router.delete("/events/{event_id}")
async def remove_event(event_id: int):
    await queries.delete_event(event_id)
    return {"success": True}


# ──────────────────────── Tasks ────────────────────────

@router.get("/tasks")
async def list_tasks(
    priority: Optional[str] = None,
    category: Optional[str] = None,
    is_completed: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = 50,
):
    return await queries.get_tasks(
        priority=priority, category=category, is_completed=is_completed,
        search=search, limit=limit,
    )


@router.get("/tasks/{task_id}")
async def get_task(task_id: int):
    task = await queries.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


class TaskCreate(BaseModel):
    title: str
    priority: str = "medium"
    due_date: Optional[str] = None
    category: str = "other"

@router.post("/tasks")
async def create_task(body: TaskCreate):
    return await queries.add_task(
        title=body.title, priority=body.priority,
        due_date=body.due_date, category=body.category,
    )


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    category: Optional[str] = None

@router.put("/tasks/{task_id}")
async def update_task(task_id: int, body: TaskUpdate):
    return await queries.edit_task(task_id, **body.model_dump(exclude_none=True))


@router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: int):
    return await queries.complete_task(task_id)


@router.delete("/tasks/{task_id}")
async def remove_task(task_id: int):
    await queries.delete_task(task_id)
    return {"success": True}


# ──────────────────────── Bills ────────────────────────

@router.get("/bills")
async def list_bills(
    is_paid: Optional[bool] = None,
    category: Optional[str] = None,
    upcoming_days: Optional[int] = None,
    limit: int = 50,
):
    return await queries.get_bills(
        is_paid=is_paid, category=category,
        upcoming_days=upcoming_days, limit=limit,
    )


@router.get("/bills/calendar")
async def bills_calendar():
    return await queries.get_bill_calendar()


@router.get("/bills/{bill_id}")
async def get_bill(bill_id: int):
    bill = await queries.get_bill(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


class BillCreate(BaseModel):
    name: str
    amount: int = 0
    due_date: Optional[str] = None
    frequency: str = "monthly"
    category: str = "other"
    is_autopay: bool = False
    notes: Optional[str] = None

@router.post("/bills")
async def create_bill(body: BillCreate):
    return await queries.add_bill(
        name=body.name, amount=body.amount, due_date=body.due_date,
        frequency=body.frequency, category=body.category,
        is_autopay=body.is_autopay, notes=body.notes,
    )


class BillUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[int] = None
    due_date: Optional[str] = None
    next_due: Optional[str] = None
    frequency: Optional[str] = None
    category: Optional[str] = None
    is_autopay: Optional[bool] = None
    notes: Optional[str] = None

@router.put("/bills/{bill_id}")
async def update_bill(bill_id: int, body: BillUpdate):
    return await queries.edit_bill(bill_id, **body.model_dump(exclude_none=True))


@router.post("/bills/{bill_id}/paid")
async def mark_bill_paid(bill_id: int):
    return await queries.mark_bill_paid(bill_id)


@router.delete("/bills/{bill_id}")
async def remove_bill(bill_id: int):
    await queries.delete_bill(bill_id)
    return {"success": True}


# (Documents moved to shell-level /api/documents/ routes in main.py)

# ──────────────────────── Overdue & Today ────────────────────────

@router.get("/today")
async def get_today():
    return await queries.get_today_items()


@router.get("/upcoming")
async def get_upcoming(days: int = 7):
    return await queries.get_upcoming(days)


@router.get("/overdue")
async def get_overdue():
    return await queries.get_overdue()
