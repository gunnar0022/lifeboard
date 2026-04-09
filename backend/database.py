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
        await _create_health_tables(db)
        await _create_investing_tables(db)
        await _create_fleet_tables(db)
        await _create_reading_creative_tables(db)
        await _create_dnd_tables(db)
        await _create_documents_table(db)
        await _create_projects_table(db)
        await _create_garmin_tables(db)
        await _create_system_tables(db)
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
            interest_rate REAL,
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

        CREATE TABLE IF NOT EXISTS finance_cycle_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cycle_start TEXT NOT NULL,
            cycle_end TEXT NOT NULL,
            total_income INTEGER NOT NULL DEFAULT 0,
            total_expenses INTEGER NOT NULL DEFAULT 0,
            net INTEGER NOT NULL DEFAULT 0,
            transfer_volume INTEGER NOT NULL DEFAULT 0,
            transaction_count INTEGER NOT NULL DEFAULT 0,
            category_breakdown TEXT NOT NULL DEFAULT '{}',
            budget_snapshot TEXT NOT NULL DEFAULT '{}',
            insights TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            UNIQUE(cycle_start, cycle_end)
        );
    """)


async def _create_health_tables(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS health_profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            height_cm REAL,
            weight_g INTEGER,
            age INTEGER,
            activity_level TEXT CHECK(activity_level IN (
                'sedentary', 'light', 'moderate', 'active', 'very_active'
            )),
            daily_calorie_goal INTEGER,
            evening_checkin_time TEXT DEFAULT '21:00',
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS health_meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            time TEXT,
            description TEXT NOT NULL,
            calories INTEGER NOT NULL DEFAULT 0,
            protein_g INTEGER NOT NULL DEFAULT 0,
            carbs_g INTEGER NOT NULL DEFAULT 0,
            fat_g INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS health_exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            time TEXT,
            description TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 0,
            estimated_calories INTEGER NOT NULL DEFAULT 0,
            intensity TEXT NOT NULL DEFAULT 'light' CHECK(intensity IN ('light', 'heavy')),
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS health_daily_summary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            total_calories INTEGER NOT NULL DEFAULT 0,
            total_protein_g INTEGER NOT NULL DEFAULT 0,
            total_carbs_g INTEGER NOT NULL DEFAULT 0,
            total_fat_g INTEGER NOT NULL DEFAULT 0,
            total_exercise_minutes INTEGER NOT NULL DEFAULT 0,
            total_exercise_calories INTEGER NOT NULL DEFAULT 0,
            mood INTEGER CHECK(mood BETWEEN 1 AND 5),
            energy INTEGER CHECK(energy BETWEEN 1 AND 5),
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS health_measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            weight_g INTEGER,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS nutrition_foods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            calories INTEGER NOT NULL DEFAULT 0,
            protein_g INTEGER NOT NULL DEFAULT 0,
            carbs_g INTEGER NOT NULL DEFAULT 0,
            fat_g INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

    """)


async def _create_life_manager_tables(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS life_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_event_id TEXT UNIQUE,
            title TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            all_day INTEGER NOT NULL DEFAULT 0,
            location TEXT,
            description TEXT,
            source_calendar TEXT DEFAULT 'personal',
            is_holiday INTEGER NOT NULL DEFAULT 0,
            reminder_offset INTEGER,
            reminder_sent INTEGER NOT NULL DEFAULT 0,
            google_updated_at TEXT,
            local_updated_at TEXT,
            sync_status TEXT NOT NULL DEFAULT 'synced',
            created_at TEXT
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

        CREATE TABLE IF NOT EXISTS shopping_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity INTEGER DEFAULT NULL,
            checked BOOLEAN NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    """)


async def _create_investing_tables(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS investing_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('brokerage', 'retirement', 'crypto')),
            currency TEXT NOT NULL DEFAULT 'JPY',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS investing_holdings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            name TEXT NOT NULL,
            asset_class TEXT NOT NULL CHECK(asset_class IN ('stock', 'etf', 'crypto', 'bond', 'other')),
            currency TEXT NOT NULL DEFAULT 'JPY',
            total_shares REAL NOT NULL DEFAULT 0,
            avg_cost_per_share INTEGER NOT NULL DEFAULT 0,
            current_price INTEGER NOT NULL DEFAULT 0,
            last_price_update TEXT,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS investing_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            holding_id INTEGER NOT NULL REFERENCES investing_holdings(id),
            type TEXT NOT NULL CHECK(type IN ('buy', 'sell', 'dividend', 'split')),
            shares REAL NOT NULL DEFAULT 0,
            price_per_share INTEGER NOT NULL DEFAULT 0,
            total_amount INTEGER NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'JPY',
            date TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS investing_portfolio_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            total_value INTEGER NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'JPY',
            breakdown TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS investing_holding_accounts (
            holding_id INTEGER NOT NULL REFERENCES investing_holdings(id),
            account_id INTEGER NOT NULL REFERENCES investing_accounts(id),
            PRIMARY KEY (holding_id, account_id)
        );
    """)


async def _create_fleet_tables(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS fleet_concerns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            resolved_at TEXT,
            resolution_summary TEXT,
            compressed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS fleet_concern_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            concern_id INTEGER NOT NULL REFERENCES fleet_concerns(id),
            source TEXT NOT NULL CHECK(source IN ('user_log', 'fleet_visit')),
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS fleet_visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            ended_at TEXT,
            conversation_history TEXT NOT NULL DEFAULT '[]',
            actions_taken TEXT,
            summary TEXT
        );
    """)


async def _create_reading_creative_tables(db: aiosqlite.Connection):
    # Migrate: add rating column if missing (for existing databases)
    try:
        await db.execute("SELECT rating FROM reading_books LIMIT 1")
    except Exception:
        try:
            await db.execute("ALTER TABLE reading_books ADD COLUMN rating INTEGER DEFAULT NULL")
        except Exception:
            pass  # Table doesn't exist yet, CREATE below will handle it

    await db.executescript("""
        CREATE TABLE IF NOT EXISTS creative_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS creative_file_index (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL REFERENCES creative_projects(id) ON DELETE CASCADE,
            file_path TEXT NOT NULL UNIQUE,
            file_name TEXT NOT NULL,
            is_directory INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS reading_books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT,
            status TEXT NOT NULL CHECK(status IN ('to_read', 'reading', 'finished')),
            recommended_by TEXT,
            reflection TEXT,
            rating INTEGER DEFAULT NULL,
            date_finished TEXT,
            date_added TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            sort_order INTEGER NOT NULL DEFAULT 0
        );
    """)


async def _create_dnd_tables(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS dnd_characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT 'New Character',
            class_name TEXT NOT NULL DEFAULT '',
            level INTEGER NOT NULL DEFAULT 1,
            data TEXT NOT NULL DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dnd_spells (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            level INTEGER NOT NULL DEFAULT 0,
            casting_time TEXT NOT NULL DEFAULT '1 action',
            range TEXT NOT NULL DEFAULT '',
            aoe TEXT DEFAULT NULL,
            duration TEXT NOT NULL DEFAULT 'Instantaneous',
            concentration BOOLEAN NOT NULL DEFAULT 0,
            ritual BOOLEAN NOT NULL DEFAULT 0,
            components TEXT NOT NULL DEFAULT '',
            spell_type TEXT NOT NULL DEFAULT 'utility',
            damage TEXT DEFAULT NULL,
            save_type TEXT DEFAULT NULL,
            save_effect TEXT DEFAULT NULL,
            description TEXT NOT NULL DEFAULT '',
            upcast TEXT DEFAULT NULL,
            source TEXT NOT NULL DEFAULT 'PHB',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(name, level)
        );

        CREATE TABLE IF NOT EXISTS dnd_beast_forms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cr TEXT NOT NULL DEFAULT '0',
            hp INTEGER NOT NULL DEFAULT 10,
            ac INTEGER NOT NULL DEFAULT 10,
            speeds TEXT NOT NULL DEFAULT '{"walk": 30}',
            ability_scores TEXT NOT NULL DEFAULT '{"STR": 10, "DEX": 10, "CON": 10}',
            attacks TEXT NOT NULL DEFAULT '[]',
            special_abilities TEXT NOT NULL DEFAULT '[]',
            senses TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dnd_campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT 'New Campaign',
            color TEXT NOT NULL DEFAULT '#c9a96e',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dnd_campaign_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id INTEGER NOT NULL,
            type TEXT NOT NULL DEFAULT 'note',
            title TEXT NOT NULL DEFAULT '',
            body TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (campaign_id) REFERENCES dnd_campaigns(id) ON DELETE CASCADE
        );
    """)


async def _create_documents_table(db: aiosqlite.Connection):
    """Unified document storage — replaces health_files, health_documents, life_files, life_documents, finance_files."""
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT,
            tags TEXT NOT NULL DEFAULT '[]',
            category TEXT NOT NULL CHECK(category IN ('finance', 'health', 'investing', 'life')),
            file_path TEXT,
            original_filename TEXT,
            mime_type TEXT,
            file_size INTEGER,
            date TEXT,
            provider TEXT,
            extracted_data TEXT,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );
    """)


async def _create_garmin_tables(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS garmin_daily_summary (
            date                    TEXT PRIMARY KEY,
            body_battery_max        INTEGER,
            body_battery_min        INTEGER,
            body_battery_charged    INTEGER,
            body_battery_drained    INTEGER,
            hrv_last_night_avg      INTEGER,
            hrv_status              TEXT,
            resting_heart_rate      INTEGER,
            stress_avg              INTEGER,
            stress_max              INTEGER,
            sleep_duration_seconds  INTEGER,
            sleep_score             INTEGER,
            sleep_deep_seconds      INTEGER,
            sleep_light_seconds     INTEGER,
            sleep_rem_seconds       INTEGER,
            sleep_awake_seconds     INTEGER,
            steps                   INTEGER,
            steps_goal              INTEGER,
            distance_meters         REAL,
            floors_climbed          INTEGER,
            active_calories         INTEGER,
            total_calories          INTEGER,
            active_minutes          INTEGER,
            workout_count           INTEGER DEFAULT 0,
            workout_total_seconds   INTEGER DEFAULT 0,
            raw_json                TEXT,
            ingested_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE INDEX IF NOT EXISTS idx_garmin_daily_date ON garmin_daily_summary(date);

        CREATE TABLE IF NOT EXISTS garmin_ingest_log (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            run_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            status          TEXT NOT NULL,
            dates_updated   TEXT,
            error_message   TEXT,
            duration_ms     INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_garmin_ingest_run ON garmin_ingest_log(run_at);
    """)


async def _create_system_tables(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS exchange_rates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pair TEXT NOT NULL,
            rate REAL NOT NULL,
            fetched_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );

        CREATE TABLE IF NOT EXISTS weather_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_key TEXT NOT NULL,
            payload TEXT NOT NULL,
            fetched_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            scope TEXT NOT NULL CHECK(scope IN ('today_hourly', 'week_daily'))
        );

        CREATE TABLE IF NOT EXISTS briefing_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            content TEXT NOT NULL
        );
    """)

    # Seed exchange rate if empty
    cursor = await db.execute("SELECT COUNT(*) FROM exchange_rates WHERE pair = 'JPY_USD'")
    count = (await cursor.fetchone())[0]
    if count == 0:
        await db.execute(
            "INSERT INTO exchange_rates (pair, rate) VALUES ('JPY_USD', 159.0)"
        )


async def _create_projects_table(db: aiosqlite.Connection):
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            stage TEXT NOT NULL DEFAULT 'scaffolding' CHECK(stage IN ('working_on', 'mostly_polished', 'scaffolding')),
            card_html TEXT,
            context_bucket TEXT,
            notes TEXT NOT NULL DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
            updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now'))
        );
    """)
