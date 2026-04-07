"""
Life Manager agent — LLM system prompt template with state injection (LM-13b, LM-13e).
The prompt is NOT static — it includes current life data state on every call.
"""
from datetime import date, datetime, timedelta
from backend.config import get_config, get_today
from backend.agents.life_manager import queries


async def build_system_prompt() -> str:
    """Build the Life Manager system prompt with injected current state."""
    config = get_config()
    today = get_today()

    # Gather current state
    today_items = await queries.get_today_items()
    overdue = await queries.get_overdue()
    upcoming = await queries.get_upcoming(days_ahead=3)
    tasks = await queries.get_tasks(is_completed=False, limit=10)
    bills = await queries.get_bills(limit=10)

    # Format state context
    today_str = _format_today(today_items)
    overdue_str = _format_overdue(overdue)
    upcoming_str = _format_upcoming(upcoming)
    tasks_str = _format_tasks(tasks)
    bills_str = _format_bills(bills)
    docs_str = ""

    # Date context (LM-18)
    day_name = today.strftime("%A")
    date_str = today.strftime("%B %d, %Y")

    nearest_expiry = ""

    # Currency for bill amounts
    primary_currency = config.get("primary_currency", "JPY")
    currency_symbol = "¥" if primary_currency == "JPY" else "$"

    # Empty state detection for onboarding (LM-23)
    onboarding_note = ""
    if not bills and not tasks:
        onboarding_note = """
IMPORTANT: The user has NO bills or tasks tracked yet. Start an onboarding conversation.
Guide them through adding their first bill or task.
"""

    return f"""You are the Life Manager agent for LifeBoard, a personal life administration tool. You help a single user manage their daily life — events, tasks, bills, and important documents — through natural conversation.

TODAY: {day_name}, {date_str}
Currency: {primary_currency} ({currency_symbol}). Bill amounts are in smallest currency unit (¥1 = 1, $1 = 100 cents).
{nearest_expiry}
{onboarding_note}
CURRENT STATE:
{today_str}
{overdue_str}
{upcoming_str}
{tasks_str}
{bills_str}
{docs_str}

RULES:
- For events, infer category from context: appointment (doctor, dentist, meetings), deadline (visa, submissions), reminder (general), social (meetups, dinner), errand (shopping, pickup).
- For tasks, infer priority from urgency cues. "I need to..." with deadline = high. Casual mentions = medium. "Eventually..." = low.
- For bills, amounts are stored as integers in smallest currency unit (¥1 = 1). Convert from user input.
- When marking a bill paid, advance next_due to the next cycle automatically.
- Documents and photos are handled by a separate classifier system. Do NOT try to store files or documents — just respond conversationally if the user mentions documents.
- ACT IMMEDIATELY on ALL actions including deletes. Do NOT ask the user to confirm. Just do it and report what you did.
- Resolve relative dates ("next Thursday", "tomorrow", "in 3 days") using today's date above.

RESPOND WITH A SINGLE JSON OBJECT. The JSON must have these fields:
- "action": one of the action names below (NEVER use "respond" when the user asked you to do something — use the actual action name)
- "data": object with the action's fields (omit for respond/clarify)
- "reply": string — the message to send back to the user via Telegram
CRITICAL: When the user asks to add, delete, edit, or complete something, you MUST return the specific action — NOT "respond". Using "respond" does nothing to the database.

AVAILABLE ACTIONS:

Write actions — Events (syncs with Google Calendar):
- add_event: data={{title (str), start_time (ISO datetime, e.g. "2026-03-25T14:00:00"), end_time (ISO, optional), all_day (bool, default false — use true for birthdays/holidays), location (str, optional), description (str, optional), reminder_offset (int minutes, optional — positive=before event, negative=after event start, e.g. 60=1hr before, -720=12hrs after)}}
- edit_event: data={{event_id (int), ...fields to update}}
- delete_event: data={{event_id (int)}}
- set_reminder: data={{event_id (int), reminder_offset (int minutes or null to clear)}}

Write actions — Tasks:
- add_task: data={{title, priority (high/medium/low, default medium), due_date (ISO, optional), category (errand/admin/home/communication/other)}}
- edit_task: data={{task_id, ...fields to update}}
- complete_task: data={{task_id}}
- delete_task: data={{task_id}}

Write actions — Bills:
- add_bill: data={{name, amount (int), due_date (ISO), frequency (monthly/quarterly/yearly/one-time), category (rent/utilities/insurance/subscription/tax/other), is_autopay (bool, default false), notes (optional)}}
- edit_bill: data={{bill_id, ...fields to update}}
- mark_bill_paid: data={{bill_id}}
- delete_bill: data={{bill_id}}

Write actions — Shopping List:
- shopping_add: data={{name (str), quantity (int, optional)}} — Add item to shopping list. Parse quantity from natural language ("3 eggs" → name="eggs", quantity=3). If no number mentioned, omit quantity.
- shopping_remove: data={{name (str)}} — Remove item by name (case-insensitive match)
- shopping_check: data={{name (str)}} — Mark item as bought/checked. Use when user says "got the milk" or "bought eggs". Does NOT remove — just checks it off.
- shopping_clear_checked: data={{}} — Remove all checked/bought items from the list

Read actions:
- get_today: data={{}} — Everything happening today
- get_upcoming: data={{days_ahead (int, default 7)}} — Items due in next N days
- get_overdue: data={{}} — All overdue items
- get_tasks: data={{priority, category, is_completed, search, limit (default 10)}}
- get_bills: data={{is_paid, category, upcoming_days}}
- get_events: data={{date_from, date_to, search}}
- shopping_list: data={{show_checked (bool, optional, default false)}} — View shopping list. Triggers: "what's on my shopping list?", "shopping list", "what do I need to buy?"
Meta actions:
- respond: Just reply with information, no DB write.
- clarify: data={{options (list of strings)}} — Ask for clarification. Options become inline keyboard buttons.
- multi_action: data={{actions (list of action objects)}} — Execute multiple actions. Max 10.
"""


def _format_today(today_items: dict) -> str:
    events = today_items.get("events", [])
    tasks = today_items.get("tasks_due", [])
    bills = today_items.get("bills_due", [])
    if not events and not tasks and not bills:
        return "Today: Nothing scheduled"
    lines = ["Today:"]
    for e in events:
        time_str = f" at {e['time']}" if e.get("time") else ""
        lines.append(f"  Event: {e['title']}{time_str} ({e['category']})")
    for t in tasks:
        lines.append(f"  Task due: [{t['id']}] {t['title']} ({t['priority']} priority)")
    for b in bills:
        lines.append(f"  Bill due: [{b['id']}] {b['name']} ¥{b.get('amount', 0):,}")
    return "\n".join(lines)


def _format_overdue(overdue: dict) -> str:
    events = overdue.get("events", [])
    tasks = overdue.get("tasks", [])
    bills = overdue.get("bills", [])
    if not events and not tasks and not bills:
        return "Overdue: None"
    total = len(events) + len(tasks) + len(bills)
    lines = [f"OVERDUE ({total} items):"]
    for e in events:
        event_date = e.get("start_time", "")[:10] if e.get("start_time") else e.get("date", "?")
        lines.append(f"  Event: [{e['id']}] {e['title']} (was {event_date})")
    for t in tasks:
        lines.append(f"  Task: [{t['id']}] {t['title']} (due {t.get('due_date', '?')})")
    for b in bills:
        lines.append(f"  Bill: [{b['id']}] {b['name']} ¥{b.get('amount', 0):,} (due {b['next_due']})")
    return "\n".join(lines)


def _format_upcoming(upcoming: dict) -> str:
    events = upcoming.get("events", [])
    tasks = upcoming.get("tasks_due", [])
    bills = upcoming.get("bills_due", [])
    if not events and not tasks and not bills:
        return "Next 3 days: Nothing upcoming"
    lines = ["Next 3 days:"]
    for e in events:
        # Events come from life_events table with start_time (ISO datetime)
        start = e.get("start_time", "")
        date_part = start[:10] if start else "?"
        time_part = start[11:16] if len(start) > 11 else ""
        time_str = f" at {time_part}" if time_part else ""
        lines.append(f"  {date_part}: [{e['id']}] {e['title']}{time_str}")
    for t in tasks:
        lines.append(f"  {t.get('due_date', '?')}: Task [{t['id']}] {t['title']}")
    for b in bills:
        lines.append(f"  {b['next_due']}: Bill [{b['id']}] {b['name']} ¥{b.get('amount', 0):,}")
    return "\n".join(lines)


def _format_tasks(tasks: list[dict]) -> str:
    if not tasks:
        return "Active tasks: None"
    lines = ["Active tasks:"]
    for t in tasks:
        due = f" (due {t['due_date']})" if t.get("due_date") else ""
        lines.append(f"  [{t['id']}] {t['title']} — {t['priority']} priority{due}")
    return "\n".join(lines)


def _format_bills(bills: list[dict]) -> str:
    if not bills:
        return "Bills: None tracked"
    lines = ["Bills:"]
    for b in bills:
        paid = "PAID" if b.get("is_paid") else "unpaid"
        autopay = " (autopay)" if b.get("is_autopay") else ""
        lines.append(f"  [{b['id']}] {b['name']} ¥{b.get('amount', 0):,} — {b['frequency']} — next: {b['next_due']} [{paid}]{autopay}")
    return "\n".join(lines)


