"""
Investing agent — LLM system prompt template with state injection.
The prompt is NOT static — it includes current portfolio state on every call.
"""
from datetime import date
from backend.config import get_config, get_currency_symbol
from backend.agents.investing import queries


async def build_system_prompt() -> str:
    """Build the Investing agent system prompt with injected current state."""
    config = get_config()
    today = date.today()
    primary_currency = config.get("primary_currency", "JPY")
    symbol = get_currency_symbol()

    # Gather current state
    holdings = await queries.get_holdings()
    accounts = await queries.get_accounts()
    recent_txns = await queries.get_recent_transactions(limit=5)
    portfolio = await queries.get_portfolio_summary()

    # Format state context
    holdings_str = _format_holdings(holdings, symbol)
    accounts_str = _format_accounts(accounts)
    recent_str = _format_recent_transactions(recent_txns, symbol)
    portfolio_str = _format_portfolio(portfolio, symbol)

    # Date context
    day_name = today.strftime("%A")
    date_str = today.strftime("%B %d, %Y")

    # Empty state detection for onboarding
    onboarding_note = ""
    if not holdings:
        onboarding_note = """
IMPORTANT: The user has NO holdings yet. Start an onboarding conversation:
"Let's set up your investment portfolio. What's your first holding? Tell me the ticker symbol and how many shares you have."
Guide them through creating their first holding before accepting transactions.
"""

    return f"""You are the Investing agent for LifeBoard, an investment portfolio tracker. You help a single user manage their investments through natural conversation.

TODAY: {day_name}, {date_str}
Primary currency: {primary_currency} ({symbol}). Amounts are in smallest currency unit (JPY=1, USD cents=100).
{onboarding_note}
CURRENT STATE:
{portfolio_str}
{holdings_str}
{accounts_str}
{recent_str}

RULES:
- For buy/sell, calculate total_amount = shares * price_per_share in smallest unit.
- For JPY stocks: price is in yen (integer). For USD stocks: price is in cents (e.g. $420.50 = 42050).
- Infer the holding from the ticker symbol. Ask if ambiguous.
- For new holdings that don't exist yet, use add_holding first, then record_transaction.
- BUY: adds shares, recalculates weighted average cost (LM-34).
- SELL: removes shares, cost basis avg unchanged.
- DIVIDEND: no share change, logs the income amount.
- SPLIT: shares field = split ratio (e.g. 2.0 for 2:1), adjusts shares and avg cost.
- ACT IMMEDIATELY on ALL actions including deletes. Do NOT ask the user to confirm. Just do it and report what you did.

RESPOND WITH A SINGLE JSON OBJECT. The JSON must have these fields:
- "action": one of the action names below
- "data": object with the action's fields (omit for respond/clarify)
- "reply": string — the message to send back to the user via Telegram

AVAILABLE ACTIONS:

Write actions — Holdings:
- add_holding: data={{symbol, name, asset_class (stock/etf/crypto/bond/other), currency (JPY/USD), notes (optional)}}
- edit_holding: data={{holding_id, ...fields to update}}
- remove_holding: data={{holding_id}}

Write actions — Transactions:
- record_transaction: data={{holding_id, type (buy/sell/dividend/split), shares (float), price_per_share (int, smallest unit), total_amount (int, smallest unit), currency, date (ISO), notes (optional)}}

Write actions — Accounts:
- add_account: data={{name, account_type (brokerage/retirement/crypto), currency, notes (optional)}}
- link_holding_account: data={{holding_id, account_id}}

Read actions:
- portfolio_summary: data={{}}
- holding_detail: data={{holding_id}}
- list_holdings: data={{}}
- list_accounts: data={{}}
- recent_transactions: data={{limit (default 10)}}
- holding_transactions: data={{holding_id, limit (default 20)}}

Meta actions:
- respond: Just reply with information, no DB write.
- clarify: data={{options (list of strings)}} — Ask for clarification. Options become inline keyboard buttons.
- multi_action: data={{actions (list of action objects)}} — Execute multiple actions. Max 10.
"""


def _format_holdings(holdings: list[dict], symbol: str) -> str:
    if not holdings:
        return "Holdings: NONE (user needs to add holdings first)"
    lines = ["Holdings:"]
    for h in holdings:
        cur_sym = symbol if h["currency"] == "JPY" else "$"
        if h["currency"] == "USD":
            price_str = f"${h['current_price'] / 100:,.2f}"
            avg_str = f"${h['avg_cost_per_share'] / 100:,.2f}"
            mv_str = f"${h['market_value'] / 100:,.2f}"
        else:
            price_str = f"{symbol}{h['current_price']:,}"
            avg_str = f"{symbol}{h['avg_cost_per_share']:,}"
            mv_str = f"{symbol}{h['market_value']:,}"

        sign = "+" if h["gain_loss"] >= 0 else ""
        pct = h["gain_loss_pct"]
        lines.append(
            f"  [{h['id']}] {h['symbol']} ({h['name']}) — {h['asset_class']}, "
            f"{h['total_shares']} shares @ {avg_str} avg | "
            f"Price: {price_str} | MV: {mv_str} | {sign}{pct}%"
        )
    return "\n".join(lines)


def _format_accounts(accounts: list[dict]) -> str:
    if not accounts:
        return "Investment accounts: NONE"
    lines = ["Investment accounts:"]
    for a in accounts:
        lines.append(f"  [{a['id']}] {a['name']} ({a['type']}, {a['currency']})")
    return "\n".join(lines)


def _format_recent_transactions(txns: list[dict], symbol: str) -> str:
    if not txns:
        return "Recent transactions: None"
    lines = ["Recent transactions:"]
    for t in txns:
        cur_sym = symbol if t.get("currency", "JPY") == "JPY" else "$"
        lines.append(
            f"  [{t['id']}] {t['date']} | {t['type'].upper()} {t.get('symbol', '')} | "
            f"{t['shares']} shares @ {cur_sym}{t['price_per_share']:,} | "
            f"Total: {cur_sym}{t['total_amount']:,}"
        )
    return "\n".join(lines)


def _format_portfolio(portfolio: dict, symbol: str) -> str:
    tv = portfolio["total_value"]
    tc = portfolio["total_cost"]
    gl = portfolio["gain_loss"]
    glp = portfolio["gain_loss_pct"]
    sign = "+" if gl >= 0 else ""
    return (
        f"Portfolio summary: Total value {symbol}{tv:,} | "
        f"Cost basis {symbol}{tc:,} | "
        f"Gain/loss {sign}{symbol}{gl:,} ({sign}{glp}%) | "
        f"{portfolio['holding_count']} holdings"
    )
