"""Investing agent — FastAPI routes."""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.agents.investing import queries
from backend.config import get_config, get_currency_symbol

logger = logging.getLogger("lifeboard")

router = APIRouter(prefix="/api/investing", tags=["investing"])


# --- Request models ---

class HoldingCreate(BaseModel):
    symbol: str
    name: str
    asset_class: str = "stock"
    currency: Optional[str] = None
    notes: Optional[str] = None

class HoldingUpdate(BaseModel):
    symbol: Optional[str] = None
    name: Optional[str] = None
    asset_class: Optional[str] = None
    currency: Optional[str] = None
    notes: Optional[str] = None

class TransactionCreate(BaseModel):
    holding_id: int
    type: str = "buy"
    shares: float = 0
    price_per_share: int = 0
    total_amount: int = 0
    currency: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None

class AccountCreate(BaseModel):
    name: str
    type: str = "brokerage"
    currency: Optional[str] = None
    notes: Optional[str] = None

class LinkAccount(BaseModel):
    holding_id: int
    account_id: int


# --- Pulse endpoint (Home panel) ---

@router.get("/pulse")
async def get_pulse():
    """Key metrics for the Home panel pulse card."""
    try:
        portfolio = await queries.get_portfolio_summary()
        symbol = get_currency_symbol()

        total_value = portfolio["total_value"]
        gain_loss = portfolio["gain_loss"]
        gain_pct = portfolio["gain_loss_pct"]
        sign = "+" if gain_loss >= 0 else ""

        return {
            "metrics": [
                {"label": "Portfolio", "value": f"{symbol}{total_value:,}"},
                {"label": "Total gain/loss", "value": f"{sign}{symbol}{gain_loss:,} ({sign}{gain_pct}%)"},
                {"label": "Holdings", "value": str(portfolio["holding_count"])},
            ]
        }
    except Exception:
        return {
            "metrics": [
                {"label": "Portfolio", "value": "-"},
                {"label": "Total gain/loss", "value": "-"},
                {"label": "Holdings", "value": "-"},
            ]
        }


# --- Holdings ---

@router.get("/holdings")
async def list_holdings():
    return await queries.get_holdings()


@router.get("/holdings/{holding_id}")
async def get_holding(holding_id: int):
    result = await queries.get_holding(holding_id)
    if not result:
        raise HTTPException(404, "Holding not found")
    return result


@router.post("/holdings")
async def create_holding(body: HoldingCreate):
    return await queries.add_holding(
        symbol=body.symbol, name=body.name,
        asset_class=body.asset_class, currency=body.currency,
        notes=body.notes,
    )


@router.put("/holdings/{holding_id}")
async def update_holding(holding_id: int, body: HoldingUpdate):
    result = await queries.edit_holding(holding_id, **body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(404, "Holding not found")
    return result


@router.delete("/holdings/{holding_id}")
async def delete_holding(holding_id: int):
    await queries.remove_holding(holding_id)
    return {"ok": True}


# --- Transactions ---

@router.get("/transactions")
async def list_transactions(
    holding_id: Optional[int] = None,
    limit: int = 50,
):
    return await queries.get_transactions(
        holding_id=holding_id, limit=limit,
    )


@router.post("/transactions")
async def create_transaction(body: TransactionCreate):
    return await queries.record_transaction(
        holding_id=body.holding_id, tx_type=body.type,
        shares=body.shares, price_per_share=body.price_per_share,
        total_amount=body.total_amount, currency=body.currency,
        date_str=body.date, notes=body.notes,
    )


# --- Accounts ---

@router.get("/accounts")
async def list_accounts():
    return await queries.get_accounts()


@router.post("/accounts")
async def create_account(body: AccountCreate):
    return await queries.add_account(
        name=body.name, account_type=body.type,
        currency=body.currency, notes=body.notes,
    )


@router.post("/link-account")
async def link_account(body: LinkAccount):
    await queries.link_holding_account(body.holding_id, body.account_id)
    return {"ok": True}


# --- Portfolio ---

@router.get("/portfolio")
async def portfolio_summary():
    return await queries.get_portfolio_summary()


@router.get("/snapshots")
async def portfolio_snapshots(days: int = 365):
    return await queries.get_portfolio_snapshots(days=days)


@router.get("/latest-snapshot")
async def latest_snapshot():
    result = await queries.get_latest_snapshot()
    if not result:
        return {"date": None, "total_value": 0, "currency": "JPY", "breakdown": {}}
    return result


# --- Health ---

@router.get("/health")
async def health():
    return {"agent": "investing", "status": "ok"}
