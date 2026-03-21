"""
Life Manager agent — ACTION_REGISTRY (LM-13d).
Maps action names to handler functions and required field schemas.
Every action is validated before execution.
"""
from backend.agents.life_manager import queries
from backend import llm_client


# --- Event handlers ---

async def handle_add_event(data: dict) -> dict:
    return await queries.add_event(
        title=data["title"],
        event_date=data["date"],
        time=data.get("time"),
        category=data.get("category", "reminder"),
        description=data.get("description"),
        is_recurring=data.get("is_recurring", False),
        recurring_rule=data.get("recurring_rule"),
    )


async def handle_edit_event(data: dict) -> dict:
    event_id = data.pop("event_id")
    return await queries.edit_event(event_id, **data)


async def handle_delete_event(data: dict) -> bool:
    return await queries.delete_event(data["event_id"])


async def handle_complete_event(data: dict) -> dict:
    return await queries.complete_event(data["event_id"])


# --- Task handlers ---

async def handle_add_task(data: dict) -> dict:
    return await queries.add_task(
        title=data["title"],
        priority=data.get("priority", "medium"),
        due_date=data.get("due_date"),
        category=data.get("category", "other"),
    )


async def handle_edit_task(data: dict) -> dict:
    task_id = data.pop("task_id")
    return await queries.edit_task(task_id, **data)


async def handle_complete_task(data: dict) -> dict:
    return await queries.complete_task(data["task_id"])


async def handle_delete_task(data: dict) -> bool:
    return await queries.delete_task(data["task_id"])


# --- Bill handlers ---

async def handle_add_bill(data: dict) -> dict:
    return await queries.add_bill(
        name=data["name"],
        amount=data.get("amount", 0),
        due_date=data.get("due_date"),
        frequency=data.get("frequency", "monthly"),
        category=data.get("category", "other"),
        is_autopay=data.get("is_autopay", False),
        notes=data.get("notes"),
    )


async def handle_edit_bill(data: dict) -> dict:
    bill_id = data.pop("bill_id")
    return await queries.edit_bill(bill_id, **data)


async def handle_mark_bill_paid(data: dict) -> dict:
    return await queries.mark_bill_paid(data["bill_id"])


async def handle_delete_bill(data: dict) -> bool:
    return await queries.delete_bill(data["bill_id"])


# --- Read action handlers ---

async def handle_get_today(data: dict) -> dict:
    return await queries.get_today_items()


async def handle_get_upcoming(data: dict) -> dict:
    return await queries.get_upcoming(
        days_ahead=data.get("days_ahead", 7)
    )


async def handle_get_overdue(data: dict) -> dict:
    return await queries.get_overdue()


async def handle_get_tasks(data: dict) -> list:
    return await queries.get_tasks(
        priority=data.get("priority"),
        category=data.get("category"),
        is_completed=data.get("is_completed"),
        search=data.get("search"),
        limit=data.get("limit", 10),
    )


async def handle_get_bills(data: dict) -> list:
    return await queries.get_bills(
        is_paid=data.get("is_paid"),
        category=data.get("category"),
        upcoming_days=data.get("upcoming_days"),
    )


async def handle_get_events(data: dict) -> list:
    return await queries.get_events(
        date_from=data.get("date_from"),
        date_to=data.get("date_to"),
        category=data.get("category"),
        search=data.get("search"),
    )


# --- ACTION_REGISTRY (LM-13d) ---

ACTION_REGISTRY = {
    # Write — Events
    "add_event": {
        "handler": handle_add_event,
        "required": ["title", "date"],
        "optional": ["time", "category", "description", "is_recurring", "recurring_rule"],
    },
    "edit_event": {
        "handler": handle_edit_event,
        "required": ["event_id"],
        "optional": ["title", "date", "time", "category", "description"],
    },
    "delete_event": {
        "handler": handle_delete_event,
        "required": ["event_id"],
    },
    "complete_event": {
        "handler": handle_complete_event,
        "required": ["event_id"],
    },

    # Write — Tasks
    "add_task": {
        "handler": handle_add_task,
        "required": ["title"],
        "optional": ["priority", "due_date", "category"],
    },
    "edit_task": {
        "handler": handle_edit_task,
        "required": ["task_id"],
        "optional": ["title", "priority", "due_date", "category"],
    },
    "complete_task": {
        "handler": handle_complete_task,
        "required": ["task_id"],
    },
    "delete_task": {
        "handler": handle_delete_task,
        "required": ["task_id"],
    },

    # Write — Bills
    "add_bill": {
        "handler": handle_add_bill,
        "required": ["name"],
        "optional": ["amount", "due_date", "frequency", "category", "is_autopay", "notes"],
    },
    "edit_bill": {
        "handler": handle_edit_bill,
        "required": ["bill_id"],
        "optional": ["name", "amount", "due_date", "next_due", "frequency", "category", "is_autopay", "notes"],
    },
    "mark_bill_paid": {
        "handler": handle_mark_bill_paid,
        "required": ["bill_id"],
    },
    "delete_bill": {
        "handler": handle_delete_bill,
        "required": ["bill_id"],
    },

    # Read actions
    "get_today": {
        "handler": handle_get_today,
        "required": [],
        "is_read": True,
    },
    "get_upcoming": {
        "handler": handle_get_upcoming,
        "required": [],
        "optional": ["days_ahead"],
        "is_read": True,
    },
    "get_overdue": {
        "handler": handle_get_overdue,
        "required": [],
        "is_read": True,
    },
    "get_tasks": {
        "handler": handle_get_tasks,
        "required": [],
        "optional": ["priority", "category", "is_completed", "search", "limit"],
        "is_read": True,
    },
    "get_bills": {
        "handler": handle_get_bills,
        "required": [],
        "optional": ["is_paid", "category", "upcoming_days"],
        "is_read": True,
    },
    "get_events": {
        "handler": handle_get_events,
        "required": [],
        "optional": ["date_from", "date_to", "category", "search"],
        "is_read": True,
    },
}
