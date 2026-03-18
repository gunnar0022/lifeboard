"""
Investing agent — ACTION_REGISTRY.
Maps action names to handler functions and required field schemas.
Every action is validated before execution.
"""
from backend.agents.investing import queries


# --- Write action handlers ---

async def handle_add_holding(data: dict) -> dict:
    return await queries.add_holding(
        symbol=data["symbol"],
        name=data["name"],
        asset_class=data.get("asset_class", "stock"),
        currency=data.get("currency"),
        notes=data.get("notes"),
    )


async def handle_edit_holding(data: dict) -> dict:
    holding_id = data.pop("holding_id")
    return await queries.edit_holding(holding_id, **data)


async def handle_remove_holding(data: dict) -> bool:
    return await queries.remove_holding(data["holding_id"])


async def handle_record_transaction(data: dict) -> dict:
    """Record buy/sell/dividend/split and recalculate cost basis (LM-34)."""
    return await queries.record_transaction(
        holding_id=data["holding_id"],
        tx_type=data["type"],
        shares=data.get("shares", 0),
        price_per_share=data.get("price_per_share", 0),
        total_amount=data.get("total_amount", 0),
        currency=data.get("currency"),
        date_str=data.get("date"),
        notes=data.get("notes"),
    )


async def handle_add_account(data: dict) -> dict:
    return await queries.add_account(
        name=data["name"],
        account_type=data.get("account_type", "brokerage"),
        currency=data.get("currency"),
        notes=data.get("notes"),
    )


async def handle_link_holding_account(data: dict) -> bool:
    return await queries.link_holding_account(
        holding_id=data["holding_id"],
        account_id=data["account_id"],
    )


# --- Read action handlers ---

async def handle_portfolio_summary(data: dict) -> dict:
    return await queries.get_portfolio_summary()


async def handle_holding_detail(data: dict) -> dict:
    result = await queries.get_holding(data["holding_id"])
    if not result:
        raise ValueError(f"Holding {data['holding_id']} not found")
    return result


async def handle_recent_transactions(data: dict) -> list:
    return await queries.get_recent_transactions(
        limit=data.get("limit", 10),
    )


async def handle_holding_transactions(data: dict) -> list:
    return await queries.get_transactions(
        holding_id=data.get("holding_id"),
        limit=data.get("limit", 20),
    )


async def handle_list_holdings(data: dict) -> list:
    return await queries.get_holdings()


async def handle_list_accounts(data: dict) -> list:
    return await queries.get_accounts()


# --- ACTION_REGISTRY ---

ACTION_REGISTRY = {
    # Write — Holdings
    "add_holding": {
        "handler": handle_add_holding,
        "required": ["symbol", "name"],
        "optional": ["asset_class", "currency", "notes"],
    },
    "edit_holding": {
        "handler": handle_edit_holding,
        "required": ["holding_id"],
        "optional": ["symbol", "name", "asset_class", "currency", "notes"],
    },
    "remove_holding": {
        "handler": handle_remove_holding,
        "required": ["holding_id"],
    },
    # Write — Transactions
    "record_transaction": {
        "handler": handle_record_transaction,
        "required": ["holding_id", "type"],
        "optional": ["shares", "price_per_share", "total_amount", "currency", "date", "notes"],
    },
    # Write — Accounts
    "add_account": {
        "handler": handle_add_account,
        "required": ["name"],
        "optional": ["account_type", "currency", "notes"],
    },
    "link_holding_account": {
        "handler": handle_link_holding_account,
        "required": ["holding_id", "account_id"],
    },
    # Read actions
    "portfolio_summary": {
        "handler": handle_portfolio_summary,
        "required": [],
        "is_read": True,
    },
    "holding_detail": {
        "handler": handle_holding_detail,
        "required": ["holding_id"],
        "is_read": True,
    },
    "list_holdings": {
        "handler": handle_list_holdings,
        "required": [],
        "is_read": True,
    },
    "list_accounts": {
        "handler": handle_list_accounts,
        "required": [],
        "is_read": True,
    },
    "recent_transactions": {
        "handler": handle_recent_transactions,
        "required": [],
        "optional": ["limit"],
        "is_read": True,
    },
    "holding_transactions": {
        "handler": handle_holding_transactions,
        "required": [],
        "optional": ["holding_id", "limit"],
        "is_read": True,
    },
}
