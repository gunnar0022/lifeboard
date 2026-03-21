"""
Investing agent — daily price refresh scheduler.
Uses yfinance to update current_price on holdings, then stores a portfolio snapshot.
LM-36: Exchange rates are cached once per refresh cycle, NOT per-holding.
LM-33: Portfolio snapshots are NEVER compressed.
"""
import asyncio
import json
import logging
from datetime import date, datetime
from zoneinfo import ZoneInfo

import httpx

from backend.config import get_config
from backend.agents.investing import queries

logger = logging.getLogger(__name__)

_price_refresh_task: asyncio.Task | None = None


async def start_scheduler():
    """Start the daily price refresh background task."""
    global _price_refresh_task
    _price_refresh_task = asyncio.create_task(_daily_price_refresh_loop())
    logger.info("Investing price refresh scheduler started")


async def stop_scheduler():
    """Stop the daily price refresh background task."""
    global _price_refresh_task
    if _price_refresh_task and not _price_refresh_task.done():
        _price_refresh_task.cancel()
        try:
            await _price_refresh_task
        except asyncio.CancelledError:
            pass
    _price_refresh_task = None
    logger.info("Investing scheduler stopped")


async def _daily_price_refresh_loop():
    """Run price refresh daily at 18:00 in user's timezone."""
    config = get_config()
    tz_name = config.get("timezone", "UTC")
    tz = ZoneInfo(tz_name)
    target_hour = 18
    target_minute = 0

    while True:
        try:
            now = datetime.now(tz)
            target = now.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
            if now >= target:
                # Already past target time today, schedule for tomorrow
                target = target.replace(day=target.day + 1)
                # Handle month rollover
                try:
                    target = target.replace(day=target.day)
                except ValueError:
                    # Month rollover — use timedelta
                    from datetime import timedelta
                    target = now.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0) + timedelta(days=1)

            wait_seconds = (target - now).total_seconds()
            logger.info(f"Next price refresh in {wait_seconds/3600:.1f}h at {target}")
            await asyncio.sleep(wait_seconds)

            await run_price_refresh()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Price refresh loop error: {e}")
            # Wait 1 hour before retrying on error
            await asyncio.sleep(3600)


async def _fetch_exchange_rates(currencies: set[str], primary_currency: str) -> dict:
    """
    LM-36: Fetch exchange rates ONCE for all needed currencies.
    Returns dict like {"USD": 150.5, "JPY": 1.0} (rates to primary_currency).
    """
    rates = {primary_currency: 1.0}

    needed = currencies - {primary_currency}
    if not needed:
        return rates

    try:
        # Fetch rates from frankfurter.app
        from_currencies = ",".join(sorted(needed))
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://api.frankfurter.app/latest?from={primary_currency}&to={from_currencies}"
            )
            resp.raise_for_status()
            data = resp.json()
            # data["rates"] gives {currency: rate_from_primary}
            # We need rate TO primary, so invert
            for cur, rate in data.get("rates", {}).items():
                if rate > 0:
                    rates[cur] = 1.0 / rate  # How many primary per 1 foreign
    except Exception as e:
        logger.warning(f"Exchange rate fetch failed: {e}")
        # Fallback: assume 1:1 if we can't get rates
        for cur in needed:
            rates[cur] = 1.0

    return rates


def _fetch_prices_sync(symbols: list[str]) -> dict[str, float | None]:
    """
    Synchronous yfinance price fetch (called via asyncio.to_thread).
    Returns {symbol: price_float} or {symbol: None} on failure.
    """
    import yfinance as yf
    results = {}

    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.fast_info
            price = None
            # Try different price fields
            for field in ["lastPrice", "last_price", "previousClose", "previous_close"]:
                val = getattr(info, field, None)
                if val is not None and val > 0:
                    price = float(val)
                    break
            results[symbol] = price
        except Exception as e:
            logger.warning(f"yfinance fetch failed for {symbol}: {e}")
            results[symbol] = None

    return results


def _price_to_smallest_unit(price: float, currency: str) -> int:
    """Convert a float price to integer in smallest currency unit (LM-06)."""
    if currency == "JPY":
        return round(price)  # JPY: 1 unit = 1 yen
    else:
        return round(price * 100)  # USD/etc: 1 unit = 1 cent


async def refresh_single_holding_price(holding_id: int) -> int | None:
    """
    Fetch the current price for a single holding and update the DB.
    Called immediately after adding a holding or recording a buy.
    Returns the updated price (in smallest unit) or None on failure.
    """
    db_holding = None
    try:
        from backend.database import get_db
        db = await get_db()
        try:
            cursor = await db.execute(
                "SELECT symbol, currency FROM investing_holdings WHERE id = ?",
                (holding_id,),
            )
            db_holding = await cursor.fetchone()
        finally:
            await db.close()

        if not db_holding:
            return None

        symbol = db_holding["symbol"]
        currency = db_holding["currency"]

        prices = await asyncio.to_thread(_fetch_prices_sync, [symbol])
        raw_price = prices.get(symbol)

        if raw_price is None:
            logger.warning(f"No price data for {symbol} during immediate refresh")
            return None

        price_int = _price_to_smallest_unit(raw_price, currency)
        now_iso = datetime.now().isoformat()
        await queries.update_holding_price(holding_id, price_int, now_iso)
        logger.info(f"Immediate price refresh: {symbol} = {raw_price} ({currency})")
        return price_int

    except Exception as e:
        logger.error(f"Immediate price refresh failed for holding {holding_id}: {e}")
        return None


async def run_price_refresh():
    """
    Fetch latest prices for all holdings, update DB, store portfolio snapshot.
    Called daily by scheduler or manually.
    """
    logger.info("Starting price refresh...")

    holdings = await queries.get_all_holdings_for_refresh()
    if not holdings:
        logger.info("No holdings to refresh")
        return

    config = get_config()
    primary_currency = config.get("primary_currency", "JPY")

    # LM-36: Cache exchange rates once
    currencies = {h["currency"] for h in holdings}
    fx_rates = await _fetch_exchange_rates(currencies, primary_currency)
    logger.info(f"Exchange rates cached: {fx_rates}")

    # Fetch prices in thread pool (yfinance is synchronous)
    symbols = [h["symbol"] for h in holdings]
    prices = await asyncio.to_thread(_fetch_prices_sync, symbols)

    now_iso = datetime.now().isoformat()
    updated_count = 0

    for h in holdings:
        symbol = h["symbol"]
        raw_price = prices.get(symbol)
        if raw_price is None:
            logger.warning(f"Skipping {symbol}: no price data")
            continue

        price_int = _price_to_smallest_unit(raw_price, h["currency"])
        await queries.update_holding_price(h["id"], price_int, now_iso)
        updated_count += 1

    logger.info(f"Updated prices for {updated_count}/{len(holdings)} holdings")

    # Build and store portfolio snapshot
    refreshed_holdings = await queries.get_holdings()
    if not refreshed_holdings:
        return

    total_value = 0
    breakdown = {}

    for h in refreshed_holdings:
        market_value = h["market_value"]
        # Convert to primary currency
        # fx_rates gives "how many primary per 1 foreign unit" but market_value
        # is in smallest unit (cents for USD per LM-06). Divide by 100 for USD.
        rate = fx_rates.get(h["currency"], 1.0)
        if h["currency"] != primary_currency and h["currency"] in ("USD", "EUR", "GBP"):
            rate = rate / 100  # convert from cents to whole units before FX
        converted_value = int(market_value * rate)
        total_value += converted_value

        cls = h["asset_class"]
        breakdown[cls] = breakdown.get(cls, 0) + converted_value

    today_str = date.today().isoformat()
    await queries.store_portfolio_snapshot(today_str, total_value, primary_currency, breakdown)
    logger.info(f"Portfolio snapshot stored: {primary_currency} {total_value:,} on {today_str}")
