"""
Life Manager agent — SQL query functions.
Raw SQL with aiosqlite (no ORM per LM-01).
All amounts stored as integers (smallest currency unit per LM-06).
"""
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from backend.database import get_db
from backend.config import get_config
from dateutil.relativedelta import relativedelta


def _today() -> date:
    """Get today's date in the user's configured timezone."""
    config = get_config()
    tz = ZoneInfo(config.get("timezone", "UTC"))
    return datetime.now(tz).date()


# ──────────────────────── Events (Google Calendar integrated) ────────────────────────

async def get_events(
    date_from: str = None,
    date_to: str = None,
    search: str = None,
    include_holidays: bool = True,
    limit: int = 50,
) -> list[dict]:
    db = await get_db()
    try:
        sql = "SELECT * FROM life_events WHERE sync_status != 'pending_delete'"
        params = []
        if date_from:
            sql += " AND start_time >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND start_time <= ?"
            params.append(date_to)
        if not include_holidays:
            sql += " AND is_holiday = 0"
        if search:
            sql += " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        sql += " ORDER BY start_time ASC LIMIT ?"
        params.append(limit)
        rows = await db.execute_fetchall(sql, params)
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_event(event_id: int) -> dict | None:
    db = await get_db()
    try:
        row = await db.execute_fetchall(
            "SELECT * FROM life_events WHERE id = ?", [event_id]
        )
        return dict(row[0]) if row else None
    finally:
        await db.close()


async def add_event(
    title: str,
    start_time: str,
    end_time: str = None,
    all_day: bool = False,
    location: str = None,
    description: str = None,
    reminder_offset: int = None,
) -> dict:
    """Create an event locally with pending_push status for next Google sync."""
    db = await get_db()
    try:
        now = datetime.now().isoformat()
        cursor = await db.execute(
            """INSERT INTO life_events
               (title, start_time, end_time, all_day, location, description,
                reminder_offset, local_updated_at, sync_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_push')""",
            [title, start_time, end_time, 1 if all_day else 0,
             location, description, reminder_offset, now],
        )
        await db.commit()
        return await get_event(cursor.lastrowid)
    finally:
        await db.close()


async def edit_event(event_id: int, **fields) -> dict:
    db = await get_db()
    try:
        allowed = {"title", "start_time", "end_time", "all_day", "location",
                    "description", "reminder_offset"}
        updates = {k: v for k, v in fields.items() if k in allowed}
        if not updates:
            return await get_event(event_id)
        updates["local_updated_at"] = datetime.now().isoformat()
        updates["sync_status"] = "pending_push"
        # Reset reminder if offset changed
        if "reminder_offset" in updates:
            updates["reminder_sent"] = 0
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        params = list(updates.values()) + [event_id]
        await db.execute(f"UPDATE life_events SET {set_clause} WHERE id = ?", params)
        await db.commit()
        return await get_event(event_id)
    finally:
        await db.close()


async def delete_event(event_id: int) -> bool:
    """Mark for deletion — actual Google delete happens during sync."""
    db = await get_db()
    try:
        event = await get_event(event_id)
        if not event:
            return False
        if event.get("google_event_id"):
            # Has a Google counterpart — mark for sync deletion
            await db.execute(
                "UPDATE life_events SET sync_status = 'pending_delete' WHERE id = ?",
                [event_id],
            )
        else:
            # Local only — just delete
            await db.execute("DELETE FROM life_events WHERE id = ?", [event_id])
        await db.commit()
        return True
    finally:
        await db.close()


async def set_event_reminder(event_id: int, reminder_offset: int | None) -> dict:
    """Set or clear a reminder for an event."""
    db = await get_db()
    try:
        await db.execute(
            "UPDATE life_events SET reminder_offset = ?, reminder_sent = 0 WHERE id = ?",
            [reminder_offset, event_id],
        )
        await db.commit()
        return await get_event(event_id)
    finally:
        await db.close()


# ──────────────────────── Tasks ────────────────────────

async def get_tasks(
    priority: str = None,
    category: str = None,
    is_completed: bool = None,
    search: str = None,
    limit: int = 50,
) -> list[dict]:
    db = await get_db()
    try:
        sql = "SELECT * FROM life_tasks WHERE 1=1"
        params = []
        if is_completed is not None:
            sql += " AND is_completed = ?"
            params.append(1 if is_completed else 0)
        if priority:
            sql += " AND priority = ?"
            params.append(priority)
        if category:
            sql += " AND category = ?"
            params.append(category)
        if search:
            sql += " AND title LIKE ?"
            params.append(f"%{search}%")
        # Sort: incomplete first, then by priority (high > medium > low), then due date
        sql += """ ORDER BY is_completed ASC,
                   CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
                   COALESCE(due_date, '9999-12-31') ASC
                   LIMIT ?"""
        params.append(limit)
        rows = await db.execute_fetchall(sql, params)
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_task(task_id: int) -> dict | None:
    db = await get_db()
    try:
        row = await db.execute_fetchall(
            "SELECT * FROM life_tasks WHERE id = ?", [task_id]
        )
        return dict(row[0]) if row else None
    finally:
        await db.close()


async def add_task(
    title: str,
    priority: str = "medium",
    due_date: str = None,
    category: str = "other",
) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO life_tasks (title, priority, due_date, category) VALUES (?, ?, ?, ?)",
            [title, priority, due_date, category],
        )
        await db.commit()
        return await get_task(cursor.lastrowid)
    finally:
        await db.close()


async def edit_task(task_id: int, **fields) -> dict:
    db = await get_db()
    try:
        allowed = {"title", "priority", "due_date", "category"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if not updates:
            return await get_task(task_id)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        params = list(updates.values()) + [task_id]
        await db.execute(f"UPDATE life_tasks SET {set_clause} WHERE id = ?", params)
        await db.commit()
        return await get_task(task_id)
    finally:
        await db.close()


async def complete_task(task_id: int) -> dict:
    db = await get_db()
    try:
        now = datetime.now().isoformat()
        await db.execute(
            "UPDATE life_tasks SET is_completed = 1, completed_at = ? WHERE id = ?",
            [now, task_id],
        )
        await db.commit()
        return await get_task(task_id)
    finally:
        await db.close()


async def delete_task(task_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute("DELETE FROM life_tasks WHERE id = ?", [task_id])
        await db.commit()
        return True
    finally:
        await db.close()


# ──────────────────────── Bills ────────────────────────

async def get_bills(
    is_paid: bool = None,
    category: str = None,
    upcoming_days: int = None,
    limit: int = 50,
) -> list[dict]:
    db = await get_db()
    try:
        sql = "SELECT * FROM life_bills WHERE 1=1"
        params = []
        if is_paid is not None:
            sql += " AND is_paid = ?"
            params.append(1 if is_paid else 0)
        if category:
            sql += " AND category = ?"
            params.append(category)
        if upcoming_days is not None:
            cutoff = (_today() + timedelta(days=upcoming_days)).isoformat()
            sql += " AND next_due <= ?"
            params.append(cutoff)
        sql += " ORDER BY next_due ASC LIMIT ?"
        params.append(limit)
        rows = await db.execute_fetchall(sql, params)
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_bill(bill_id: int) -> dict | None:
    db = await get_db()
    try:
        row = await db.execute_fetchall(
            "SELECT * FROM life_bills WHERE id = ?", [bill_id]
        )
        return dict(row[0]) if row else None
    finally:
        await db.close()


async def add_bill(
    name: str,
    amount: int = 0,
    due_date: str = None,
    frequency: str = "monthly",
    category: str = "other",
    is_autopay: bool = False,
    notes: str = None,
) -> dict:
    # Set next_due to due_date initially
    next_due = due_date or _today().isoformat()
    due = due_date or next_due
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO life_bills (name, amount, due_date, next_due, frequency,
               category, is_autopay, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [name, amount, due, next_due, frequency, category,
             1 if is_autopay else 0, notes],
        )
        await db.commit()
        return await get_bill(cursor.lastrowid)
    finally:
        await db.close()


async def edit_bill(bill_id: int, **fields) -> dict:
    db = await get_db()
    try:
        allowed = {"name", "amount", "due_date", "next_due", "frequency",
                    "category", "is_autopay", "notes"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if "is_autopay" in updates:
            updates["is_autopay"] = 1 if updates["is_autopay"] else 0
        if not updates:
            return await get_bill(bill_id)
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        params = list(updates.values()) + [bill_id]
        await db.execute(f"UPDATE life_bills SET {set_clause} WHERE id = ?", params)
        await db.commit()
        return await get_bill(bill_id)
    finally:
        await db.close()


async def mark_bill_paid(bill_id: int) -> dict:
    """Mark bill as paid for current cycle, advance next_due."""
    db = await get_db()
    try:
        bill = await get_bill(bill_id)
        if not bill:
            raise ValueError(f"Bill {bill_id} not found")

        # Mark paid
        await db.execute(
            "UPDATE life_bills SET is_paid = 1 WHERE id = ?", [bill_id]
        )

        # Advance next_due based on frequency
        current_due = date.fromisoformat(bill["next_due"])
        freq = bill["frequency"]
        if freq == "monthly":
            new_due = current_due + relativedelta(months=1)
        elif freq == "quarterly":
            new_due = current_due + relativedelta(months=3)
        elif freq == "yearly":
            new_due = current_due + relativedelta(years=1)
        else:
            # one-time — don't advance, just mark paid
            await db.commit()
            return await get_bill(bill_id)

        await db.execute(
            "UPDATE life_bills SET next_due = ?, is_paid = 0 WHERE id = ?",
            [new_due.isoformat(), bill_id],
        )
        await db.commit()
        return await get_bill(bill_id)
    finally:
        await db.close()


async def delete_bill(bill_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute("DELETE FROM life_bills WHERE id = ?", [bill_id])
        await db.commit()
        return True
    finally:
        await db.close()


# ──────────────────────── Aggregate queries ────────────────────────
# (Documents and files are now handled by the unified backend/documents.py module)

async def get_today_items() -> dict:
    """Get all items for today: events, tasks due, bills due."""
    today_str = _today().isoformat()
    events = await get_events(date_from=today_str, date_to=today_str)
    tasks = await get_tasks(is_completed=False)
    tasks_due_today = [t for t in tasks if t.get("due_date") == today_str]
    bills = await get_bills()
    bills_due_today = [b for b in bills if b.get("next_due") == today_str and not b.get("is_paid")]
    return {
        "events": events,
        "tasks_due": tasks_due_today,
        "bills_due": bills_due_today,
    }


async def get_upcoming(days_ahead: int = 7) -> dict:
    """Get all upcoming items within N days."""
    today_str = _today().isoformat()
    cutoff = (_today() + timedelta(days=days_ahead)).isoformat()
    events = await get_events(date_from=today_str, date_to=cutoff)
    tasks = await get_tasks(is_completed=False)
    tasks_due = [t for t in tasks if t.get("due_date") and t["due_date"] <= cutoff]
    bills = await get_bills(upcoming_days=days_ahead)
    unpaid_bills = [b for b in bills if not b.get("is_paid")]
    return {
        "events": events,
        "tasks_due": tasks_due,
        "bills_due": unpaid_bills,
    }


async def get_overdue() -> dict:
    """Get all overdue items (tasks and bills only — events don't have 'overdue' state)."""
    today_str = _today().isoformat()
    db = await get_db()
    try:
        task_rows = await db.execute_fetchall(
            "SELECT * FROM life_tasks WHERE due_date < ? AND is_completed = 0 ORDER BY due_date ASC",
            [today_str],
        )
        tasks = [dict(r) for r in task_rows]

        bill_rows = await db.execute_fetchall(
            "SELECT * FROM life_bills WHERE next_due < ? AND is_paid = 0 ORDER BY next_due ASC",
            [today_str],
        )
        bills = [dict(r) for r in bill_rows]
    finally:
        await db.close()

    return {"tasks": tasks, "bills": bills}


async def get_timeline(days: int = 14) -> list[dict]:
    """Get timeline data for the next N days (for the dashboard timeline strip)."""
    today = _today()
    all_tasks = await get_tasks(is_completed=False)
    timeline = []
    for i in range(days):
        d = today + timedelta(days=i)
        d_str = d.isoformat()

        # Events: match by date prefix (start_time may be full ISO datetime)
        db = await get_db()
        try:
            event_rows = await db.execute_fetchall(
                """SELECT * FROM life_events
                   WHERE substr(start_time, 1, 10) = ?
                   AND sync_status != 'pending_delete'
                   ORDER BY start_time""",
                [d_str],
            )
            day_events = [dict(r) for r in event_rows]

            bill_rows = await db.execute_fetchall(
                "SELECT * FROM life_bills WHERE next_due = ? AND is_paid = 0",
                [d_str],
            )
            day_bills = [dict(r) for r in bill_rows]
        finally:
            await db.close()

        day_tasks = [t for t in all_tasks if t.get("due_date") == d_str]

        # Check for overdue items on this day (only for today)
        has_overdue = False
        if i == 0:
            overdue = await get_overdue()
            has_overdue = bool(overdue["tasks"] or overdue["bills"])

        # Separate holidays from personal events
        personal_events = [e for e in day_events if not e.get("is_holiday")]
        holidays = [e for e in day_events if e.get("is_holiday")]

        timeline.append({
            "date": d_str,
            "day_name": d.strftime("%a"),
            "day_num": d.day,
            "is_today": i == 0,
            "events": len(personal_events),
            "holidays": [h["title"] for h in holidays],
            "tasks": len(day_tasks),
            "bills": len(day_bills),
            "has_overdue": has_overdue,
            "items": personal_events + day_tasks + day_bills,
        })

    return timeline


async def get_bill_calendar() -> list[dict]:
    """Get bill due dates for a month-view calendar."""
    today = _today()
    # Show current month
    month_start = today.replace(day=1)
    if today.month == 12:
        month_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        month_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

    bills = await get_bills()
    calendar_bills = []
    for b in bills:
        due = b.get("next_due", "")
        if month_start.isoformat() <= due <= month_end.isoformat():
            calendar_bills.append({
                "id": b["id"],
                "name": b["name"],
                "amount": b.get("amount", 0),
                "due_date": due,
                "is_paid": b.get("is_paid", 0),
                "is_autopay": b.get("is_autopay", 0),
                "category": b.get("category", "other"),
            })
    return calendar_bills


async def get_pulse() -> dict:
    """Return key metrics for the Home panel pulse card."""
    today_str = _today().isoformat()

    # Tasks due today
    tasks = await get_tasks(is_completed=False)
    tasks_due_today = len([t for t in tasks if t.get("due_date") == today_str])

    # Upcoming bills (7 days)
    upcoming = await get_bills(upcoming_days=7)
    upcoming_unpaid = len([b for b in upcoming if not b.get("is_paid")])

    # Overdue items
    overdue = await get_overdue()
    overdue_count = len(overdue["tasks"]) + len(overdue["bills"])

    return {
        "tasks_due_today": tasks_due_today,
        "upcoming_bills": upcoming_unpaid,
        "overdue_count": overdue_count,
    }
