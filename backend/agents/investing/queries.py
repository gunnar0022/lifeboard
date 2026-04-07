"""
Investing agent — SQL query functions.
Raw SQL with aiosqlite (no ORM per LM-01).
All amounts stored as integers (smallest currency unit per LM-06).
Portfolio snapshots are NEVER compressed (LM-33).
avg_cost_per_share uses weighted average (LM-34).
"""
import json
import logging
import time
from datetime import date, datetime, timedelta
from backend.database import get_db
from backend.config import get_config, get_today

logger = logging.getLogger("lifeboard")

# --- FX rate cache for portfolio aggregation ---
_fx_cache: dict = {"rates": None, "updated_at": 0}
_FX_TTL = 3600  # 1 hour


async def _get_fx_rates_to_primary() -> dict[str, float]:
    """
    Get cached FX rates that convert each currency's smallest unit to JPY.
    Returns {currency: multiplier} where multiplier converts smallest-unit to JPY.
    USD is stored in cents (LM-06), so rate = usd_to_jpy / 100.
    """
    now = time.time()
    if _fx_cache["rates"] and (now - _fx_cache["updated_at"]) < _FX_TTL:
        return _fx_cache["rates"]

    config = get_config()
    primary = config.get("primary_currency", "JPY")
    rates = {primary: 1.0}

    try:
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://api.frankfurter.app/latest?from=USD&to=JPY")
            resp.raise_for_status()
            data = resp.json()
            usd_to_jpy = data["rates"]["JPY"]
            # USD stored in cents; 1 cent = usd_to_jpy/100 yen
            rates["USD"] = usd_to_jpy / 100
    except Exception as e:
        logger.warning(f"FX rate fetch failed in queries: {e}")
        # Fallback estimate
        rates["USD"] = 1.50

    _fx_cache["rates"] = rates
    _fx_cache["updated_at"] = now
    return rates


# --- Holdings ---

async def get_holdings() -> list[dict]:
    """Return all holdings with computed market value and gain/loss."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT h.*,
                      GROUP_CONCAT(ha.account_id) as account_ids
               FROM investing_holdings h
               LEFT JOIN investing_holding_accounts ha ON h.id = ha.holding_id
               WHERE h.total_shares > 0
               GROUP BY h.id
               ORDER BY h.asset_class, h.symbol"""
        )
        rows = await cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            # Computed fields
            market_value = int(d["total_shares"] * d["current_price"])
            cost_basis = int(d["total_shares"] * d["avg_cost_per_share"])
            gain_loss = market_value - cost_basis
            gain_loss_pct = round((gain_loss / cost_basis) * 100, 2) if cost_basis > 0 else 0
            d["market_value"] = market_value
            d["cost_basis"] = cost_basis
            d["gain_loss"] = gain_loss
            d["gain_loss_pct"] = gain_loss_pct
            # Parse account_ids
            d["account_ids"] = [int(x) for x in d["account_ids"].split(",")] if d["account_ids"] else []
            result.append(d)
        return result
    finally:
        await db.close()


async def get_holding(holding_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM investing_holdings WHERE id = ?", (holding_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        market_value = int(d["total_shares"] * d["current_price"])
        cost_basis = int(d["total_shares"] * d["avg_cost_per_share"])
        d["market_value"] = market_value
        d["cost_basis"] = cost_basis
        d["gain_loss"] = market_value - cost_basis
        d["gain_loss_pct"] = round(((market_value - cost_basis) / cost_basis) * 100, 2) if cost_basis > 0 else 0
        return d
    finally:
        await db.close()


async def add_holding(symbol: str, name: str, asset_class: str,
                      currency: str = None, notes: str = None) -> dict:
    if currency is None:
        config = get_config()
        currency = config.get("primary_currency", "JPY")
    symbol = symbol.upper()
    db = await get_db()
    try:
        # Check if a holding with this symbol already exists
        cursor = await db.execute(
            "SELECT id FROM investing_holdings WHERE UPPER(symbol) = ? AND currency = ?",
            (symbol, currency)
        )
        existing = await cursor.fetchone()
        if existing:
            return await get_holding(existing["id"])

        cursor = await db.execute(
            """INSERT INTO investing_holdings (symbol, name, asset_class, currency, notes)
               VALUES (?, ?, ?, ?, ?)""",
            (symbol, name, asset_class, currency, notes)
        )
        await db.commit()
        return await get_holding(cursor.lastrowid)
    finally:
        await db.close()


async def edit_holding(holding_id: int, **fields) -> dict | None:
    allowed = {"symbol", "name", "asset_class", "currency", "notes"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return await get_holding(holding_id)

    db = await get_db()
    try:
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [holding_id]
        await db.execute(
            f"UPDATE investing_holdings SET {set_clause}, updated_at = strftime('%Y-%m-%dT%H:%M:%S', 'now') WHERE id = ?",
            values
        )
        await db.commit()
        return await get_holding(holding_id)
    finally:
        await db.close()


async def remove_holding(holding_id: int) -> bool:
    """Remove a holding (set shares to 0, effectively deactivating it)."""
    db = await get_db()
    try:
        await db.execute(
            "UPDATE investing_holdings SET total_shares = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%S', 'now') WHERE id = ?",
            (holding_id,)
        )
        await db.commit()
        return True
    finally:
        await db.close()


# --- Transactions (LM-34: weighted average cost basis) ---

async def record_transaction(holding_id: int, tx_type: str, shares: float,
                              price_per_share: int, total_amount: int,
                              currency: str = None, date_str: str = None,
                              notes: str = None) -> dict:
    """
    Record a transaction and recalculate avg_cost_per_share.
    LM-34: BUY uses weighted average. SELL keeps avg unchanged. SPLIT adjusts both.
    """
    if date_str is None:
        date_str = get_today().isoformat()
    if currency is None:
        config = get_config()
        currency = config.get("primary_currency", "JPY")

    db = await get_db()
    try:
        await db.execute("BEGIN")

        # Get current holding state
        cursor = await db.execute(
            "SELECT total_shares, avg_cost_per_share FROM investing_holdings WHERE id = ?",
            (holding_id,)
        )
        row = await cursor.fetchone()
        if not row:
            await db.execute("ROLLBACK")
            raise ValueError(f"Holding {holding_id} not found")

        old_shares = row["total_shares"]
        old_avg = row["avg_cost_per_share"]

        # Calculate new values based on transaction type
        if tx_type == "buy":
            new_shares = old_shares + shares
            if new_shares > 0:
                new_avg = int(((old_shares * old_avg) + (shares * price_per_share)) / new_shares)
            else:
                new_avg = price_per_share
        elif tx_type == "sell":
            new_shares = old_shares - shares
            new_avg = old_avg  # Selling doesn't change cost basis
        elif tx_type == "dividend":
            new_shares = old_shares
            new_avg = old_avg  # Dividends don't change shares or avg cost
        elif tx_type == "split":
            # shares field represents the split ratio (e.g., 2.0 for a 2:1 split)
            split_ratio = shares
            new_shares = old_shares * split_ratio
            new_avg = int(old_avg / split_ratio) if split_ratio > 0 else old_avg
            shares = new_shares - old_shares  # Log the additional shares gained
        else:
            raise ValueError(f"Unknown transaction type: {tx_type}")

        # Insert transaction
        cursor = await db.execute(
            """INSERT INTO investing_transactions
               (holding_id, type, shares, price_per_share, total_amount, currency, date, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (holding_id, tx_type, shares, price_per_share, total_amount, currency, date_str, notes)
        )
        tx_id = cursor.lastrowid

        # Update holding
        await db.execute(
            """UPDATE investing_holdings
               SET total_shares = ?, avg_cost_per_share = ?,
                   updated_at = strftime('%Y-%m-%dT%H:%M:%S', 'now')
               WHERE id = ?""",
            (max(new_shares, 0), new_avg, holding_id)
        )

        await db.commit()

        cursor = await db.execute(
            "SELECT * FROM investing_transactions WHERE id = ?", (tx_id,)
        )
        return dict(await cursor.fetchone())
    except Exception:
        await db.execute("ROLLBACK")
        raise
    finally:
        await db.close()


async def get_transactions(holding_id: int = None, limit: int = 50) -> list[dict]:
    db = await get_db()
    try:
        conditions = []
        params = []

        if holding_id is not None:
            conditions.append("t.holding_id = ?")
            params.append(holding_id)

        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        params.append(limit)

        cursor = await db.execute(
            f"""SELECT t.*, h.symbol, h.name as holding_name
                FROM investing_transactions t
                JOIN investing_holdings h ON t.holding_id = h.id
                {where}
                ORDER BY t.date DESC, t.id DESC
                LIMIT ?""",
            params
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def get_recent_transactions(limit: int = 10) -> list[dict]:
    return await get_transactions(limit=limit)


async def _recalculate_holding(db, holding_id: int):
    """Replay all transactions for a holding to recompute total_shares and avg_cost_per_share."""
    cursor = await db.execute(
        "SELECT * FROM investing_transactions WHERE holding_id = ? ORDER BY date ASC, id ASC",
        (holding_id,)
    )
    txns = [dict(r) for r in await cursor.fetchall()]

    total_shares = 0.0
    avg_cost = 0

    for tx in txns:
        if tx["type"] == "buy":
            new_shares = total_shares + tx["shares"]
            if new_shares > 0:
                avg_cost = int(((total_shares * avg_cost) + (tx["shares"] * tx["price_per_share"])) / new_shares)
            else:
                avg_cost = tx["price_per_share"]
            total_shares = new_shares
        elif tx["type"] == "sell":
            total_shares -= tx["shares"]
        elif tx["type"] == "split":
            if total_shares > 0 and tx["shares"] > 0:
                old_shares = total_shares
                total_shares = old_shares + tx["shares"]
                split_ratio = total_shares / old_shares
                avg_cost = int(avg_cost / split_ratio) if split_ratio > 0 else avg_cost
        # dividend: no change to shares or avg cost

    await db.execute(
        """UPDATE investing_holdings
           SET total_shares = ?, avg_cost_per_share = ?,
               updated_at = strftime('%Y-%m-%dT%H:%M:%S', 'now')
           WHERE id = ?""",
        (max(total_shares, 0), avg_cost, holding_id)
    )


async def update_transaction(tx_id: int, **fields) -> dict | None:
    """Update a transaction and recalculate the holding's cost basis."""
    allowed = {"type", "shares", "price_per_share", "total_amount", "date", "notes"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return None

    db = await get_db()
    try:
        # Get holding_id before update
        cursor = await db.execute(
            "SELECT holding_id FROM investing_transactions WHERE id = ?", (tx_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        holding_id = row["holding_id"]

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [tx_id]
        await db.execute(
            f"UPDATE investing_transactions SET {set_clause} WHERE id = ?",
            values
        )

        await _recalculate_holding(db, holding_id)
        await db.commit()

        cursor = await db.execute(
            "SELECT * FROM investing_transactions WHERE id = ?", (tx_id,)
        )
        return dict(await cursor.fetchone())
    finally:
        await db.close()


async def delete_transaction(tx_id: int) -> bool:
    """Delete a transaction and recalculate the holding's cost basis."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT holding_id FROM investing_transactions WHERE id = ?", (tx_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return False
        holding_id = row["holding_id"]

        await db.execute("DELETE FROM investing_transactions WHERE id = ?", (tx_id,))
        await _recalculate_holding(db, holding_id)
        await db.commit()
        return True
    finally:
        await db.close()


# --- Accounts ---

async def get_accounts() -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM investing_accounts ORDER BY name"
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def add_account(name: str, account_type: str, currency: str = None,
                      notes: str = None) -> dict:
    if currency is None:
        config = get_config()
        currency = config.get("primary_currency", "JPY")
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO investing_accounts (name, type, currency, notes)
               VALUES (?, ?, ?, ?)""",
            (name, account_type, currency, notes)
        )
        await db.commit()
        acct_id = cursor.lastrowid
        cursor = await db.execute(
            "SELECT * FROM investing_accounts WHERE id = ?", (acct_id,)
        )
        return dict(await cursor.fetchone())
    finally:
        await db.close()


async def link_holding_account(holding_id: int, account_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute(
            "INSERT OR IGNORE INTO investing_holding_accounts (holding_id, account_id) VALUES (?, ?)",
            (holding_id, account_id)
        )
        await db.commit()
        return True
    finally:
        await db.close()


async def unlink_holding_account(holding_id: int, account_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute(
            "DELETE FROM investing_holding_accounts WHERE holding_id = ? AND account_id = ?",
            (holding_id, account_id)
        )
        await db.commit()
        return True
    finally:
        await db.close()


# --- Portfolio Snapshots (LM-33: NEVER compressed) ---

async def get_portfolio_snapshots(days: int = 365) -> list[dict]:
    db = await get_db()
    try:
        cutoff = (get_today() - timedelta(days=days)).isoformat()
        cursor = await db.execute(
            """SELECT * FROM investing_portfolio_snapshots
               WHERE date >= ?
               ORDER BY date ASC""",
            (cutoff,)
        )
        rows = await cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["breakdown"] = json.loads(d["breakdown"]) if d["breakdown"] else {}
            result.append(d)
        return result
    finally:
        await db.close()


async def store_portfolio_snapshot(date_str: str, total_value: int,
                                    currency: str, breakdown: dict) -> dict:
    """Store or replace a portfolio snapshot for a date. One per day (LM-33)."""
    db = await get_db()
    try:
        await db.execute(
            """INSERT OR REPLACE INTO investing_portfolio_snapshots
               (date, total_value, currency, breakdown)
               VALUES (?, ?, ?, ?)""",
            (date_str, total_value, currency, json.dumps(breakdown))
        )
        await db.commit()
        cursor = await db.execute(
            "SELECT * FROM investing_portfolio_snapshots WHERE date = ?", (date_str,)
        )
        row = await cursor.fetchone()
        d = dict(row)
        d["breakdown"] = json.loads(d["breakdown"])
        return d
    finally:
        await db.close()


async def get_latest_snapshot() -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM investing_portfolio_snapshots ORDER BY date DESC LIMIT 1"
        )
        row = await cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        d["breakdown"] = json.loads(d["breakdown"]) if d["breakdown"] else {}
        return d
    finally:
        await db.close()


# --- Aggregation ---

async def get_portfolio_summary() -> dict:
    """Return total value, cost basis, gain/loss, breakdown by asset class.

    All values are converted to the user's primary currency (JPY) using
    live FX rates, so USD-cent holdings are properly aggregated.
    """
    holdings = await get_holdings()
    if not holdings:
        return {
            "total_value": 0, "total_cost": 0, "gain_loss": 0,
            "gain_loss_pct": 0, "breakdown": {}, "holding_count": 0,
            "currency": "JPY",
        }

    config = get_config()
    primary = config.get("primary_currency", "JPY")
    fx_rates = await _get_fx_rates_to_primary()

    total_value = 0
    total_cost = 0
    breakdown = {}

    for h in holdings:
        rate = fx_rates.get(h["currency"], 1.0)
        mv = int(h["market_value"] * rate)
        cb = int(h["cost_basis"] * rate)

        total_value += mv
        total_cost += cb

        cls = h["asset_class"]
        if cls not in breakdown:
            breakdown[cls] = {"value": 0, "cost": 0, "count": 0}
        breakdown[cls]["value"] += mv
        breakdown[cls]["cost"] += cb
        breakdown[cls]["count"] += 1

    gain_loss = total_value - total_cost
    gain_loss_pct = round((gain_loss / total_cost) * 100, 2) if total_cost > 0 else 0

    return {
        "total_value": total_value,
        "total_cost": total_cost,
        "gain_loss": gain_loss,
        "gain_loss_pct": gain_loss_pct,
        "breakdown": breakdown,
        "holding_count": len(holdings),
        "currency": primary,
    }


# --- Price updates ---

async def update_holding_price(holding_id: int, new_price: int, timestamp: str) -> bool:
    db = await get_db()
    try:
        await db.execute(
            """UPDATE investing_holdings
               SET current_price = ?, last_price_update = ?,
                   updated_at = strftime('%Y-%m-%dT%H:%M:%S', 'now')
               WHERE id = ?""",
            (new_price, timestamp, holding_id)
        )
        await db.commit()
        return True
    finally:
        await db.close()


async def get_all_holdings_for_refresh() -> list[dict]:
    """Get all holdings including zero-share ones (for price tracking)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM investing_holdings WHERE total_shares > 0 ORDER BY id"
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def get_stale_holdings(days: int = 2) -> list[dict]:
    """Get holdings with stale price data (for nudges)."""
    db = await get_db()
    try:
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        cursor = await db.execute(
            """SELECT * FROM investing_holdings
               WHERE total_shares > 0
               AND (last_price_update IS NULL OR last_price_update < ?)
               ORDER BY symbol""",
            (cutoff,)
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()
