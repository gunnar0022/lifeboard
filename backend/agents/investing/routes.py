"""Investing agent — FastAPI routes."""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
from backend.agents.investing import queries
from backend.config import get_config, get_currency_symbol

logger = logging.getLogger("lifeboard")

router = APIRouter(prefix="/api/investing", tags=["investing"])


# --- Request models ---

VALID_ASSET_CLASSES = {"stock", "etf", "crypto", "bond", "other"}

class HoldingCreate(BaseModel):
    symbol: str
    name: str
    asset_class: str = "stock"
    currency: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('symbol')
    @classmethod
    def symbol_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Symbol cannot be empty')
        return v.strip().upper()

    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

    @field_validator('asset_class')
    @classmethod
    def valid_asset_class(cls, v):
        if v not in VALID_ASSET_CLASSES:
            raise ValueError(f'Asset class must be one of: {", ".join(VALID_ASSET_CLASSES)}')
        return v

class HoldingUpdate(BaseModel):
    symbol: Optional[str] = None
    name: Optional[str] = None
    asset_class: Optional[str] = None
    currency: Optional[str] = None
    notes: Optional[str] = None

VALID_TX_TYPES = {"buy", "sell", "dividend", "split"}

class TransactionCreate(BaseModel):
    holding_id: int
    type: str = "buy"
    shares: float = 0
    price_per_share: int = 0
    total_amount: int = 0
    currency: Optional[str] = None
    date: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('type')
    @classmethod
    def valid_type(cls, v):
        if v not in VALID_TX_TYPES:
            raise ValueError(f'Type must be one of: {", ".join(VALID_TX_TYPES)}')
        return v

    @field_validator('shares')
    @classmethod
    def shares_non_negative(cls, v):
        if v < 0:
            raise ValueError('Shares cannot be negative')
        return v

    @field_validator('price_per_share')
    @classmethod
    def price_non_negative(cls, v):
        if v < 0:
            raise ValueError('Price cannot be negative')
        return v

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    shares: Optional[float] = None
    price_per_share: Optional[int] = None
    total_amount: Optional[int] = None
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
    from backend.agents.investing.scheduler import refresh_single_holding_price
    result = await queries.add_holding(
        symbol=body.symbol, name=body.name,
        asset_class=body.asset_class, currency=body.currency,
        notes=body.notes,
    )
    if result and result.get("id"):
        try:
            await refresh_single_holding_price(result["id"])
        except Exception as e:
            logger.warning(f"Price refresh after holding create failed: {e}")
    return result


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
    from backend.agents.investing.scheduler import refresh_single_holding_price
    result = await queries.record_transaction(
        holding_id=body.holding_id, tx_type=body.type,
        shares=body.shares, price_per_share=body.price_per_share,
        total_amount=body.total_amount, currency=body.currency,
        date_str=body.date, notes=body.notes,
    )
    try:
        await refresh_single_holding_price(body.holding_id)
    except Exception as e:
        logger.warning(f"Price refresh after transaction failed: {e}")
    return result


@router.put("/transactions/{tx_id}")
async def update_transaction(tx_id: int, body: TransactionUpdate):
    result = await queries.update_transaction(tx_id, **body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(404, "Transaction not found")
    return result


@router.delete("/transactions/{tx_id}")
async def delete_transaction(tx_id: int):
    success = await queries.delete_transaction(tx_id)
    if not success:
        raise HTTPException(404, "Transaction not found")
    return {"ok": True}


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


# --- Price Refresh ---

@router.post("/refresh-prices")
async def refresh_prices():
    """Manually trigger a price refresh for all holdings."""
    from backend.agents.investing.scheduler import run_price_refresh
    try:
        await run_price_refresh()
        return {"ok": True}
    except Exception as e:
        logger.error(f"Price refresh error: {e}")
        raise HTTPException(500, f"Price refresh failed: {e}")


# --- Health ---

@router.get("/health")
async def health():
    return {"agent": "investing", "status": "ok"}
