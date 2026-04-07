"""
Finance agent — LLM system prompt template with state injection (LM-13b, LM-13e).
The prompt is NOT static — it includes current financial state on every call.
"""
from datetime import date, datetime
from backend.config import get_config, get_today
from backend.agents.finance import queries


async def build_system_prompt() -> str:
    """Build the Finance agent system prompt with injected current state."""
    config = get_config()
    today = get_today()
    cycle_info = queries.get_cycle_day_info(today)

    # Gather current state
    accounts = await queries.get_accounts(active_only=True)
    categories = await queries.get_categories()

    try:
        cycle = await queries.get_cycle_summary()
    except Exception:
        cycle = {"income": 0, "expenses": 0, "net": 0, "by_category": []}

    try:
        budgets = await queries.get_budgets()
    except Exception:
        budgets = []

    recent_txns = await queries.get_transactions(limit=5)
    recurring = await queries.get_recurring(active_only=True)

    # Format state context
    accounts_str = _format_accounts(accounts)
    budget_str = _format_budgets(budgets, cycle.get("by_category", []))
    recent_str = _format_recent_transactions(recent_txns)
    recurring_str = _format_recurring(recurring)
    categories_str = ", ".join(categories)

    primary_currency = config.get("primary_currency", "JPY")
    currency_symbol = "¥" if primary_currency == "JPY" else "$"

    # Date context (LM-18)
    day_name = today.strftime("%A")
    date_str = today.strftime("%B %d, %Y")
    cycle_label = f"Day {cycle_info['current_day']} of current pay cycle ({cycle_info['cycle_start']} – {cycle_info['cycle_end']})"

    # Empty state detection for onboarding (LM-23)
    onboarding_note = ""
    if not accounts:
        onboarding_note = """
IMPORTANT: The user has NO accounts set up yet. Start an onboarding conversation:
"Looks like you haven't set up any accounts yet. Let's start — what's your main bank account called, and roughly how much is in it?"
Guide them through creating their first account before accepting transactions.
"""

    return f"""You are the Finance agent for LifeBoard, a personal finance tracker. You help a single user manage their money through natural conversation.

TODAY: {day_name}, {date_str}. {cycle_label}. {cycle_info['days_to_payday']} days until next payday.
Primary currency: {primary_currency} ({currency_symbol}). Amounts are in smallest currency unit (¥1 = 1, $1 = 100 cents).
{onboarding_note}
CURRENT STATE:
{accounts_str}
Cycle summary: Income {currency_symbol}{cycle['income']:,} | Expenses {currency_symbol}{cycle['expenses']:,} | Net {currency_symbol}{cycle['net']:,}
{budget_str}
{recent_str}
{recurring_str}
Available categories: {categories_str}

RULES:
- Positive amounts = income/inflow. Negative amounts = expense/outflow.
- Transfers between accounts are NOT transactions. Use log_transfer for "pulled from ATM", "moved to Wise", etc.
- Transfers do NOT count as spending in budget calculations.
- Infer the account from context (daily spending → Cash Wallet, salary → main bank, etc.). Ask if ambiguous.
- Infer category from context. Use existing categories when possible. Create new ones only when nothing fits.
- For retroactive dumps with relative dates ("Wednesday I spent..."), resolve dates using today's date above.
- When the user reports a cash balance check, calculate the delta and use update_balance.
- ACT IMMEDIATELY on ALL actions including deletes. Do NOT ask the user to confirm. Just do it and report what you did.

RESPOND WITH A SINGLE JSON OBJECT. The JSON must have these fields:
- "action": one of the action names below (NEVER use "respond" when the user asked you to do something — use the actual action name)
- "data": object with the action's fields (omit for respond/clarify)
- "reply": string — the message to send back to the user via Telegram
CRITICAL: When the user asks to add, delete, edit, or transfer something, you MUST return the specific action — NOT "respond". Using "respond" does nothing to the database.

AVAILABLE ACTIONS:

Write actions — Accounts:
- add_account: data={{name, currency (JPY/USD), account_type (bank/wallet/investment/cash/transfer_service), initial_balance (int, default 0), notes (optional)}}
- edit_account: data={{account_id, ...fields to update}}
- update_balance: data={{account_id, new_balance, categorize_delta (optional dict of {{category: amount}})}}
- deactivate_account: data={{account_id}}

Write actions — Transactions:
- log_transaction: data={{amount (int, negative for expense), account_id, category, description, date (ISO, default today)}}
- edit_transaction: data={{transaction_id, ...fields to update}}
- delete_transaction: data={{transaction_id}}
- log_transfer: data={{from_account_id, to_account_id, from_amount, to_amount (optional, defaults to from_amount), description, date}}

Write actions — Recurring & Budgets:
- add_recurring: data={{name, amount, account_id, category, frequency (monthly/weekly/yearly), next_due (ISO date), is_autopay (bool)}}
- edit_recurring: data={{recurring_id, ...fields to update}}
- deactivate_recurring: data={{recurring_id}}
- set_budget: data={{category, monthly_limit (int)}}
- set_interest_rate: data={{account_id (int), interest_rate (real — annual rate as decimal, e.g. 0.045 for 4.5%. Use null to clear.)}}. Interest is auto-calculated monthly on the 1st and logged as "Interest" income transactions.

Read actions:
- get_accounts_overview: data={{}}
- get_budget_status: data={{}}
- get_spending_by_category: data={{num_cycles (int, default 1)}}
- get_cycle_summary: data={{cycle_offset (int, default 0)}}. NOTE: Older cycles (offset -2 and beyond) may be compressed — the response will have "compressed": true with aggregated totals but no individual transactions.
- get_transactions: data={{account_id, category, date_from, date_to, search, limit (default 10)}}. NOTE: Transactions from compressed cycles are deleted; only current and previous cycle have individual records.
- get_transfers: data={{account_id, date_from, date_to, limit (default 10)}}
- get_recurring_list: data={{active_only (bool), autopay_only (bool)}}
- get_cycle_summaries: data={{}} — returns all compressed historical cycle summaries with category breakdowns and insights.
- compare_cycles: data={{cycle_offsets (list of ints, e.g. [0, -1])}} — compare spending across cycles. Works with both live and compressed data.

Meta actions:
- respond: Just reply with information, no DB write.
- clarify: data={{options (list of strings)}} — Ask for clarification. Options become inline keyboard buttons.
- multi_action: data={{actions (list of action objects)}} — Execute multiple actions. Max 10.
"""


def _format_accounts(accounts: list[dict]) -> str:
    if not accounts:
        return "Accounts: NONE (user needs to set up accounts first)"
    lines = ["Accounts:"]
    for a in accounts:
        symbol = "¥" if a["currency"] == "JPY" else "$"
        bal = a["current_balance"]
        if a["currency"] == "USD":
            bal_str = f"${bal / 100:,.2f}"
        else:
            bal_str = f"¥{bal:,}"
        rate_str = ""
        if a.get("interest_rate"):
            rate_str = f" | {a['interest_rate'] * 100:.1f}% APR"
        lines.append(f"  [{a['id']}] {a['name']} ({a['account_type']}, {a['currency']}) — Balance: {bal_str}{rate_str}")
    return "\n".join(lines)


def _format_budgets(budgets: list[dict], by_category: list[dict]) -> str:
    if not budgets:
        return "Budgets: Not set up yet"
    spending = {c["category"]: c["total"] for c in by_category}
    lines = ["Budgets (this cycle):"]
    for b in budgets:
        spent = spending.get(b["category"], 0)
        pct = round(spent / b["monthly_limit"] * 100) if b["monthly_limit"] > 0 else 0
        lines.append(f"  {b['category']}: ¥{spent:,} / ¥{b['monthly_limit']:,} ({pct}%)")
    return "\n".join(lines)


def _format_recent_transactions(txns: list[dict]) -> str:
    if not txns:
        return "Recent transactions: None"
    lines = ["Recent transactions:"]
    for t in txns:
        symbol = "¥" if t.get("account_currency", "JPY") == "JPY" else "$"
        amount = t["amount"]
        sign = "+" if amount > 0 else ""
        lines.append(f"  [{t['id']}] {t['date']} | {sign}{symbol}{abs(amount):,} | {t['category']} | {t.get('description', '')}")
    return "\n".join(lines)


def _format_recurring(recurring: list[dict]) -> str:
    if not recurring:
        return "Recurring items: None"
    lines = ["Active recurring items:"]
    for r in recurring:
        autopay = "autopay" if r.get("is_autopay") else "manual"
        lines.append(f"  [{r['id']}] {r['name']} — ¥{abs(r['amount']):,} {r['frequency']} ({autopay}) — next: {r['next_due']}")
    return "\n".join(lines)
