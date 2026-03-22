"""
Life Manager agent — Nudge logic.
Checks bill due dates, high-priority task deadlines, and document expiry.
"""
import logging
from datetime import date, timedelta
from backend.agents.life_manager import queries
from backend.config import get_currency_symbol

logger = logging.getLogger(__name__)


async def check_nudges() -> list[dict]:
    """
    Check all Life Manager nudge conditions and return active nudges.
    Each nudge: {"text": str, "severity": "info"|"warning"|"alert", "agent": "life_manager"}
    """
    nudges = []
    today = date.today()
    symbol = get_currency_symbol()

    try:
        # Bill nudges
        bills = await queries.get_bills()
        for bill in bills:
            if bill.get("is_paid"):
                continue
            due = date.fromisoformat(bill["next_due"])
            days_until = (due - today).days

            if days_until < 0:
                # Overdue
                nudges.append({
                    "text": f"{bill['name']} ({symbol}{bill.get('amount', 0):,}) is overdue by {abs(days_until)} day{'s' if abs(days_until) > 1 else ''}",
                    "severity": "alert",
                    "agent": "life_manager",
                })
            elif days_until <= 3:
                # Due within 3 days
                if days_until == 0:
                    nudges.append({
                        "text": f"{bill['name']} ({symbol}{bill.get('amount', 0):,}) is due today",
                        "severity": "warning",
                        "agent": "life_manager",
                    })
                else:
                    nudges.append({
                        "text": f"{bill['name']} ({symbol}{bill.get('amount', 0):,}) due in {days_until} day{'s' if days_until > 1 else ''}",
                        "severity": "info",
                        "agent": "life_manager",
                    })

        # High-priority task nudges
        tasks = await queries.get_tasks(is_completed=False, priority="high")
        for task in tasks:
            if not task.get("due_date"):
                continue
            due = date.fromisoformat(task["due_date"])
            days_until = (due - today).days

            if days_until < 0:
                nudges.append({
                    "text": f"High priority task overdue: {task['title']}",
                    "severity": "alert",
                    "agent": "life_manager",
                })
            elif days_until <= 2:
                suffix = "s" if days_until > 1 else ""
                due_text = "today" if days_until == 0 else f"in {days_until} day{suffix}"
                nudges.append({
                    "text": f"High priority task due {due_text}: {task['title']}",
                    "severity": "warning",
                    "agent": "life_manager",
                })

    except Exception as e:
        logger.error(f"Life Manager nudge check error: {e}")

    return nudges
