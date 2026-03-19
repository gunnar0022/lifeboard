"""
Life Manager agent — LLM system prompt template with state injection (LM-13b, LM-13e).
The prompt is NOT static — it includes current life data state on every call.
"""
from datetime import date, datetime, timedelta
from backend.config import get_config
from backend.agents.life_manager import queries


async def build_system_prompt() -> str:
    """Build the Life Manager system prompt with injected current state."""
    config = get_config()
    today = date.today()

    # Gather current state
    today_items = await queries.get_today_items()
    overdue = await queries.get_overdue()
    upcoming = await queries.get_upcoming(days_ahead=3)
    tasks = await queries.get_tasks(is_completed=False, limit=10)
    bills = await queries.get_bills(limit=10)
    documents = await queries.get_documents(limit=10)

    # Format state context
    today_str = _format_today(today_items)
    overdue_str = _format_overdue(overdue)
    upcoming_str = _format_upcoming(upcoming)
    tasks_str = _format_tasks(tasks)
    bills_str = _format_bills(bills)
    docs_str = _format_documents(documents)

    # Date context (LM-18)
    day_name = today.strftime("%A")
    date_str = today.strftime("%B %d, %Y")

    # Document expiry check
    nearest_expiry = ""
    for doc in documents:
        if doc.get("expiry_date"):
            exp = date.fromisoformat(doc["expiry_date"])
            days_left = (exp - today).days
            if 0 <= days_left <= 30:
                nearest_expiry = f"ALERT: {doc['name']} expires in {days_left} days ({doc['expiry_date']})"
                break

    # Currency for bill amounts
    primary_currency = config.get("primary_currency", "JPY")
    currency_symbol = "¥" if primary_currency == "JPY" else "$"

    # Empty state detection for onboarding (LM-23)
    onboarding_note = ""
    if not documents and not bills and not tasks:
        onboarding_note = """
IMPORTANT: The user has NO documents, bills, or tasks tracked yet. Start an onboarding conversation:
"No documents tracked yet. Want to walk through your important docs? Let's start with housing — do you have a lease?"
Guide them through adding their first document, bill, or task.
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
- For documents, extract and store important metadata in notes: contact names, phone numbers, policy numbers, expiry dates.
- For photos/documents (LM-22), extract structured data from Japanese-language documents when relevant. Common types: 源泉徴収票 (tax), 給与明細 (pay stub), 在留カード (residence card), 健康保険証 (health insurance), 年金手帳 (pension), 住民票 (resident registration).
- ACT IMMEDIATELY on ALL actions including deletes. Do NOT ask the user to confirm. Just do it and report what you did.
- Resolve relative dates ("next Thursday", "tomorrow", "in 3 days") using today's date above.

RESPOND WITH A SINGLE JSON OBJECT. The JSON must have these fields:
- "action": one of the action names below (NEVER use "respond" when the user asked you to do something — use the actual action name)
- "data": object with the action's fields (omit for respond/clarify)
- "reply": string — the message to send back to the user via Telegram
CRITICAL: When the user asks to add, delete, edit, or complete something, you MUST return the specific action — NOT "respond". Using "respond" does nothing to the database.

AVAILABLE ACTIONS:

Write actions — Events:
- add_event: data={{title, date (ISO), time (HH:MM, optional), category (appointment/deadline/reminder/social/errand), description (optional), is_recurring (bool), recurring_rule (optional)}}
- edit_event: data={{event_id, ...fields to update}}
- delete_event: data={{event_id}}
- complete_event: data={{event_id}}

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

Write actions — Documents:
- add_document: data={{name, category (housing/insurance/legal/medical/financial/other), expiry_date (ISO, optional), notes (optional)}}
- edit_document: data={{document_id, ...fields to update}}
- delete_document: data={{document_id}}
- store_file: data={{file_context (str), link_to_document_id (optional), link_to_bill_id (optional), link_to_task_id (optional), extracted_data (optional JSON string)}}

Read actions:
- get_today: data={{}} — Everything happening today
- get_upcoming: data={{days_ahead (int, default 7)}} — Items due in next N days
- get_overdue: data={{}} — All overdue items
- get_tasks: data={{priority, category, is_completed, search, limit (default 10)}}
- get_bills: data={{is_paid, category, upcoming_days}}
- get_events: data={{date_from, date_to, category, search}}
- get_documents: data={{category, expiring_within_days, search}}
- get_file: data={{file_id, search, linked_document_id}} — Retrieve a stored file

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
        lines.append(f"  Event: [{e['id']}] {e['title']} (was {e['date']})")
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
        time_str = f" at {e['time']}" if e.get("time") else ""
        lines.append(f"  {e['date']}: [{e['id']}] {e['title']}{time_str}")
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


def _format_documents(documents: list[dict]) -> str:
    if not documents:
        return "Documents: None tracked"
    lines = [f"Documents ({len(documents)}):"]
    for d in documents:
        expiry = f" — expires {d['expiry_date']}" if d.get("expiry_date") else ""
        lines.append(f"  [{d['id']}] {d['name']} ({d['category']}){expiry}")
    return "\n".join(lines)
