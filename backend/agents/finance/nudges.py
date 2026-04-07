"""
Finance agent — Nudge logic.
Checks budget thresholds and recurring item due dates.
"""
import logging
from datetime import date, timedelta
from backend.agents.finance import queries
from backend.config import get_currency_symbol, get_today

logger = logging.getLogger(__name__)


async def check_nudges() -> list[dict]:
    """
    Check all Finance nudge conditions and return active nudges.
    Each nudge: {"text": str, "severity": "info"|"warning"|"alert", "agent": "finance"}
    """
    nudges = []

    try:
        # Budget threshold nudges
        budget_status = await queries.get_budget_status()
        if budget_status["total_budget"] > 0:
            # Total cycle spend > 90% → alert
            if budget_status["percentage"] >= 90:
                nudges.append({
                    "text": f"Budget alert: {budget_status['percentage']}% of total budget used",
                    "severity": "alert",
                    "agent": "finance",
                })

            # Per-category > 80% → warning
            for cat in budget_status.get("categories", []):
                if cat["percentage"] >= 80 and cat["budget"] > 0:
                    symbol = get_currency_symbol()
                    nudges.append({
                        "text": f"{cat['category']}: {cat['percentage']}% of {symbol}{cat['budget']:,} budget used",
                        "severity": "warning",
                        "agent": "finance",
                    })

        # Recurring item nudges
        recurring = await queries.get_recurring(active_only=True)
        today = get_today()
        for item in recurring:
            due = date.fromisoformat(item["next_due"])
            days_until = (due - today).days

            if not item.get("is_autopay") and 0 <= days_until <= 3:
                symbol = get_currency_symbol()
                if days_until == 0:
                    nudges.append({
                        "text": f"{item['name']} ({symbol}{abs(item['amount']):,}) is due today",
                        "severity": "warning",
                        "agent": "finance",
                    })
                else:
                    nudges.append({
                        "text": f"{item['name']} ({symbol}{abs(item['amount']):,}) due in {days_until} day{'s' if days_until > 1 else ''}",
                        "severity": "info",
                        "agent": "finance",
                    })

    except Exception as e:
        logger.error(f"Finance nudge check error: {e}")

    return nudges
