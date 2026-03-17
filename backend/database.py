import aiosqlite
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DB_PATH = PROJECT_ROOT / "data" / "lifeboard.db"

# Ensure data directory exists
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


async def get_db() -> aiosqlite.Connection:
    """Get a database connection. Caller is responsible for closing."""
    db = await aiosqlite.connect(str(DB_PATH))
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """Create all tables for active agents."""
    db = await get_db()
    try:
        await _create_finance_tables(db)
        await _create_life_manager_tables(db)
        await db.commit()
    finally:
        await db.close()


async def _create_finance_tables(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS finance_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            account_type TEXT NOT NULL CHECK(account_type IN ('bank', 'wallet', 'investment', 'cash', 'transfer_service')),
            currency TEXT NOT NULL CHECK(currency IN ('JPY', 'USD')),
            current_balance INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            notes TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS finance_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            amount INTEGER NOT NULL,
            account_id INTEGER NOT NULL REFERENCES finance_accounts(id),
            category TEXT NOT NULL,
            description TEXT,
            is_recurring INTEGER NOT NULL DEFAULT 0,
            recurring_id INTEGER REFERENCES finance_recurring(id),
            is_auto INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS finance_transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            from_account_id INTEGER NOT NULL REFERENCES finance_accounts(id),
            to_account_id INTEGER NOT NULL REFERENCES finance_accounts(id),
            from_amount INTEGER NOT NULL,
            to_amount INTEGER NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS finance_recurring (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount INTEGER NOT NULL,
            account_id INTEGER NOT NULL REFERENCES finance_accounts(id),
            category TEXT NOT NULL,
            frequency TEXT NOT NULL CHECK(frequency IN ('monthly', 'weekly', 'yearly')),
            next_due TEXT NOT NULL,
            is_autopay INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS finance_budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL UNIQUE,
            monthly_limit INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS finance_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            mime_type TEXT,
            file_size INTEGER,
            linked_transaction_id INTEGER REFERENCES finance_transactions(id),
            description TEXT,
            extracted_data TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );
    """)


async def _create_life_manager_tables(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS life_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT,
            category TEXT NOT NULL CHECK(category IN ('appointment', 'deadline', 'reminder', 'social', 'errand')),
            description TEXT,
            is_recurring INTEGER NOT NULL DEFAULT 0,
            recurring_rule TEXT,
            is_completed INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS life_bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount INTEGER,
            due_date TEXT NOT NULL,
            next_due TEXT NOT NULL,
            frequency TEXT NOT NULL CHECK(frequency IN ('monthly', 'quarterly', 'yearly', 'one-time')),
            category TEXT NOT NULL CHECK(category IN ('rent', 'utilities', 'insurance', 'subscription', 'tax', 'other')),
            is_autopay INTEGER NOT NULL DEFAULT 0,
            is_paid INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS life_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
            due_date TEXT,
            category TEXT NOT NULL DEFAULT 'other' CHECK(category IN ('errand', 'admin', 'home', 'communication', 'other')),
            is_completed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS life_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('housing', 'insurance', 'legal', 'medical', 'financial', 'other')),
            expiry_date TEXT,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS life_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            mime_type TEXT,
            file_size INTEGER,
            linked_document_id INTEGER REFERENCES life_documents(id),
            linked_bill_id INTEGER REFERENCES life_bills(id),
            linked_task_id INTEGER REFERENCES life_tasks(id),
            description TEXT,
            extracted_data TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );
    """)
