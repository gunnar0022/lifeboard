"""
Finance agent — ACTION_REGISTRY (LM-13d).
Maps action names to handler functions and required field schemas.
Every action is validated before execution.
"""
from backend.agents.finance import queries
from backend import llm_client


# --- Action handlers ---

async def handle_add_account(data: dict) -> dict:
    return await queries.add_account(
        name=data["name"],
        currency=data.get("currency", "JPY"),
        account_type=data.get("account_type", "bank"),
        initial_balance=data.get("initial_balance", 0),
        notes=data.get("notes"),
    )


async def handle_edit_account(data: dict) -> dict:
    account_id = data.pop("account_id")
    return await queries.edit_account(account_id, **data)


async def handle_update_balance(data: dict) -> dict:
    account_id = data["account_id"]
    new_balance = data["new_balance"]
    categorize_delta = data.get("categorize_delta")

    account = await queries.get_account(account_id)
    if not account:
        raise ValueError(f"Account {account_id} not found")

    old_balance = account["current_balance"]
    delta = new_balance - old_balance

    if categorize_delta and isinstance(categorize_delta, dict):
        # Split the delta into categorized transactions
        for category, amount in categorize_delta.items():
            await queries.log_transaction(
                amount=-abs(amount),
                account_id=account_id,
                category=category,
                description=f"Cash spending ({category})",
            )
        # Check if categorized amounts cover the full delta
        categorized_total = sum(abs(v) for v in categorize_delta.values())
        uncategorized = abs(delta) - categorized_total
        if uncategorized > 0:
            await queries.log_transaction(
                amount=-uncategorized,
                account_id=account_id,
                category="Other",
                description="Uncategorized cash spending",
            )
    elif delta < 0:
        # Unspecified: log as uncategorized
        await queries.log_transaction(
            amount=delta,
            account_id=account_id,
            category="Other",
            description="Uncategorized cash spending",
        )
    elif delta > 0:
        await queries.log_transaction(
            amount=delta,
            account_id=account_id,
            category="Income",
            description="Balance adjustment (increase)",
        )

    return await queries.get_account(account_id)


async def handle_deactivate_account(data: dict) -> bool:
    return await queries.deactivate_account(data["account_id"])


async def handle_log_transaction(data: dict) -> dict:
    return await queries.log_transaction(
        amount=data["amount"],
        account_id=data["account_id"],
        category=data.get("category", "Other"),
        description=data.get("description"),
        date_str=data.get("date"),
        is_recurring=data.get("is_recurring", False),
        recurring_id=data.get("recurring_id"),
    )


async def handle_edit_transaction(data: dict) -> dict:
    tx_id = data.pop("transaction_id")
    return await queries.edit_transaction(tx_id, **data)


async def handle_delete_transaction(data: dict) -> bool:
    return await queries.delete_transaction(data["transaction_id"])


async def handle_log_transfer(data: dict) -> dict:
    return await queries.log_transfer(
        from_account_id=data["from_account_id"],
        to_account_id=data["to_account_id"],
        from_amount=data["from_amount"],
        to_amount=data.get("to_amount"),
        description=data.get("description"),
        date_str=data.get("date"),
    )


async def handle_add_recurring(data: dict) -> dict:
    return await queries.add_recurring(
        name=data["name"],
        amount=data["amount"],
        account_id=data["account_id"],
        category=data.get("category", "Other"),
        frequency=data.get("frequency", "monthly"),
        next_due=data["next_due"],
        is_autopay=data.get("is_autopay", False),
    )


async def handle_edit_recurring(data: dict) -> dict:
    rec_id = data.pop("recurring_id")
    return await queries.edit_recurring(rec_id, **data)


async def handle_deactivate_recurring(data: dict) -> bool:
    return await queries.deactivate_recurring(data["recurring_id"])


async def handle_set_budget(data: dict) -> dict:
    return await queries.set_budget(
        category=data["category"],
        monthly_limit=data["monthly_limit"],
    )


# --- Read action handlers ---

async def handle_get_accounts_overview(data: dict) -> dict:
    return await queries.get_accounts_overview()


async def handle_get_budget_status(data: dict) -> dict:
    return await queries.get_budget_status()


async def handle_get_spending_by_category(data: dict) -> list:
    return await queries.get_spending_by_category(
        num_cycles=data.get("num_cycles", 1)
    )


async def handle_get_cycle_summary(data: dict) -> dict:
    return await queries.get_cycle_summary(
        cycle_offset=data.get("cycle_offset", 0)
    )


async def handle_get_transactions(data: dict) -> list:
    return await queries.get_transactions(
        account_id=data.get("account_id"),
        category=data.get("category"),
        date_from=data.get("date_from"),
        date_to=data.get("date_to"),
        search=data.get("search"),
        limit=data.get("limit", 10),
    )


async def handle_get_transfers(data: dict) -> list:
    return await queries.get_transfers(
        account_id=data.get("account_id"),
        date_from=data.get("date_from"),
        date_to=data.get("date_to"),
        limit=data.get("limit", 10),
    )


async def handle_get_recurring_list(data: dict) -> list:
    return await queries.get_recurring(
        active_only=data.get("active_only", True),
        autopay_only=data.get("autopay_only"),
    )


async def handle_set_interest_rate(data: dict) -> dict:
    result = await queries.set_interest_rate(
        account_id=data["account_id"],
        interest_rate=data["interest_rate"],
    )
    if not result:
        raise ValueError(f"Account {data['account_id']} not found")
    return result


async def handle_get_cycle_summaries(data: dict) -> list:
    return await queries.get_all_cycle_summaries()


async def handle_compare_cycles(data: dict) -> list:
    offsets = data.get("cycle_offsets", [0, -1])
    results = []
    for offset in offsets:
        summary = await queries.get_cycle_summary(cycle_offset=offset)
        results.append({"cycle_offset": offset, **summary})
    return results


# --- ACTION_REGISTRY (LM-13d) ---

ACTION_REGISTRY = {
    # Write — Accounts
    "add_account": {
        "handler": handle_add_account,
        "required": ["name"],
        "optional": ["currency", "account_type", "initial_balance", "notes"],
    },
    "edit_account": {
        "handler": handle_edit_account,
        "required": ["account_id"],
        "optional": ["name", "currency", "account_type", "current_balance", "notes"],
    },
    "update_balance": {
        "handler": handle_update_balance,
        "required": ["account_id", "new_balance"],
        "optional": ["categorize_delta"],
    },
    "deactivate_account": {
        "handler": handle_deactivate_account,
        "required": ["account_id"],
    },
    # Write — Transactions
    "log_transaction": {
        "handler": handle_log_transaction,
        "required": ["amount", "account_id"],
        "optional": ["category", "description", "date", "is_recurring", "recurring_id"],
    },
    "edit_transaction": {
        "handler": handle_edit_transaction,
        "required": ["transaction_id"],
        "optional": ["amount", "account_id", "category", "description", "date"],
    },
    "delete_transaction": {
        "handler": handle_delete_transaction,
        "required": ["transaction_id"],
    },
    "log_transfer": {
        "handler": handle_log_transfer,
        "required": ["from_account_id", "to_account_id", "from_amount"],
        "optional": ["to_amount", "description", "date"],
    },
    # Write — Recurring & Budgets
    "add_recurring": {
        "handler": handle_add_recurring,
        "required": ["name", "amount", "account_id", "next_due"],
        "optional": ["category", "frequency", "is_autopay"],
    },
    "edit_recurring": {
        "handler": handle_edit_recurring,
        "required": ["recurring_id"],
        "optional": ["name", "amount", "account_id", "category", "frequency", "next_due", "is_autopay"],
    },
    "deactivate_recurring": {
        "handler": handle_deactivate_recurring,
        "required": ["recurring_id"],
    },
    "set_budget": {
        "handler": handle_set_budget,
        "required": ["category", "monthly_limit"],
    },
    "set_interest_rate": {
        "handler": handle_set_interest_rate,
        "required": ["account_id", "interest_rate"],
    },
    # Read actions
    "get_accounts_overview": {
        "handler": handle_get_accounts_overview,
        "required": [],
        "is_read": True,
    },
    "get_budget_status": {
        "handler": handle_get_budget_status,
        "required": [],
        "is_read": True,
    },
    "get_spending_by_category": {
        "handler": handle_get_spending_by_category,
        "required": [],
        "optional": ["num_cycles"],
        "is_read": True,
    },
    "get_cycle_summary": {
        "handler": handle_get_cycle_summary,
        "required": [],
        "optional": ["cycle_offset"],
        "is_read": True,
    },
    "get_transactions": {
        "handler": handle_get_transactions,
        "required": [],
        "optional": ["account_id", "category", "date_from", "date_to", "search", "limit"],
        "is_read": True,
    },
    "get_transfers": {
        "handler": handle_get_transfers,
        "required": [],
        "optional": ["account_id", "date_from", "date_to", "limit"],
        "is_read": True,
    },
    "get_recurring_list": {
        "handler": handle_get_recurring_list,
        "required": [],
        "optional": ["active_only", "autopay_only"],
        "is_read": True,
    },
    "get_cycle_summaries": {
        "handler": handle_get_cycle_summaries,
        "required": [],
        "is_read": True,
    },
    "compare_cycles": {
        "handler": handle_compare_cycles,
        "required": [],
        "optional": ["cycle_offsets"],
        "is_read": True,
    },
}
