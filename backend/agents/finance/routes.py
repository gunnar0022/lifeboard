"""Finance agent — FastAPI routes (dashboard API per LM-08)."""
import time
import logging
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.agents.finance import queries
from backend.config import get_config

logger = logging.getLogger("lifeboard")

router = APIRouter(prefix="/api/finance", tags=["finance"])


# --- Request models ---

class AccountCreate(BaseModel):
    name: str
    currency: str = "JPY"
    account_type: str = "bank"
    initial_balance: int = 0
    notes: Optional[str] = None

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    account_type: Optional[str] = None
    current_balance: Optional[int] = None
    interest_rate: Optional[float] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = None

class TransactionCreate(BaseModel):
    amount: int
    account_id: int
    category: str
    description: Optional[str] = None
    date: Optional[str] = None
    is_recurring: bool = False
    recurring_id: Optional[int] = None

class TransactionUpdate(BaseModel):
    amount: Optional[int] = None
    account_id: Optional[int] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None

class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    from_amount: int
    to_amount: Optional[int] = None
    description: Optional[str] = None
    date: Optional[str] = None

class RecurringCreate(BaseModel):
    name: str
    amount: int
    account_id: int
    category: str
    frequency: str = "monthly"
    next_due: str
    is_autopay: bool = False

class RecurringUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[int] = None
    account_id: Optional[int] = None
    category: Optional[str] = None
    frequency: Optional[str] = None
    next_due: Optional[str] = None
    is_autopay: Optional[bool] = None

class BudgetSet(BaseModel):
    category: str
    monthly_limit: int


# --- Pulse endpoint (Home panel) ---

@router.get("/pulse")
async def get_pulse():
    """Key metrics for the Home panel pulse card."""
    config = get_config()
    primary_currency = config.get("primary_currency", "JPY")

    try:
        overview = await queries.get_accounts_overview()
        cycle = await queries.get_cycle_summary()
        cycle_info = queries.get_cycle_day_info()
        budget_status = await queries.get_budget_status()

        primary_total = 0
        for group in overview["by_currency"]:
            if group["currency"] == primary_currency:
                primary_total = group["total"]

        # Use configured salary as the baseline, falling back to recorded income
        monthly_salary = config.get("monthly_salary", 0)
        income_base = monthly_salary if monthly_salary > 0 else cycle["income"]
        net_remaining = income_base - cycle["expenses"]
        budget_pct = budget_status["percentage"] if budget_status["total_budget"] > 0 else 0
        prefix = "¥" if primary_currency == "JPY" else "$"

        # On an empty cycle (e.g. payday), show total balance instead of ¥0 net
        if net_remaining == 0 and income_base == 0:
            net_label = "Balance"
            net_value = f"{prefix}{primary_total:,}"
        else:
            net_label = "Net remaining"
            net_value = f"{prefix}{net_remaining:,}"

        return {
            "metrics": [
                {"label": net_label, "value": net_value},
                {"label": "Budget usage", "value": f"{budget_pct}%"},
                {"label": "Days to payday", "value": str(cycle_info["days_to_payday"])},
            ]
        }
    except Exception:
        return {
            "metrics": [
                {"label": "Net remaining", "value": "—"},
                {"label": "Budget usage", "value": "—"},
                {"label": "Days to payday", "value": "—"},
            ]
        }


# --- Accounts ---

@router.get("/accounts")
async def list_accounts(active_only: bool = True):
    return await queries.get_accounts(active_only=active_only)


@router.get("/accounts/overview")
async def accounts_overview():
    return await queries.get_accounts_overview()


@router.post("/accounts")
async def create_account(body: AccountCreate):
    return await queries.add_account(
        name=body.name, currency=body.currency,
        account_type=body.account_type,
        initial_balance=body.initial_balance, notes=body.notes
    )


@router.put("/accounts/{account_id}")
async def update_account(account_id: int, body: AccountUpdate):
    result = await queries.edit_account(account_id, **body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(404, "Account not found")
    return result


@router.delete("/accounts/{account_id}")
async def remove_account(account_id: int):
    await queries.deactivate_account(account_id)
    return {"ok": True}


# --- Transactions ---

@router.get("/transactions")
async def list_transactions(
    account_id: Optional[int] = None,
    category: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    return await queries.get_transactions(
        account_id=account_id, category=category,
        date_from=date_from, date_to=date_to,
        search=search, limit=limit, offset=offset
    )


@router.post("/transactions")
async def create_transaction(body: TransactionCreate):
    return await queries.log_transaction(
        amount=body.amount, account_id=body.account_id,
        category=body.category, description=body.description,
        date_str=body.date, is_recurring=body.is_recurring,
        recurring_id=body.recurring_id
    )


@router.put("/transactions/{transaction_id}")
async def update_transaction(transaction_id: int, body: TransactionUpdate):
    result = await queries.edit_transaction(transaction_id, **body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(404, "Transaction not found")
    return result


@router.delete("/transactions/{transaction_id}")
async def remove_transaction(transaction_id: int):
    ok = await queries.delete_transaction(transaction_id)
    if not ok:
        raise HTTPException(404, "Transaction not found")
    return {"ok": True}


# --- Transfers ---

@router.get("/transfers")
async def list_transfers(
    account_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50,
):
    return await queries.get_transfers(
        account_id=account_id, date_from=date_from,
        date_to=date_to, limit=limit
    )


@router.post("/transfers")
async def create_transfer(body: TransferCreate):
    return await queries.log_transfer(
        from_account_id=body.from_account_id,
        to_account_id=body.to_account_id,
        from_amount=body.from_amount,
        to_amount=body.to_amount,
        description=body.description,
        date_str=body.date
    )


# --- Recurring ---

@router.get("/recurring")
async def list_recurring(
    active_only: bool = True,
    autopay_only: Optional[bool] = None,
):
    return await queries.get_recurring(active_only=active_only, autopay_only=autopay_only)


@router.post("/recurring")
async def create_recurring(body: RecurringCreate):
    return await queries.add_recurring(
        name=body.name, amount=body.amount,
        account_id=body.account_id, category=body.category,
        frequency=body.frequency, next_due=body.next_due,
        is_autopay=body.is_autopay
    )


@router.put("/recurring/{recurring_id}")
async def update_recurring(recurring_id: int, body: RecurringUpdate):
    result = await queries.edit_recurring(recurring_id, **body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(404, "Recurring item not found")
    return result


@router.delete("/recurring/{recurring_id}")
async def remove_recurring(recurring_id: int):
    await queries.deactivate_recurring(recurring_id)
    return {"ok": True}


# --- Budgets ---

@router.get("/budgets")
async def list_budgets():
    return await queries.get_budgets()


@router.post("/budgets")
async def upsert_budget(body: BudgetSet):
    return await queries.set_budget(category=body.category, monthly_limit=body.monthly_limit)


@router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: int):
    from backend.database import get_db
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM finance_budgets WHERE id = ?", (budget_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Budget not found")
        return {"ok": True}
    finally:
        await db.close()


# --- Aggregates ---

@router.get("/cycle")
async def cycle_summary(offset: int = 0):
    return await queries.get_cycle_summary(cycle_offset=offset)


@router.get("/cycle/info")
async def cycle_info():
    return queries.get_cycle_day_info()


@router.get("/budget-status")
async def budget_status():
    return await queries.get_budget_status()


@router.get("/spending-by-category")
async def spending_by_category(num_cycles: int = 1):
    return await queries.get_spending_by_category(num_cycles=num_cycles)


@router.get("/cycle-trend")
async def cycle_trend(num_cycles: int = 6):
    return await queries.get_cycle_trend(num_cycles=num_cycles)


@router.get("/categories")
async def list_categories():
    return await queries.get_categories()


@router.get("/insights")
async def insights_data():
    """Aggregated data for the insights section — averages, trends, comparisons."""
    return await queries.get_insights_section_data()


@router.get("/cycle-summaries")
async def list_cycle_summaries():
    """All compressed cycle summaries."""
    return await queries.get_all_cycle_summaries()


# --- Exchange Rate ---

_fx_cache: dict = {"rate": None, "updated_at": 0}
_FX_TTL = 3600  # 1 hour cache


@router.get("/exchange-rate")
async def exchange_rate():
    """USD/JPY exchange rate from ECB via frankfurter.app, cached 1 hour."""
    now = time.time()

    if _fx_cache["rate"] and (now - _fx_cache["updated_at"]) < _FX_TTL:
        return _fx_cache["rate"]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://api.frankfurter.app/latest?from=USD&to=JPY")
            resp.raise_for_status()
            data = resp.json()
            usd_to_jpy = data["rates"]["JPY"]
            result = {
                "usd_to_jpy": usd_to_jpy,
                "jpy_to_usd": round(1 / usd_to_jpy, 6),
                "source": "ECB via frankfurter.app",
                "date": data.get("date"),
            }
            _fx_cache["rate"] = result
            _fx_cache["updated_at"] = now
            return result
    except Exception as e:
        logger.warning(f"Exchange rate fetch failed: {e}")
        if _fx_cache["rate"]:
            return _fx_cache["rate"]
        raise HTTPException(503, "Exchange rate unavailable")


# --- Health ---

@router.get("/health")
async def health():
    return {"agent": "finance", "status": "ok"}
