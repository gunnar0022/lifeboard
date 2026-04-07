"""
Finance agent — SQL query functions.
Raw SQL with aiosqlite (no ORM per LM-01).
All amounts stored as integers (smallest currency unit per LM-06).
"""
import json
from datetime import date, datetime, timedelta
from backend.database import get_db
from backend.config import get_config, get_today


def _get_cycle_dates(reference_date: date = None, offset: int = 0) -> tuple[date, date]:
    """
    Return (cycle_start, cycle_end) for the pay cycle containing reference_date.
    Cycle runs from pay_cycle_day of one month to pay_cycle_day-1 of next month.
    offset: 0 = current cycle, -1 = previous, etc.
    """
    config = get_config()
    pay_day = config.get("pay_cycle_day", 1)
    ref = reference_date or get_today()

    # Determine which cycle we're in
    if ref.day >= pay_day:
        cycle_start = ref.replace(day=pay_day)
    else:
        # We're before pay day, so cycle started last month
        first_of_month = ref.replace(day=1)
        prev_month = first_of_month - timedelta(days=1)
        cycle_start = prev_month.replace(day=pay_day)

    # Apply offset
    for _ in range(abs(offset)):
        if offset < 0:
            first_of_month = cycle_start.replace(day=1)
            prev_month = first_of_month - timedelta(days=1)
            cycle_start = prev_month.replace(day=pay_day)
        else:
            # Move forward one month
            if cycle_start.month == 12:
                cycle_start = cycle_start.replace(year=cycle_start.year + 1, month=1)
            else:
                cycle_start = cycle_start.replace(month=cycle_start.month + 1)

    # Cycle end = day before next cycle start
    if cycle_start.month == 12:
        next_cycle = cycle_start.replace(year=cycle_start.year + 1, month=1)
    else:
        next_cycle = cycle_start.replace(month=cycle_start.month + 1)
    cycle_end = next_cycle - timedelta(days=1)

    return cycle_start, cycle_end


def get_cycle_day_info(reference_date: date = None) -> dict:
    """Return current cycle day number, total days, and days until payday."""
    ref = reference_date or get_today()
    cycle_start, cycle_end = _get_cycle_dates(ref)
    total_days = (cycle_end - cycle_start).days + 1
    current_day = (ref - cycle_start).days + 1
    days_to_payday = (cycle_end - ref).days + 1
    return {
        "cycle_start": cycle_start.isoformat(),
        "cycle_end": cycle_end.isoformat(),
        "current_day": current_day,
        "total_days": total_days,
        "days_to_payday": days_to_payday,
    }


# --- Accounts ---

async def get_accounts(active_only: bool = True) -> list[dict]:
    db = await get_db()
    try:
        where = "WHERE is_active = 1" if active_only else ""
        cursor = await db.execute(
            f"SELECT * FROM finance_accounts {where} ORDER BY sort_order, id"
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_account(account_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM finance_accounts WHERE id = ?", (account_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def add_account(name: str, currency: str, account_type: str,
                      initial_balance: int = 0, notes: str = None) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM finance_accounts"
        )
        next_order = (await cursor.fetchone())[0]

        cursor = await db.execute(
            """INSERT INTO finance_accounts (name, currency, account_type, current_balance, notes, sort_order)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (name, currency, account_type, initial_balance, notes, next_order)
        )
        await db.commit()
        return await get_account(cursor.lastrowid)
    finally:
        await db.close()


async def edit_account(account_id: int, **fields) -> dict | None:
    allowed = {"name", "currency", "account_type", "current_balance", "interest_rate", "notes", "sort_order", "is_active"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return await get_account(account_id)

    db = await get_db()
    try:
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [account_id]
        await db.execute(
            f"UPDATE finance_accounts SET {set_clause} WHERE id = ?", values
        )
        await db.commit()
        return await get_account(account_id)
    finally:
        await db.close()


async def deactivate_account(account_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute(
            "UPDATE finance_accounts SET is_active = 0 WHERE id = ?", (account_id,)
        )
        await db.commit()
        return True
    finally:
        await db.close()


async def set_interest_rate(account_id: int, interest_rate: float | None) -> dict | None:
    """Set or clear the annual interest rate for an account (as decimal, e.g. 0.045 = 4.5%)."""
    db = await get_db()
    try:
        await db.execute(
            "UPDATE finance_accounts SET interest_rate = ? WHERE id = ?",
            (interest_rate, account_id)
        )
        await db.commit()
        return await get_account(account_id)
    finally:
        await db.close()


async def get_interest_bearing_accounts() -> list[dict]:
    """Get all active accounts with a non-null interest rate."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM finance_accounts WHERE is_active = 1 AND interest_rate IS NOT NULL ORDER BY id"
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


# --- Transactions ---

async def log_transaction(amount: int, account_id: int, category: str,
                          description: str = None, date_str: str = None,
                          is_recurring: bool = False, recurring_id: int = None,
                          is_auto: bool = False) -> dict:
    """
    Log a transaction and update account balance atomically (LM-17).
    amount: positive = income, negative = expense.
    """
    if date_str is None:
        date_str = get_today().isoformat()

    db = await get_db()
    try:
        await db.execute("BEGIN")
        cursor = await db.execute(
            """INSERT INTO finance_transactions
               (date, amount, account_id, category, description, is_recurring, recurring_id, is_auto)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (date_str, amount, account_id, category, description,
             int(is_recurring), recurring_id, int(is_auto))
        )
        tx_id = cursor.lastrowid
        await db.execute(
            "UPDATE finance_accounts SET current_balance = current_balance + ? WHERE id = ?",
            (amount, account_id)
        )
        await db.commit()

        cursor = await db.execute(
            "SELECT * FROM finance_transactions WHERE id = ?", (tx_id,)
        )
        return dict(await cursor.fetchone())
    except Exception:
        await db.execute("ROLLBACK")
        raise
    finally:
        await db.close()


async def edit_transaction(transaction_id: int, **fields) -> dict | None:
    allowed = {"date", "amount", "account_id", "category", "description"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return await get_transaction(transaction_id)

    db = await get_db()
    try:
        # If amount changed, adjust account balance
        if "amount" in updates:
            cursor = await db.execute(
                "SELECT amount, account_id FROM finance_transactions WHERE id = ?",
                (transaction_id,)
            )
            old = await cursor.fetchone()
            if old:
                old_amount, old_account_id = old["amount"], old["account_id"]
                new_amount = updates["amount"]
                new_account_id = updates.get("account_id", old_account_id)

                await db.execute("BEGIN")
                # Reverse old amount from old account
                await db.execute(
                    "UPDATE finance_accounts SET current_balance = current_balance - ? WHERE id = ?",
                    (old_amount, old_account_id)
                )
                # Apply new amount to new account
                await db.execute(
                    "UPDATE finance_accounts SET current_balance = current_balance + ? WHERE id = ?",
                    (new_amount, new_account_id)
                )

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [transaction_id]
        await db.execute(
            f"UPDATE finance_transactions SET {set_clause} WHERE id = ?", values
        )
        await db.commit()

        cursor = await db.execute(
            "SELECT * FROM finance_transactions WHERE id = ?", (transaction_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    except Exception:
        await db.execute("ROLLBACK")
        raise
    finally:
        await db.close()


async def delete_transaction(transaction_id: int) -> bool:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT amount, account_id FROM finance_transactions WHERE id = ?",
            (transaction_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return False

        await db.execute("BEGIN")
        await db.execute(
            "UPDATE finance_accounts SET current_balance = current_balance - ? WHERE id = ?",
            (row["amount"], row["account_id"])
        )
        await db.execute(
            "DELETE FROM finance_transactions WHERE id = ?", (transaction_id,)
        )
        await db.commit()
        return True
    except Exception:
        await db.execute("ROLLBACK")
        raise
    finally:
        await db.close()


async def get_transaction(transaction_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM finance_transactions WHERE id = ?", (transaction_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def get_transactions(account_id: int = None, category: str = None,
                           date_from: str = None, date_to: str = None,
                           search: str = None, limit: int = 50,
                           offset: int = 0) -> list[dict]:
    db = await get_db()
    try:
        conditions = []
        params = []

        if account_id is not None:
            conditions.append("t.account_id = ?")
            params.append(account_id)
        if category:
            conditions.append("t.category = ?")
            params.append(category)
        if date_from:
            conditions.append("t.date >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("t.date <= ?")
            params.append(date_to)
        if search:
            conditions.append("(t.description LIKE ? OR t.category LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%"])

        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        params.extend([limit, offset])

        cursor = await db.execute(
            f"""SELECT t.*, a.name as account_name, a.currency as account_currency
                FROM finance_transactions t
                JOIN finance_accounts a ON t.account_id = a.id
                {where}
                ORDER BY t.date DESC, t.id DESC
                LIMIT ? OFFSET ?""",
            params
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


# --- Transfers ---

async def log_transfer(from_account_id: int, to_account_id: int,
                        from_amount: int, to_amount: int = None,
                        description: str = None, date_str: str = None) -> dict:
    """Log a transfer and update both account balances atomically (LM-17)."""
    if date_str is None:
        date_str = get_today().isoformat()
    if to_amount is None:
        to_amount = from_amount

    db = await get_db()
    try:
        await db.execute("BEGIN")
        cursor = await db.execute(
            """INSERT INTO finance_transfers
               (date, from_account_id, to_account_id, from_amount, to_amount, description)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (date_str, from_account_id, to_account_id, from_amount, to_amount, description)
        )
        transfer_id = cursor.lastrowid

        await db.execute(
            "UPDATE finance_accounts SET current_balance = current_balance - ? WHERE id = ?",
            (from_amount, from_account_id)
        )
        await db.execute(
            "UPDATE finance_accounts SET current_balance = current_balance + ? WHERE id = ?",
            (to_amount, to_account_id)
        )
        await db.commit()

        cursor = await db.execute(
            "SELECT * FROM finance_transfers WHERE id = ?", (transfer_id,)
        )
        return dict(await cursor.fetchone())
    except Exception:
        await db.execute("ROLLBACK")
        raise
    finally:
        await db.close()


async def get_transfers(account_id: int = None, date_from: str = None,
                         date_to: str = None, limit: int = 50) -> list[dict]:
    db = await get_db()
    try:
        conditions = []
        params = []

        if account_id is not None:
            conditions.append("(t.from_account_id = ? OR t.to_account_id = ?)")
            params.extend([account_id, account_id])
        if date_from:
            conditions.append("t.date >= ?")
            params.append(date_from)
        if date_to:
            conditions.append("t.date <= ?")
            params.append(date_to)

        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        params.append(limit)

        cursor = await db.execute(
            f"""SELECT t.*,
                       fa.name as from_account_name, fa.currency as from_currency,
                       ta.name as to_account_name, ta.currency as to_currency
                FROM finance_transfers t
                JOIN finance_accounts fa ON t.from_account_id = fa.id
                JOIN finance_accounts ta ON t.to_account_id = ta.id
                {where}
                ORDER BY t.date DESC, t.id DESC
                LIMIT ?""",
            params
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


# --- Recurring ---

async def get_recurring(active_only: bool = True, autopay_only: bool = None) -> list[dict]:
    db = await get_db()
    try:
        conditions = []
        params = []

        if active_only:
            conditions.append("r.is_active = 1")
        if autopay_only is not None:
            conditions.append("r.is_autopay = ?")
            params.append(int(autopay_only))

        where = "WHERE " + " AND ".join(conditions) if conditions else ""

        cursor = await db.execute(
            f"""SELECT r.*, a.name as account_name, a.currency as account_currency
                FROM finance_recurring r
                JOIN finance_accounts a ON r.account_id = a.id
                {where}
                ORDER BY r.next_due ASC""",
            params
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def add_recurring(name: str, amount: int, account_id: int, category: str,
                         frequency: str, next_due: str, is_autopay: bool = False) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO finance_recurring
               (name, amount, account_id, category, frequency, next_due, is_autopay)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (name, amount, account_id, category, frequency, next_due, int(is_autopay))
        )
        await db.commit()
        rec_id = cursor.lastrowid
        cursor = await db.execute(
            "SELECT r.*, a.name as account_name FROM finance_recurring r JOIN finance_accounts a ON r.account_id = a.id WHERE r.id = ?",
            (rec_id,)
        )
        return dict(await cursor.fetchone())
    finally:
        await db.close()


async def edit_recurring(recurring_id: int, **fields) -> dict | None:
    allowed = {"name", "amount", "account_id", "category", "frequency", "next_due", "is_autopay", "is_active"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return None

    db = await get_db()
    try:
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [recurring_id]
        await db.execute(
            f"UPDATE finance_recurring SET {set_clause} WHERE id = ?", values
        )
        await db.commit()
        cursor = await db.execute(
            "SELECT r.*, a.name as account_name FROM finance_recurring r JOIN finance_accounts a ON r.account_id = a.id WHERE r.id = ?",
            (recurring_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def deactivate_recurring(recurring_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute(
            "UPDATE finance_recurring SET is_active = 0 WHERE id = ?", (recurring_id,)
        )
        await db.commit()
        return True
    finally:
        await db.close()


async def advance_recurring_due(recurring_id: int, frequency: str, current_due: str):
    """Advance next_due to the next cycle date after processing."""
    from dateutil.relativedelta import relativedelta
    current = date.fromisoformat(current_due)
    if frequency == "monthly":
        next_date = current + relativedelta(months=1)
    elif frequency == "weekly":
        next_date = current + timedelta(weeks=1)
    elif frequency == "yearly":
        next_date = current + relativedelta(years=1)
    else:
        next_date = current + relativedelta(months=1)

    db = await get_db()
    try:
        await db.execute(
            "UPDATE finance_recurring SET next_due = ? WHERE id = ?",
            (next_date.isoformat(), recurring_id)
        )
        await db.commit()
    finally:
        await db.close()


# --- Budgets ---

async def get_budgets() -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM finance_budgets ORDER BY category")
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def set_budget(category: str, monthly_limit: int) -> dict:
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO finance_budgets (category, monthly_limit)
               VALUES (?, ?)
               ON CONFLICT(category) DO UPDATE SET monthly_limit = ?""",
            (category, monthly_limit, monthly_limit)
        )
        await db.commit()
        cursor = await db.execute(
            "SELECT * FROM finance_budgets WHERE category = ?", (category,)
        )
        return dict(await cursor.fetchone())
    finally:
        await db.close()


# --- Aggregate queries ---

async def get_cycle_summary(cycle_offset: int = 0) -> dict:
    """Full overview of a pay cycle — income, expenses, net, top categories.
    Falls back to compressed cycle summary if transactions have been deleted."""
    cycle_start, cycle_end = _get_cycle_dates(offset=cycle_offset)
    cs, ce = cycle_start.isoformat(), cycle_end.isoformat()

    # Check if this cycle has been compressed
    compressed = await get_cycle_summary_record(cs, ce)
    if compressed:
        by_category = [
            {"category": cat, "total": amt}
            for cat, amt in sorted(compressed["category_breakdown"].items(),
                                    key=lambda x: x[1], reverse=True)
        ]
        return {
            "cycle_start": cs,
            "cycle_end": ce,
            "income": compressed["total_income"],
            "expenses": compressed["total_expenses"],
            "net": compressed["net"],
            "by_category": by_category,
            "compressed": True,
        }

    # Live data
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT COALESCE(SUM(amount), 0)
               FROM finance_transactions
               WHERE date >= ? AND date <= ? AND amount > 0""",
            (cs, ce)
        )
        income = (await cursor.fetchone())[0]

        cursor = await db.execute(
            """SELECT COALESCE(SUM(amount), 0)
               FROM finance_transactions
               WHERE date >= ? AND date <= ? AND amount < 0""",
            (cs, ce)
        )
        expenses = (await cursor.fetchone())[0]

        cursor = await db.execute(
            """SELECT category, SUM(ABS(amount)) as total
               FROM finance_transactions
               WHERE date >= ? AND date <= ? AND amount < 0
               GROUP BY category
               ORDER BY total DESC""",
            (cs, ce)
        )
        by_category = [dict(r) for r in await cursor.fetchall()]

        return {
            "cycle_start": cs,
            "cycle_end": ce,
            "income": income,
            "expenses": abs(expenses),
            "net": income + expenses,
            "by_category": by_category,
        }
    finally:
        await db.close()


async def get_budget_status() -> dict:
    """Current cycle budget summary."""
    cycle_start, cycle_end = _get_cycle_dates()
    cycle_info = get_cycle_day_info()
    budgets = await get_budgets()

    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT category, SUM(ABS(amount)) as spent
               FROM finance_transactions
               WHERE date >= ? AND date <= ? AND amount < 0
               GROUP BY category""",
            (cycle_start.isoformat(), cycle_end.isoformat())
        )
        spending = {r["category"]: r["spent"] for r in await cursor.fetchall()}

        total_budget = sum(b["monthly_limit"] for b in budgets)
        total_spent = sum(spending.values())

        categories = []
        for b in budgets:
            cat = b["category"]
            spent = spending.get(cat, 0)
            categories.append({
                "category": cat,
                "budget": b["monthly_limit"],
                "spent": spent,
                "remaining": b["monthly_limit"] - spent,
                "percentage": round(spent / b["monthly_limit"] * 100) if b["monthly_limit"] > 0 else 0,
            })

        return {
            "cycle_start": cycle_info["cycle_start"],
            "cycle_end": cycle_info["cycle_end"],
            "current_day": cycle_info["current_day"],
            "total_days": cycle_info["total_days"],
            "days_to_payday": cycle_info["days_to_payday"],
            "total_budget": total_budget,
            "total_spent": total_spent,
            "total_remaining": total_budget - total_spent,
            "percentage": round(total_spent / total_budget * 100) if total_budget > 0 else 0,
            "categories": categories,
        }
    finally:
        await db.close()


async def get_spending_by_category(num_cycles: int = 1) -> list[dict]:
    """Spending breakdown by category for the current or past N cycles.
    Uses compressed summaries for older cycles."""
    results = []
    for offset in range(0, -num_cycles, -1):
        cycle_start, cycle_end = _get_cycle_dates(offset=offset)
        cs, ce = cycle_start.isoformat(), cycle_end.isoformat()

        # Check for compressed summary
        compressed = await get_cycle_summary_record(cs, ce)
        if compressed:
            rows = [
                {"category": cat, "total": amt, "count": 0}
                for cat, amt in sorted(compressed["category_breakdown"].items(),
                                        key=lambda x: x[1], reverse=True)
            ]
            results.append({
                "cycle_start": cs,
                "cycle_end": ce,
                "categories": rows,
            })
            continue

        # Live data
        db = await get_db()
        try:
            cursor = await db.execute(
                """SELECT category, SUM(ABS(amount)) as total, COUNT(*) as count
                   FROM finance_transactions
                   WHERE date >= ? AND date <= ? AND amount < 0
                   GROUP BY category
                   ORDER BY total DESC""",
                (cs, ce)
            )
            rows = [dict(r) for r in await cursor.fetchall()]
            results.append({
                "cycle_start": cs,
                "cycle_end": ce,
                "categories": rows,
            })
        finally:
            await db.close()
    return results


async def get_cycle_trend(num_cycles: int = 6) -> list[dict]:
    """Income vs expenses for the last N pay cycles (for bar chart).
    Uses compressed summaries for older cycles."""
    trend = []
    for offset in range(0, -num_cycles, -1):
        cycle_start, cycle_end = _get_cycle_dates(offset=offset)
        cs, ce = cycle_start.isoformat(), cycle_end.isoformat()

        # Check for compressed summary first
        compressed = await get_cycle_summary_record(cs, ce)
        if compressed:
            trend.append({
                "cycle_start": cs,
                "cycle_end": ce,
                "label": cycle_start.strftime("%b %d"),
                "income": compressed["total_income"],
                "expenses": compressed["total_expenses"],
            })
            continue

        # Live data
        db = await get_db()
        try:
            cursor = await db.execute(
                """SELECT
                     COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
                     COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expenses
                   FROM finance_transactions
                   WHERE date >= ? AND date <= ?""",
                (cs, ce)
            )
            row = await cursor.fetchone()
            trend.append({
                "cycle_start": cs,
                "cycle_end": ce,
                "label": cycle_start.strftime("%b %d"),
                "income": row["income"],
                "expenses": row["expenses"],
            })
        finally:
            await db.close()
    trend.reverse()
    return trend


async def get_accounts_overview() -> dict:
    """All active accounts grouped by currency with totals."""
    accounts = await get_accounts(active_only=True)
    by_currency = {}
    for acc in accounts:
        cur = acc["currency"]
        if cur not in by_currency:
            by_currency[cur] = {"currency": cur, "accounts": [], "total": 0}
        by_currency[cur]["accounts"].append(acc)
        by_currency[cur]["total"] += acc["current_balance"]

    return {
        "accounts": accounts,
        "by_currency": list(by_currency.values()),
    }


async def get_categories() -> list[str]:
    """Get all categories that exist in the transaction table (LM-20)."""
    defaults = [
        "Housing", "Food & Dining", "Transportation", "Utilities",
        "Social & Going Out", "Shopping", "Health", "Education",
        "Subscriptions", "Income", "Savings Transfer", "Other"
    ]
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT DISTINCT category FROM finance_transactions ORDER BY category"
        )
        db_cats = [r["category"] for r in await cursor.fetchall()]
        # Merge defaults with any custom categories from DB
        all_cats = list(dict.fromkeys(defaults + db_cats))
        return all_cats
    finally:
        await db.close()


# (Files removed — now in unified backend/documents.py)

# --- Cycle Summaries & Compression ---

async def get_cycle_summary_record(cycle_start: str, cycle_end: str) -> dict | None:
    """Get a compressed cycle summary if one exists."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM finance_cycle_summaries WHERE cycle_start = ? AND cycle_end = ?",
            (cycle_start, cycle_end)
        )
        row = await cursor.fetchone()
        if row:
            d = dict(row)
            d["category_breakdown"] = json.loads(d["category_breakdown"])
            d["budget_snapshot"] = json.loads(d["budget_snapshot"])
            d["insights"] = json.loads(d["insights"])
            return d
        return None
    finally:
        await db.close()


async def get_all_cycle_summaries() -> list[dict]:
    """Get all compressed cycle summaries, newest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM finance_cycle_summaries ORDER BY cycle_start DESC"
        )
        rows = await cursor.fetchall()
        result = []
        for row in rows:
            d = dict(row)
            d["category_breakdown"] = json.loads(d["category_breakdown"])
            d["budget_snapshot"] = json.loads(d["budget_snapshot"])
            d["insights"] = json.loads(d["insights"])
            result.append(d)
        return result
    finally:
        await db.close()


async def store_cycle_summary(cycle_start: str, cycle_end: str,
                               total_income: int, total_expenses: int,
                               net: int, transfer_volume: int,
                               transaction_count: int,
                               category_breakdown: dict,
                               budget_snapshot: dict,
                               insights: list[str]) -> dict:
    """Store a cycle summary (idempotent — won't duplicate)."""
    db = await get_db()
    try:
        # Check if already exists (LM-24: safe to re-run)
        cursor = await db.execute(
            "SELECT id FROM finance_cycle_summaries WHERE cycle_start = ? AND cycle_end = ?",
            (cycle_start, cycle_end)
        )
        if await cursor.fetchone():
            return await get_cycle_summary_record(cycle_start, cycle_end)

        cursor = await db.execute(
            """INSERT INTO finance_cycle_summaries
               (cycle_start, cycle_end, total_income, total_expenses, net,
                transfer_volume, transaction_count, category_breakdown,
                budget_snapshot, insights)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (cycle_start, cycle_end, total_income, total_expenses, net,
             transfer_volume, transaction_count,
             json.dumps(category_breakdown),
             json.dumps(budget_snapshot),
             json.dumps(insights))
        )
        await db.commit()
        return await get_cycle_summary_record(cycle_start, cycle_end)
    finally:
        await db.close()


async def aggregate_cycle_for_compression(cycle_start: str, cycle_end: str) -> dict:
    """
    Build full aggregation data for a cycle from live transactions.
    Returns everything needed to store a summary + generate insights.
    LM-26: This MUST be called BEFORE deleting transactions.
    """
    db = await get_db()
    try:
        # Income
        cursor = await db.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM finance_transactions WHERE date >= ? AND date <= ? AND amount > 0",
            (cycle_start, cycle_end)
        )
        total_income = (await cursor.fetchone())[0]

        # Expenses
        cursor = await db.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM finance_transactions WHERE date >= ? AND date <= ? AND amount < 0",
            (cycle_start, cycle_end)
        )
        total_expenses = abs((await cursor.fetchone())[0])

        # Transaction count
        cursor = await db.execute(
            "SELECT COUNT(*) FROM finance_transactions WHERE date >= ? AND date <= ?",
            (cycle_start, cycle_end)
        )
        transaction_count = (await cursor.fetchone())[0]

        # Category breakdown (expenses only)
        cursor = await db.execute(
            """SELECT category, SUM(ABS(amount)) as total
               FROM finance_transactions
               WHERE date >= ? AND date <= ? AND amount < 0
               GROUP BY category ORDER BY total DESC""",
            (cycle_start, cycle_end)
        )
        category_breakdown = {r["category"]: r["total"] for r in await cursor.fetchall()}

        # Transfer volume
        cursor = await db.execute(
            "SELECT COALESCE(SUM(from_amount), 0) FROM finance_transfers WHERE date >= ? AND date <= ?",
            (cycle_start, cycle_end)
        )
        transfer_volume = (await cursor.fetchone())[0]

        # Budget snapshot (LM-25: capture current budgets at compression time)
        cursor = await db.execute("SELECT category, monthly_limit FROM finance_budgets")
        budget_snapshot = {r["category"]: r["monthly_limit"] for r in await cursor.fetchall()}

        # Full transaction list for insight generation
        cursor = await db.execute(
            """SELECT t.date, t.amount, t.category, t.description, a.name as account_name
               FROM finance_transactions t
               JOIN finance_accounts a ON t.account_id = a.id
               WHERE t.date >= ? AND t.date <= ?
               ORDER BY t.date ASC""",
            (cycle_start, cycle_end)
        )
        transactions = [dict(r) for r in await cursor.fetchall()]

        return {
            "cycle_start": cycle_start,
            "cycle_end": cycle_end,
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net": total_income - total_expenses,
            "transfer_volume": transfer_volume,
            "transaction_count": transaction_count,
            "category_breakdown": category_breakdown,
            "budget_snapshot": budget_snapshot,
            "transactions": transactions,  # For insight generation, not stored
        }
    finally:
        await db.close()


async def delete_cycle_transactions(cycle_start: str, cycle_end: str):
    """
    Delete all transactions and transfers for a compressed cycle.
    Does NOT adjust account balances (those reflect cumulative history).
    Called only AFTER summary is stored (LM-26).
    """
    db = await get_db()
    try:
        await db.execute("BEGIN")
        await db.execute(
            "DELETE FROM finance_transactions WHERE date >= ? AND date <= ?",
            (cycle_start, cycle_end)
        )
        await db.execute(
            "DELETE FROM finance_transfers WHERE date >= ? AND date <= ?",
            (cycle_start, cycle_end)
        )
        await db.commit()
    except Exception:
        await db.execute("ROLLBACK")
        raise
    finally:
        await db.close()


async def get_historical_category_averages() -> dict:
    """Calculate average spending per category across all completed cycle summaries."""
    summaries = await get_all_cycle_summaries()
    if not summaries:
        return {}

    totals = {}
    for s in summaries:
        for cat, amount in s["category_breakdown"].items():
            totals[cat] = totals.get(cat, 0) + amount

    count = len(summaries)
    return {cat: round(total / count) for cat, total in totals.items()}


async def get_category_trend(num_cycles: int = 6) -> dict:
    """
    Get per-category spending for the last N completed cycles.
    Returns {category: [amount_cycle_1, amount_cycle_2, ...]} oldest first.
    """
    summaries = await get_all_cycle_summaries()
    # Take last N, reverse to oldest-first
    recent = summaries[:num_cycles]
    recent.reverse()

    all_cats = set()
    for s in recent:
        all_cats.update(s["category_breakdown"].keys())

    trends = {}
    for cat in sorted(all_cats):
        trends[cat] = [s["category_breakdown"].get(cat, 0) for s in recent]

    return trends


async def get_insights_section_data() -> dict:
    """
    Aggregate data for the frontend insights section:
    - Average spending pie chart data
    - Per-category sparkline trends
    - Current vs average comparison
    - Latest cycle insights
    """
    summaries = await get_all_cycle_summaries()

    if not summaries:
        return {"has_data": False}

    # Average spending per category
    averages = await get_historical_category_averages()

    # Category trends (last 6 cycles)
    trends = await get_category_trend(6)

    # Detect trending categories (3+ consecutive cycles same direction)
    trending = {}
    for cat, values in trends.items():
        if len(values) >= 3:
            last_3 = values[-3:]
            if all(last_3[i] < last_3[i+1] for i in range(2)):
                trending[cat] = "up"
            elif all(last_3[i] > last_3[i+1] for i in range(2)):
                trending[cat] = "down"
            else:
                trending[cat] = "flat"
        else:
            trending[cat] = "flat"

    # Current cycle spending vs averages
    current_summary = await get_cycle_summary(0)
    cycle_info = get_cycle_day_info()
    pace_factor = cycle_info["current_day"] / cycle_info["total_days"]

    comparisons = []
    for cat, avg in sorted(averages.items(), key=lambda x: x[1], reverse=True):
        current_spent = 0
        for by_cat in current_summary.get("by_category", []):
            if by_cat["category"] == cat:
                current_spent = by_cat["total"]
                break
        expected_at_pace = round(avg * pace_factor)
        pct = round(current_spent / expected_at_pace * 100) if expected_at_pace > 0 else 0
        comparisons.append({
            "category": cat,
            "current": current_spent,
            "average": avg,
            "expected_at_pace": expected_at_pace,
            "percentage": pct,
            "status": "under" if pct <= 100 else "over",
        })

    # Latest insights
    latest_insights = summaries[0]["insights"] if summaries else []
    latest_cycle_label = f"{summaries[0]['cycle_start']} to {summaries[0]['cycle_end']}" if summaries else ""

    return {
        "has_data": True,
        "completed_cycles": len(summaries),
        "averages": averages,
        "trends": trends,
        "trending": trending,
        "comparisons": comparisons,
        "latest_insights": latest_insights,
        "latest_cycle_label": latest_cycle_label,
    }
