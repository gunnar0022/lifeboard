"""
LifeBoard — Seed data script.
Populates realistic sample data for both Finance and Life Manager agents.
Run: python -m backend.seed
"""
import asyncio
import json
from datetime import date, timedelta
from pathlib import Path
from backend.database import init_db, get_db

PROJECT_ROOT = Path(__file__).parent.parent


async def seed_config():
    """Write the recommended user_config.json."""
    config = {
        "user_name": "Gunnar",
        "display_name": "G",
        "timezone": "Asia/Tokyo",
        "primary_currency": "JPY",
        "secondary_currency": "USD",
        "pay_cycle_day": 21,
        "salary_is_net": True,
        "active_agents": ["finance", "life_manager", "health_body", "investing", "reading_creative"],
        "quiet_hours": {
            "weekday": {"start": "08:00", "end": "16:00"},
            "weekend": None,
        },
        "locale": "en",
    }
    config_path = PROJECT_ROOT / "user_config.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print(f"  [OK] user_config.json written")


async def seed_finance():
    """Seed Finance agent data."""
    db = await get_db()
    today = date.today()
    cycle_start = today.replace(day=21) if today.day >= 21 else (today.replace(day=1) - timedelta(days=1)).replace(day=21)

    try:
        # --- Accounts ---
        accounts = [
            # (name, type, currency, balance, sort, interest_rate)
            ("SMBC Checking", "bank", "JPY", 485000, 1, None),
            ("Rakuten Card", "wallet", "JPY", -32000, 2, None),
            ("Cash Wallet", "cash", "JPY", 15000, 3, None),
            ("Wise USD", "transfer_service", "USD", 120000, 4, 0.038),  # $1,200 @ 3.8% APR
            ("US Savings", "bank", "USD", 550000, 5, 0.045),  # $5,500 @ 4.5% APR
        ]
        for name, atype, curr, balance, sort, rate in accounts:
            await db.execute(
                """INSERT INTO finance_accounts
                   (name, account_type, currency, current_balance, sort_order, interest_rate)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                [name, atype, curr, balance, sort, rate],
            )
        print(f"  [OK] Finance accounts ({len(accounts)})")

        # --- Budgets ---
        budgets = [
            ("Food & Dining", 80000),
            ("Transportation", 15000),
            ("Social & Going Out", 30000),
            ("Shopping", 20000),
            ("Health", 10000),
        ]
        for cat, limit in budgets:
            await db.execute(
                "INSERT INTO finance_budgets (category, monthly_limit) VALUES (?, ?)",
                [cat, limit],
            )
        print("  [OK] Finance budgets (5)")

        # --- Recurring ---
        recurring = [
            ("Apartment Rent", -95000, 1, "Housing", "monthly", today.replace(day=28).isoformat(), 1),
            ("Softbank Mobile", -8500, 1, "Utilities", "monthly", today.replace(day=15).isoformat(), 1),
            ("Netflix", -1490, 2, "Subscriptions", "monthly", today.replace(day=10).isoformat(), 1),
            ("Spotify", -980, 2, "Subscriptions", "monthly", today.replace(day=5).isoformat(), 1),
            ("Tokyo Gas", -4200, 1, "Utilities", "monthly", today.replace(day=20).isoformat(), 0),
        ]
        for name, amount, acc_id, cat, freq, due, autopay in recurring:
            await db.execute(
                "INSERT INTO finance_recurring (name, amount, account_id, category, frequency, next_due, is_autopay) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [name, amount, acc_id, cat, freq, due, autopay],
            )
        print("  [OK] Finance recurring (5)")

        # --- Transactions (past 30 days) ---
        transactions = [
            # Income
            (cycle_start.isoformat(), 380000, 1, "Income", "Monthly salary (net)"),
            # Food & Dining
            ((today - timedelta(days=1)).isoformat(), -1280, 1, "Food & Dining", "Lawson lunch"),
            ((today - timedelta(days=2)).isoformat(), -3500, 1, "Food & Dining", "Yakiniku dinner with friends"),
            ((today - timedelta(days=3)).isoformat(), -850, 1, "Food & Dining", "FamilyMart onigiri & coffee"),
            ((today - timedelta(days=5)).isoformat(), -2200, 1, "Food & Dining", "Sushi takeout"),
            ((today - timedelta(days=6)).isoformat(), -4500, 1, "Food & Dining", "Weekly groceries — OK Store"),
            ((today - timedelta(days=8)).isoformat(), -1100, 1, "Food & Dining", "Starbucks"),
            ((today - timedelta(days=10)).isoformat(), -950, 1, "Food & Dining", "7-Eleven snacks"),
            ((today - timedelta(days=12)).isoformat(), -5800, 1, "Food & Dining", "Groceries — LIFE supermarket"),
            ((today - timedelta(days=14)).isoformat(), -3200, 1, "Food & Dining", "Ramen & gyoza"),
            ((today - timedelta(days=18)).isoformat(), -6000, 1, "Food & Dining", "Big weekly grocery run"),
            # Transportation
            ((today - timedelta(days=1)).isoformat(), -500, 3, "Transportation", "Suica top-up"),
            ((today - timedelta(days=7)).isoformat(), -2000, 3, "Transportation", "Suica top-up"),
            ((today - timedelta(days=15)).isoformat(), -5000, 1, "Transportation", "Monthly commuter pass top-up"),
            # Social & Going Out
            ((today - timedelta(days=4)).isoformat(), -1800, 2, "Social & Going Out", "Kindle manga"),
            ((today - timedelta(days=9)).isoformat(), -2500, 1, "Social & Going Out", "Movie ticket"),
            ((today - timedelta(days=20)).isoformat(), -3000, 1, "Social & Going Out", "Karaoke"),
            # Shopping
            ((today - timedelta(days=3)).isoformat(), -6800, 2, "Shopping", "Amazon — USB-C hub"),
            ((today - timedelta(days=11)).isoformat(), -3500, 2, "Shopping", "Uniqlo basics"),
            # Housing & Utilities
            ((today - timedelta(days=2)).isoformat(), -95000, 1, "Housing", "March rent"),
            ((today - timedelta(days=5)).isoformat(), -8500, 1, "Utilities", "Softbank mobile"),
            ((today - timedelta(days=10)).isoformat(), -1490, 2, "Subscriptions", "Netflix"),
            ((today - timedelta(days=5)).isoformat(), -980, 2, "Subscriptions", "Spotify"),
            # Health
            ((today - timedelta(days=13)).isoformat(), -2800, 1, "Health", "Pharmacy — supplements"),
        ]
        for dt, amt, acc_id, cat, desc in transactions:
            await db.execute(
                "INSERT INTO finance_transactions (date, amount, account_id, category, description) VALUES (?, ?, ?, ?, ?)",
                [dt, amt, acc_id, cat, desc],
            )
        print(f"  [OK] Finance transactions ({len(transactions)})")

        await db.commit()
    finally:
        await db.close()


async def seed_cycle_summaries():
    """Seed 4 historical cycle summaries for the insights section."""
    import random
    db = await get_db()
    today = date.today()

    # Generate 4 past cycles (offset -2 through -5, since -1 is previous and kept live)
    # Cycles run from pay_cycle_day(21) to pay_cycle_day-1(20) of next month
    cycles = []
    for months_back in range(2, 6):
        # Calculate cycle start: 21st of (current_month - months_back)
        month = today.month - months_back
        year = today.year
        while month <= 0:
            month += 12
            year -= 1
        cs = date(year, month, 21)
        # Cycle end: 20th of next month
        end_month = cs.month + 1
        end_year = cs.year
        if end_month > 12:
            end_month = 1
            end_year += 1
        ce = date(end_year, end_month, 20)
        cycles.append((cs, ce))

    base_categories = {
        "Food & Dining": (35000, 55000),
        "Housing": (95000, 95000),
        "Transportation": (7000, 15000),
        "Social & Going Out": (8000, 25000),
        "Shopping": (5000, 20000),
        "Utilities": (12000, 16000),
        "Health": (2000, 8000),
        "Subscriptions": (3000, 5000),
    }
    base_budgets = {
        "Food & Dining": 80000,
        "Transportation": 15000,
        "Social & Going Out": 30000,
        "Shopping": 20000,
        "Health": 10000,
    }

    try:
        for cs, ce in cycles:
            cat_breakdown = {}
            for cat, (lo, hi) in base_categories.items():
                cat_breakdown[cat] = random.randint(lo, hi)

            total_expenses = sum(cat_breakdown.values())
            total_income = random.randint(370000, 400000)
            transfer_vol = random.randint(10000, 50000)
            tx_count = random.randint(30, 55)

            # Generate simple insights
            top_cat = max(cat_breakdown, key=cat_breakdown.get)
            second_cat = sorted(cat_breakdown.items(), key=lambda x: x[1], reverse=True)[1][0]
            insights = [
                f"{top_cat} was the highest spending category at Y{cat_breakdown[top_cat]:,}, "
                f"{'above' if cat_breakdown[top_cat] > 50000 else 'within'} typical range.",
                f"Total expenses of Y{total_expenses:,} against Y{total_income:,} income "
                f"left a {'surplus' if total_income > total_expenses else 'deficit'} of Y{abs(total_income - total_expenses):,}.",
                f"{second_cat} spending of Y{cat_breakdown[second_cat]:,} was "
                f"{'notably higher' if cat_breakdown[second_cat] > 15000 else 'relatively modest'} this cycle.",
            ]

            await db.execute(
                """INSERT INTO finance_cycle_summaries
                   (cycle_start, cycle_end, total_income, total_expenses, net,
                    transfer_volume, transaction_count, category_breakdown,
                    budget_snapshot, insights)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [cs.isoformat(), ce.isoformat(), total_income, total_expenses,
                 total_income - total_expenses, transfer_vol, tx_count,
                 json.dumps(cat_breakdown), json.dumps(base_budgets),
                 json.dumps(insights)]
            )

        await db.commit()
        print(f"  [OK] Finance cycle summaries ({len(cycles)} historical cycles)")
    finally:
        await db.close()


async def seed_life_manager():
    """Seed Life Manager agent data."""
    db = await get_db()
    today = date.today()

    try:
        # --- Tasks ---
        tasks = [
            ("Call landlord about lease renewal", "high", (today + timedelta(days=3)).isoformat(), "communication"),
            ("Schedule dentist appointment", "medium", (today + timedelta(days=7)).isoformat(), "errand"),
            ("Renew NHI insurance card", "high", (today + timedelta(days=5)).isoformat(), "admin"),
            ("Buy birthday gift for mom", "medium", (today + timedelta(days=10)).isoformat(), "errand"),
            ("Clean apartment before weekend", "low", (today + timedelta(days=2)).isoformat(), "home"),
            ("Update resume on LinkedIn", "low", None, "other"),
            ("Research vacation destinations", "low", None, "other"),
            # Completed tasks
            ("Pick up dry cleaning", "medium", (today - timedelta(days=1)).isoformat(), "errand"),
            ("Pay electricity bill", "high", (today - timedelta(days=2)).isoformat(), "admin"),
        ]
        for title, priority, due, cat in tasks:
            is_done = 0
            completed_at = None
            if title in ("Pick up dry cleaning", "Pay electricity bill"):
                is_done = 1
                completed_at = (today - timedelta(days=1)).isoformat()
            await db.execute(
                "INSERT INTO life_tasks (title, priority, due_date, category, is_completed, completed_at) VALUES (?, ?, ?, ?, ?, ?)",
                [title, priority, due, cat, is_done, completed_at],
            )
        print(f"  [OK] Life Manager tasks ({len(tasks)})")

        # --- Bills ---
        bills = [
            ("Apartment Rent", 95000, (today.replace(day=28) if today.day < 28 else (today.replace(day=1) + timedelta(days=31)).replace(day=28)).isoformat(), "monthly", "rent", 0),
            ("Internet (NTT)", 5500, (today + timedelta(days=12)).isoformat(), "monthly", "utilities", 0),
            ("Tokyo Gas", 4200, (today + timedelta(days=3)).isoformat(), "monthly", "utilities", 0),
            ("National Health Insurance", 18000, (today + timedelta(days=8)).isoformat(), "monthly", "insurance", 1),
            ("Resident Tax", 32000, (today + timedelta(days=20)).isoformat(), "quarterly", "tax", 0),
            ("Renter's Insurance", 15000, (today + timedelta(days=45)).isoformat(), "yearly", "insurance", 0),
        ]
        for name, amount, due, freq, cat, autopay in bills:
            await db.execute(
                "INSERT INTO life_bills (name, amount, due_date, next_due, frequency, category, is_autopay) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [name, amount, due, due, freq, cat, autopay],
            )
        print(f"  [OK] Life Manager bills ({len(bills)})")

        # Events: no seed data — events come from Google Calendar sync

        # --- Documents (unified table) ---
        import json as _json
        unified_docs = [
            ("Apartment Lease", "2-year lease with Oakhouse Co. Monthly rent 85,000 JPY. Renewal in September 2026.", '["lease", "contract"]', "life", None, "Oakhouse Co."),
            ("National Health Insurance Card", "NHI card issued by Shinjuku Ward. Card number NHI-2025-xxxxx. Renewal around December.", '["insurance", "id-document"]', "life", None, "Shinjuku Ward Office"),
            ("Residence Card (Zairyu)", "Zairyu card valid through 2028. Residence status: Engineer/Specialist in Humanities.", '["visa", "id-document", "legal"]', "life", None, "Immigration Bureau"),
            ("Employment Contract", "Full-time employment contract with TechCo Japan. Start date January 2024. Annual salary review in April.", '["employment", "contract"]', "life", None, "TechCo Japan"),
            ("Renter's Insurance Policy", "JA Kyosai fire and liability insurance. Policy covers up to 10M JPY in damages.", '["insurance"]', "life", None, "JA Kyosai"),
            ("Passport", "Swedish passport valid until 2029. Passport number SE-xxxxxxxx.", '["id-document", "legal"]', "life", None, "Swedish Embassy"),
            ("Annual Health Checkup 2025", "Routine annual checkup. All blood work within normal ranges. BMI 24.5. Blood pressure 118/76. Cholesterol slightly elevated but within acceptable limits.", '["checkup", "medical"]', "health", (today - timedelta(days=90)).isoformat(), "Tanaka Clinic"),
            ("Flu Vaccination 2025", "Influenza vaccination, standard quadrivalent. No adverse reactions.", '["vaccination", "medical"]', "health", (today - timedelta(days=120)).isoformat(), "City Hospital"),
        ]
        for title, summary, tags, cat, doc_date, provider in unified_docs:
            await db.execute(
                "INSERT INTO documents (title, summary, tags, category, date, provider) VALUES (?, ?, ?, ?, ?, ?)",
                [title, summary, tags, cat, doc_date, provider],
            )
        print(f"  [OK] Documents ({len(unified_docs)})")

        await db.commit()
    finally:
        await db.close()


async def seed_health():
    """Seed Health & Body agent data."""
    import random
    db = await get_db()
    today = date.today()

    try:
        # Profile
        await db.execute(
            """INSERT OR REPLACE INTO health_profile
               (id, height_cm, weight_g, age, activity_level, daily_calorie_goal, evening_checkin_time)
               VALUES (1, 182, 81000, 30, 'moderate', 2200, '21:00')"""
        )

        # Measurements (weekly weigh-ins, last 4 weeks)
        for i in range(4):
            d = today - timedelta(days=i * 7)
            w = 81000 - (i * 300)  # slight downward trend
            await db.execute(
                "INSERT INTO health_measurements (date, weight_g) VALUES (?, ?)",
                [d.isoformat(), w],
            )

        # Recent meals (last 3 days — kept as individual entries)
        meals = [
            (today.isoformat(), "08:30", "Coffee and toast with egg", 350, 15, 30, 12),
            (today.isoformat(), "12:30", "Katsu curry set at CoCo Ichibanya", 850, 35, 90, 30),
            ((today - timedelta(days=1)).isoformat(), "08:00", "Yogurt and granola", 300, 12, 40, 8),
            ((today - timedelta(days=1)).isoformat(), "12:00", "Convenience store bento", 700, 25, 80, 25),
            ((today - timedelta(days=1)).isoformat(), "19:00", "Salmon sashimi and rice", 550, 35, 50, 15),
            ((today - timedelta(days=2)).isoformat(), "09:00", "Onigiri and miso soup", 280, 8, 45, 4),
            ((today - timedelta(days=2)).isoformat(), "13:00", "Ramen", 750, 25, 80, 30),
            ((today - timedelta(days=2)).isoformat(), "19:30", "Yakitori and beer", 650, 30, 20, 25),
        ]
        for d, t, desc, cal, p, c, f in meals:
            await db.execute(
                "INSERT INTO health_meals (date, time, description, calories, protein_g, carbs_g, fat_g) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [d, t, desc, cal, p, c, f],
            )

        # Recent exercises
        exercises = [
            ((today - timedelta(days=1)).isoformat(), "07:00", "Morning jog in park", 30, 250),
            ((today - timedelta(days=2)).isoformat(), "18:00", "Gym session - weights and stretching", 45, 300),
        ]
        for d, t, desc, dur, cal in exercises:
            await db.execute(
                "INSERT INTO health_exercises (date, time, description, duration_minutes, estimated_calories) VALUES (?, ?, ?, ?, ?)",
                [d, t, desc, dur, cal],
            )

        # Daily summaries for older days (already compressed, days 4-30)
        for i in range(4, 30):
            d = (today - timedelta(days=i)).isoformat()
            cal = random.randint(1800, 2600)
            mood = random.randint(2, 5)
            energy = random.randint(2, 5)
            ex_min = random.choice([0, 0, 20, 30, 45, 60])
            ex_cal = ex_min * 8
            await db.execute(
                """INSERT INTO health_daily_summary
                   (date, total_calories, total_protein_g, total_carbs_g, total_fat_g,
                    total_exercise_minutes, total_exercise_calories, mood, energy)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [d, cal, random.randint(60, 120), random.randint(150, 300),
                 random.randint(40, 100), ex_min, ex_cal, mood, energy],
            )

        await db.commit()
        print(f"  [OK] Health profile, {len(meals)} meals, {len(exercises)} exercises, 26 daily summaries")
    finally:
        await db.close()


async def seed_investing():
    """Seed Investing agent data."""
    import random
    db = await get_db()
    today = date.today()

    try:
        # --- Accounts ---
        accounts = [
            # (name, type, currency)
            ("SBI Securities", "brokerage", "JPY"),
            ("Coinbase", "crypto", "USD"),
        ]
        for name, atype, curr in accounts:
            await db.execute(
                "INSERT INTO investing_accounts (name, type, currency) VALUES (?, ?, ?)",
                [name, atype, curr],
            )
        print(f"  [OK] Investing accounts ({len(accounts)})")

        # --- Holdings ---
        # (symbol, name, asset_class, currency, total_shares, avg_cost, current_price)
        holdings = [
            ("7203.T", "Toyota Motor", "stock", "JPY", 100, 2850, 2920),
            ("1306.T", "TOPIX ETF", "etf", "JPY", 50, 2400, 2480),
            ("AAPL", "Apple Inc", "stock", "USD", 5, 17500, 19200),        # $175 -> $192
            ("VOO", "Vanguard S&P 500", "etf", "USD", 3, 48000, 52100),   # $480 -> $521
            ("BTC-USD", "Bitcoin", "crypto", "USD", 0.05, 4200000, 8400000),  # $42k -> $84k
            ("8306.T", "MUFG", "stock", "JPY", 200, 1250, 1380),
        ]
        now_iso = today.isoformat() + "T18:00:00"
        for symbol, name, cls, curr, shares, avg_cost, price in holdings:
            await db.execute(
                """INSERT INTO investing_holdings
                   (symbol, name, asset_class, currency, total_shares,
                    avg_cost_per_share, current_price, last_price_update)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                [symbol, name, cls, curr, shares, avg_cost, price, now_iso],
            )
        print(f"  [OK] Investing holdings ({len(holdings)})")

        # --- Transactions ---
        transactions = [
            # (holding_id, type, shares, price_per_share, total_amount, currency, date, notes)
            (1, "buy", 50, 2800, 140000, "JPY", (today - timedelta(days=150)).isoformat(), "Initial Toyota purchase"),
            (1, "buy", 50, 2900, 145000, "JPY", (today - timedelta(days=60)).isoformat(), "Added more Toyota"),
            (2, "buy", 50, 2400, 120000, "JPY", (today - timedelta(days=120)).isoformat(), "TOPIX ETF — lump sum"),
            (3, "buy", 3, 16500, 49500, "USD", (today - timedelta(days=180)).isoformat(), "First Apple shares"),
            (3, "buy", 2, 19000, 38000, "USD", (today - timedelta(days=30)).isoformat(), "Added more Apple"),
            (4, "buy", 3, 48000, 144000, "USD", (today - timedelta(days=90)).isoformat(), "VOO S&P 500"),
            (5, "buy", 0.05, 4200000, 210000, "USD", (today - timedelta(days=200)).isoformat(), "BTC DCA"),
            (6, "buy", 200, 1250, 250000, "JPY", (today - timedelta(days=100)).isoformat(), "MUFG bank stock"),
            (4, "dividend", 0, 0, 1250, "USD", (today - timedelta(days=15)).isoformat(), "Q1 2026 VOO dividend"),
            (3, "dividend", 0, 0, 125, "USD", (today - timedelta(days=20)).isoformat(), "AAPL quarterly dividend"),
        ]
        for h_id, ttype, shares, pps, total, curr, dt, notes in transactions:
            await db.execute(
                """INSERT INTO investing_transactions
                   (holding_id, type, shares, price_per_share, total_amount, currency, date, notes)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                [h_id, ttype, shares, pps, total, curr, dt, notes],
            )
        print(f"  [OK] Investing transactions ({len(transactions)})")

        # --- Holding-Account links ---
        # JPY holdings -> SBI (id=1), USD/crypto -> Coinbase (id=2)
        links = [
            (1, 1), (2, 1), (6, 1),  # Toyota, TOPIX, MUFG -> SBI
            (3, 2), (4, 2), (5, 2),  # AAPL, VOO, BTC -> Coinbase
        ]
        for h_id, a_id in links:
            await db.execute(
                "INSERT INTO investing_holding_accounts (holding_id, account_id) VALUES (?, ?)",
                [h_id, a_id],
            )
        print(f"  [OK] Investing account links ({len(links)})")

        # --- Portfolio snapshots (90 days, LM-33) ---
        # FX-converted total: JPY holdings ~692K + USD holdings ~1,069K = ~1,761K
        # Start lower and trend up to current level over 90 days
        base_value = 1600000
        for i in range(90):
            d = today - timedelta(days=90 - i)
            # Gradual upward trend with daily noise
            noise = random.randint(-12000, 15000)
            trend = int(i * 1800)  # ~1.8k/day growth -> ends ~1,762K
            total = base_value + trend + noise

            # Breakdown by asset class (rough proportions)
            stock_pct = 0.50 + random.uniform(-0.03, 0.03)
            etf_pct = 0.28 + random.uniform(-0.02, 0.02)
            crypto_pct = 1.0 - stock_pct - etf_pct
            breakdown = {
                "stock": int(total * stock_pct),
                "etf": int(total * etf_pct),
                "crypto": int(total * crypto_pct),
            }

            await db.execute(
                """INSERT INTO investing_portfolio_snapshots
                   (date, total_value, currency, breakdown)
                   VALUES (?, ?, ?, ?)""",
                [d.isoformat(), total, "JPY", json.dumps(breakdown)],
            )
        print(f"  [OK] Investing portfolio snapshots (90 days)")

        await db.commit()
    finally:
        await db.close()


async def seed_fleet():
    """Seed Dr. Fleet data — concerns, logs, and a past visit."""
    db = await get_db()
    today = date.today()

    try:
        # --- Active Concerns ---
        # Concern 1: Recurring lower back pain (active, with logs)
        await db.execute(
            """INSERT INTO fleet_concerns (title, description, status, created_at)
               VALUES (?, ?, 'active', ?)""",
            [
                "Recurring lower back pain after volleyball",
                "Patient reports recurring lower back pain that started approximately 3 weeks ago. "
                "Pain is worst the day after volleyball matches, localized to the L4-L5 region. "
                "No radiating pain to legs. Aggravated by prolonged sitting and bending forward. "
                "Likely muscular strain related to explosive jumping movements. Patient has moderate "
                "activity level and plays volleyball 2x per week.",
                (today - timedelta(days=21)).isoformat(),
            ],
        )

        # Concern 2: Persistent headaches (active, with logs)
        await db.execute(
            """INSERT INTO fleet_concerns (title, description, status, created_at)
               VALUES (?, ?, 'active', ?)""",
            [
                "Persistent afternoon headaches",
                "Patient reports headaches occurring 3-4 times per week, typically starting around "
                "2-3 PM. Describes them as a dull pressure behind the eyes and temples. No visual "
                "disturbances or nausea. Possibly related to screen time (8+ hours daily for work). "
                "Patient mentioned not drinking enough water during work hours. Recommended tracking "
                "hydration and taking regular screen breaks.",
                (today - timedelta(days=14)).isoformat(),
            ],
        )

        print(f"  [OK] Fleet concerns (2 active)")

        # --- Concern Logs ---
        logs = [
            # Back pain logs
            (1, "user_log", "Back was pretty stiff this morning after yesterday's game",
             (today - timedelta(days=18)).isoformat()),
            (1, "fleet_visit", "Discussed stretching routine. Recommended cat-cow and child's pose "
             "before and after volleyball. Consider reducing jump serves temporarily.",
             (today - timedelta(days=14)).isoformat()),
            (1, "user_log", "Tried the stretches before volleyball today, back felt a bit better during the game",
             (today - timedelta(days=10)).isoformat()),
            (1, "user_log", "Back pain was mild today, just some tightness in the morning",
             (today - timedelta(days=5)).isoformat()),
            (1, "user_log", "Good day, barely noticed the back",
             (today - timedelta(days=2)).isoformat()),

            # Headache logs
            (2, "user_log", "Headache hit around 3pm again, pretty bad today",
             (today - timedelta(days=12)).isoformat()),
            (2, "user_log", "Tried drinking more water, headache was lighter today",
             (today - timedelta(days=8)).isoformat()),
            (2, "fleet_visit", "Patient reports some improvement with hydration. Still occurring 2-3x "
             "per week. Suggested 20-20-20 rule for screen breaks and tracking caffeine intake.",
             (today - timedelta(days=7)).isoformat()),
            (2, "user_log", "No headache today! Took screen breaks every hour",
             (today - timedelta(days=3)).isoformat()),
        ]

        for concern_id, source, content, created_at in logs:
            await db.execute(
                """INSERT INTO fleet_concern_logs (concern_id, source, content, created_at)
                   VALUES (?, ?, ?, ?)""",
                [concern_id, source, content, created_at],
            )
        print(f"  [OK] Fleet concern logs ({len(logs)})")

        # --- Resolved Concern ---
        await db.execute(
            """INSERT INTO fleet_concerns (title, description, status, created_at, resolved_at, resolution_summary)
               VALUES (?, ?, 'resolved', ?, ?, ?)""",
            [
                "Left ankle soreness from trail run",
                "Patient rolled left ankle mildly during a trail run. Minor swelling, no bruising. "
                "Full range of motion but discomfort on uneven surfaces. Likely a mild Grade I sprain.",
                (today - timedelta(days=45)).isoformat(),
                (today - timedelta(days=20)).isoformat(),
                "Ankle fully recovered. Swelling resolved within a week, discomfort gone by day 14. "
                "Patient resumed normal running without issues. No ongoing concerns.",
            ],
        )
        print(f"  [OK] Fleet resolved concerns (1)")

        # --- Past Visit ---
        await db.execute(
            """INSERT INTO fleet_visits (started_at, ended_at, conversation_history, actions_taken, summary)
               VALUES (?, ?, '[]', ?, ?)""",
            [
                (today - timedelta(days=7)).isoformat() + "T14:00:00",
                (today - timedelta(days=7)).isoformat() + "T14:25:00",
                '[{"type": "add_log", "concern_id": 1}, {"type": "add_log", "concern_id": 2}]',
                "Follow-up on back pain and headaches. Back improving with stretches. "
                "Headaches partially responding to hydration. Added screen break recommendation.",
            ],
        )
        print(f"  [OK] Fleet visits (1)")

        await db.commit()
    finally:
        await db.close()


async def clear_all():
    """Clear all data from all tables."""
    db = await get_db()
    try:
        await db.execute("PRAGMA foreign_keys=OFF")
        tables = [
            "finance_cycle_summaries",
            "finance_transactions", "finance_transfers",
            "finance_recurring", "finance_budgets", "finance_accounts",
            "life_events", "life_tasks", "life_bills",
            "health_measurements",
            "health_daily_summary", "health_exercises", "health_meals", "health_profile",
            "investing_holding_accounts", "investing_transactions",
            "investing_portfolio_snapshots", "investing_holdings", "investing_accounts",
            "fleet_concern_logs", "fleet_visits", "fleet_concerns",
            "creative_file_index", "creative_projects", "reading_books",
            "documents",
            # Legacy tables (drop if they exist from old schema)
            "finance_files", "life_files", "life_documents",
            "health_files", "health_documents",
        ]
        for table in tables:
            try:
                await db.execute(f"DELETE FROM {table}")
                # Reset autoincrement counters
                await db.execute(f"DELETE FROM sqlite_sequence WHERE name = ?", [table])
            except Exception:
                pass  # Table may not exist yet
        await db.commit()
        await db.execute("PRAGMA foreign_keys=ON")
        print("  [OK] All tables cleared")
    finally:
        await db.close()


async def _has_data(table: str) -> bool:
    """Check if a table already has data."""
    db = await get_db()
    try:
        row = await (await db.execute(f"SELECT COUNT(*) as cnt FROM {table}")).fetchone()
        return row["cnt"] > 0
    except Exception:
        return False
    finally:
        await db.close()


async def seed_dnd_spells():
    """Seed the DnD spell library."""
    spells = [
        # Cantrips (Level 0)
        {"name": "Shillelagh", "level": 0, "casting_time": "1 bonus action", "range": "Touch", "duration": "1 minute", "concentration": False, "ritual": False, "components": "V, S, M (mistletoe)", "spell_type": "buff", "description": "Club or quarterstaff becomes magical. Use spellcasting ability for attacks. Damage die becomes d8.", "source": "PHB"},
        {"name": "Druidcraft", "level": 0, "casting_time": "1 action", "range": "30ft", "aoe": "5ft cube", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "utility", "description": "Create a tiny harmless sensory effect that predicts weather, bloom a flower, create sensory effect, or light/snuff a small flame.", "source": "PHB"},
        {"name": "Chill Touch", "level": 0, "casting_time": "1 action", "range": "120ft", "duration": "1 round", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "damage", "damage": "1d8 necrotic", "description": "Ranged spell attack. Hit creature can't regain HP until your next turn. Undead also have disadvantage on attacks against you. Scales at 5th (2d8), 11th (3d8), 17th (4d8).", "source": "PHB"},
        {"name": "Fire Bolt", "level": 0, "casting_time": "1 action", "range": "120ft", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "damage", "damage": "1d10 fire", "description": "Ranged spell attack. Flammable unattended objects ignite. Scales at 5th (2d10), 11th (3d10), 17th (4d10).", "source": "PHB"},
        {"name": "Sacred Flame", "level": 0, "casting_time": "1 action", "range": "60ft", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "damage", "damage": "1d8 radiant", "save_type": "DEX", "save_effect": "negates", "description": "Target must succeed DEX save or take damage. No benefit from cover. Scales at 5th, 11th, 17th.", "source": "PHB"},
        {"name": "Eldritch Blast", "level": 0, "casting_time": "1 action", "range": "120ft", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "damage", "damage": "1d10 force", "description": "Ranged spell attack. Additional beams at 5th (2), 11th (3), 17th (4). Each beam attacks separately.", "source": "PHB"},
        {"name": "Mage Hand", "level": 0, "casting_time": "1 action", "range": "30ft", "duration": "1 minute", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "utility", "description": "Spectral floating hand. Manipulate objects, open containers, retrieve items. Can't attack or carry more than 10 lbs.", "source": "PHB"},
        {"name": "Prestidigitation", "level": 0, "casting_time": "1 action", "range": "10ft", "duration": "Up to 1 hour", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "utility", "description": "Minor magical trick. Sensory effect, light/snuff flame, clean/soil object, warm/cool/flavor material, small mark or symbol. Up to 3 non-instantaneous effects active.", "source": "PHB"},
        # 1st Level
        {"name": "Thunderwave", "level": 1, "casting_time": "1 action", "range": "Self", "aoe": "15ft cube", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "damage", "damage": "2d8 thunder", "save_type": "CON", "save_effect": "half damage", "description": "Each creature in 15ft cube originating from you makes CON save. Failed: 2d8 thunder + pushed 10ft. Success: half damage, no push. Unsecured objects pushed 10ft.", "upcast": "+1d8 per slot level above 1st", "source": "PHB"},
        {"name": "Goodberry", "level": 1, "casting_time": "1 action", "range": "Touch", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S, M (sprig of mistletoe)", "spell_type": "healing", "description": "Create 10 magical berries. Eating one restores 1 HP and provides nourishment for a day. Berries lose potency after 24 hours.", "source": "PHB"},
        {"name": "Absorb Elements", "level": 1, "casting_time": "1 reaction", "range": "Self", "duration": "1 round", "concentration": False, "ritual": False, "components": "S", "spell_type": "buff", "damage": "+1d6 (element)", "description": "When you take acid, cold, fire, lightning, or thunder damage, gain resistance to that damage type until your next turn. First melee attack on your next turn deals +1d6 of the triggering type.", "upcast": "+1d6 per slot level above 1st", "source": "PHB"},
        {"name": "Faerie Fire", "level": 1, "casting_time": "1 action", "range": "60ft", "aoe": "20ft cube", "duration": "1 minute", "concentration": True, "ritual": False, "components": "V", "spell_type": "control", "save_type": "DEX", "save_effect": "negates", "description": "Objects and creatures in area outlined in light. Affected creatures shed dim light 10ft, can't benefit from invisibility. Attacks against affected creatures have advantage.", "source": "PHB"},
        {"name": "Wild Cunning", "level": 1, "casting_time": "1 action", "range": "120ft", "duration": "Instantaneous", "concentration": False, "ritual": True, "components": "V, S", "spell_type": "utility", "description": "Call on spirits of nature for aid. Effects vary: find water/food, shelter, safe path, or identify plants/animals. DM determines specifics.", "source": "PHB"},
        {"name": "Entangle", "level": 1, "casting_time": "1 action", "range": "90ft", "aoe": "20ft square", "duration": "1 minute", "concentration": True, "ritual": False, "components": "V, S", "spell_type": "control", "save_type": "STR", "save_effect": "negates", "description": "Grasping weeds and vines sprout from ground. Creatures in area make STR save or become restrained. Restrained creature can use action to make STR check to free itself. Area is difficult terrain.", "source": "PHB"},
        {"name": "Fog Cloud", "level": 1, "casting_time": "1 action", "range": "120ft", "aoe": "20ft sphere", "duration": "1 hour", "concentration": True, "ritual": False, "components": "V, S", "spell_type": "control", "description": "Create a 20ft radius sphere of fog centered on a point. Area is heavily obscured. Wind of 10+ mph disperses it.", "upcast": "+20ft radius per slot level above 1st", "source": "PHB"},
        {"name": "Shield", "level": 1, "casting_time": "1 reaction", "range": "Self", "duration": "1 round", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "buff", "description": "+5 AC until start of your next turn, including against the triggering attack. Immune to Magic Missile for the duration.", "source": "PHB"},
        {"name": "Magic Missile", "level": 1, "casting_time": "1 action", "range": "120ft", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "damage", "damage": "3d4+3 force", "description": "Three darts, each dealing 1d4+1 force damage. All hit automatically. Can target same or different creatures.", "upcast": "+1 dart per slot level above 1st", "source": "PHB"},
        {"name": "Cure Wounds", "level": 1, "casting_time": "1 action", "range": "Touch", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "healing", "damage": "1d8+mod", "description": "Restore 1d8 + spellcasting modifier HP to a creature you touch. No effect on undead or constructs.", "upcast": "+1d8 per slot level above 1st", "source": "PHB"},
        {"name": "Healing Word", "level": 1, "casting_time": "1 bonus action", "range": "60ft", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V", "spell_type": "healing", "damage": "1d4+mod", "description": "Restore 1d4 + spellcasting modifier HP to a creature you can see in range.", "upcast": "+1d4 per slot level above 1st", "source": "PHB"},
        {"name": "Hex", "level": 1, "casting_time": "1 bonus action", "range": "90ft", "duration": "1 hour", "concentration": True, "ritual": False, "components": "V, S, M (petrified eye of a newt)", "spell_type": "debuff", "damage": "1d6 necrotic", "description": "Curse a creature. Deal extra 1d6 necrotic damage on each hit. Target has disadvantage on ability checks of one chosen ability. If target drops to 0 HP, move hex to new creature as bonus action.", "upcast": "Duration: 3rd=8hr, 5th=24hr", "source": "PHB"},
        # 2nd Level
        {"name": "Pass Without Trace", "level": 2, "casting_time": "1 action", "range": "Self", "aoe": "30ft radius", "duration": "1 hour", "concentration": True, "ritual": False, "components": "V, S, M (ashes from burned mistletoe leaf)", "spell_type": "buff", "description": "You and each creature you choose within 30ft get +10 bonus to Stealth checks. Can't be tracked by nonmagical means unless you leave a trail intentionally.", "source": "PHB"},
        {"name": "Heat Metal", "level": 2, "casting_time": "1 action", "range": "60ft", "duration": "1 minute", "concentration": True, "ritual": False, "components": "V, S, M (piece of iron)", "spell_type": "damage", "damage": "2d8 fire", "save_type": "CON", "description": "Choose manufactured metal object you can see. It glows red-hot. Creature in contact takes 2d8 fire damage. Until spell ends, use bonus action to repeat damage. Creature holding/wearing it has disadvantage on attacks and ability checks until start of your next turn.", "upcast": "+1d8 per slot level above 2nd", "source": "PHB"},
        {"name": "Misty Step", "level": 2, "casting_time": "1 bonus action", "range": "Self", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V", "spell_type": "utility", "description": "Teleport up to 30 feet to an unoccupied space you can see.", "source": "PHB"},
        {"name": "Spiritual Weapon", "level": 2, "casting_time": "1 bonus action", "range": "60ft", "duration": "1 minute", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "damage", "damage": "1d8+mod force", "description": "Create floating spectral weapon. Make melee spell attack on creation. Bonus action on subsequent turns to move 20ft and attack.", "upcast": "+1d8 per 2 slot levels above 2nd", "source": "PHB"},
        {"name": "Hold Person", "level": 2, "casting_time": "1 action", "range": "60ft", "duration": "1 minute", "concentration": True, "ritual": False, "components": "V, S, M (small piece of iron)", "spell_type": "control", "save_type": "WIS", "save_effect": "negates", "description": "Target humanoid makes WIS save or is paralyzed. Repeat save at end of each turn. Attacks within 5ft of paralyzed creature are automatic crits.", "upcast": "+1 target per slot level above 2nd", "source": "PHB"},
        # 3rd Level
        {"name": "Fireball", "level": 3, "casting_time": "1 action", "range": "150ft", "aoe": "20ft sphere", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S, M (bat guano and sulfur)", "spell_type": "damage", "damage": "8d6 fire", "save_type": "DEX", "save_effect": "half damage", "description": "Bright streak detonates at a point in range. Each creature in 20ft sphere makes DEX save. Failed: 8d6 fire. Success: half. Ignites flammable objects not being worn/carried.", "upcast": "+1d6 per slot level above 3rd", "source": "PHB"},
        {"name": "Counterspell", "level": 3, "casting_time": "1 reaction", "range": "60ft", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "S", "spell_type": "control", "description": "Attempt to interrupt a creature casting a spell. If 3rd level or lower, automatically countered. Higher level: make ability check DC 10 + spell level.", "upcast": "Auto-counters spells up to slot level used", "source": "PHB"},
        {"name": "Dispel Magic", "level": 3, "casting_time": "1 action", "range": "120ft", "duration": "Instantaneous", "concentration": False, "ritual": False, "components": "V, S", "spell_type": "utility", "description": "End one spell on a target creature, object, or area. If 3rd level or lower, automatically ends. Higher level: make ability check DC 10 + spell level.", "upcast": "Auto-dispels spells up to slot level used", "source": "PHB"},
    ]

    db = await get_db()
    try:
        for s in spells:
            await db.execute(
                """INSERT OR IGNORE INTO dnd_spells
                   (name, level, casting_time, range, aoe, duration, concentration, ritual,
                    components, spell_type, damage, save_type, save_effect, description, upcast, source)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    s["name"], s["level"], s.get("casting_time", "1 action"),
                    s.get("range", ""), s.get("aoe"), s.get("duration", "Instantaneous"),
                    1 if s.get("concentration") else 0, 1 if s.get("ritual") else 0,
                    s.get("components", ""), s.get("spell_type", "utility"),
                    s.get("damage"), s.get("save_type"), s.get("save_effect"),
                    s.get("description", ""), s.get("upcast"), s.get("source", "PHB"),
                ),
            )
        await db.commit()
        print(f"  [OK] {len(spells)} spells seeded")
    finally:
        await db.close()


async def _get_spell_id(db, name):
    """Helper to look up a spell ID by name."""
    cursor = await db.execute("SELECT id FROM dnd_spells WHERE name = ?", (name,))
    row = await cursor.fetchone()
    return row["id"] if row else None


async def seed_gandthalas():
    """Seed Gandthalas Telciron (Level 3 Half-Elf Druid)."""
    db = await get_db()
    try:
        # Resolve spell IDs
        spell_names = {
            "cantrips": ["Shillelagh", "Druidcraft", "Chill Touch"],
            "prepared": ["Thunderwave", "Goodberry", "Absorb Elements", "Faerie Fire", "Wild Cunning", "Pass Without Trace", "Heat Metal"],
            "known": ["Entangle", "Fog Cloud"],
        }
        cantrip_ids = [await _get_spell_id(db, n) for n in spell_names["cantrips"]]
        prepared_ids = [await _get_spell_id(db, n) for n in spell_names["prepared"]]
        known_ids = [await _get_spell_id(db, n) for n in spell_names["known"]]
        # Filter out None
        cantrip_ids = [i for i in cantrip_ids if i is not None]
        prepared_ids = [i for i in prepared_ids if i is not None]
        known_ids = [i for i in known_ids if i is not None]

        gandthalas = {
            "meta": {
                "name": "Gandthalas Telciron",
                "race": "Half-Elf",
                "className": "Druid",
                "level": 3,
                "subclass": "Circle of Spores",
                "background": "Faction Agent",
                "alignment": "True Neutral",
                "appearance": "Coppery skin. Barky hair with some grey wisps. Taller than average, thin but sturdy frame. Dark Traveler's Robes, worn and repaired in many places.",
                "languages": ["Common", "Elvish", "Druidic", "Dwarvish", "Undercommon", "Celestial"],
                "speed": 35,
                "size": "Medium",
                "bodyType": "Humanoid"
            },
            "abilities": {"STR": 8, "DEX": 14, "CON": 16, "INT": 10, "WIS": 16, "CHA": 10},
            "saveProficiencies": ["INT", "WIS"],
            "skillProficiencies": ["Nature", "Religion", "Insight", "Perception"],
            "skillExpertise": [],
            "proficiencies": {
                "armor": ["Light", "Medium", "Shields"],
                "weapons": ["Big Stick"],
                "tools": []
            },
            "combat": {
                "ac": 15,
                "acSource": "Leather (11) + Shield (+2) + DEX (+2)",
                "hpMax": 27, "hpCurrent": 27, "hpTemp": 0,
                "hitDiceType": 8, "hitDiceRemaining": 3,
                "deathSaves": {"successes": 0, "failures": 0}
            },
            "attacks": [
                {"name": "Quarter Staff", "atkAbility": "STR", "damage": "d8", "damageType": "bludgeoning", "properties": "Shillelagh only - uses WIS for attack/damage when active", "affectedByClassFeature": False},
                {"name": "Chill Touch", "atkAbility": "WIS", "damage": "1d8", "damageType": "necrotic", "properties": "120ft. No healing until your next turn.", "affectedByClassFeature": False}
            ],
            "features": [
                {"name": "Druidic", "source": "Druid", "desc": "Secret language of Druids. Can speak it and use it to leave hidden messages."},
                {"name": "Druid Cantrips", "source": "Druid", "desc": "Know Druid cantrips. Druidic Focus can be used as spellcasting focus."},
                {"name": "Wild Shape", "source": "Druid", "desc": "Transform into an animal you've seen before. 10 minute duration. Current restrictions: no swimmers or flyers."},
                {"name": "Halo of Spores", "source": "Circle of Spores", "desc": "D4 reaction damage to creatures within 10ft. Constitution save against DC 13. +1 D4 during symbiotic entity."},
                {"name": "Symbiotic Entity", "source": "Circle of Spores", "desc": "Action to activate. 10 minute duration. +4 temp HP per level. Melee attacks do +D6 necrotic. Uses a Wild Shape charge."},
                {"name": "Fey Ancestry", "source": "Race", "desc": "Advantage on saves against being charmed. Magic can't put you to sleep."},
                {"name": "Darkvision", "source": "Race", "desc": "See in dim light within 60ft as if bright light. See in darkness as dim light."},
                {"name": "Fleet of Foot", "source": "Race", "desc": "Base walking speed is 35 feet."}
            ],
            "classFeature": {
                "type": "wild_shape",
                "maxUses": 2, "currentUses": 2, "active": False, "rechargeOn": "short"
            },
            "equipment": [
                "Leather Armor (11 AC)", "Wooden Shield (+2 AC)", "Quarter Staff",
                "Explorer's Pack", "Emblem of Emerald Enclave", "The Telnoven",
                "Paper Bird", "And the quill", "x3 10lb silver bars"
            ],
            "coins": {"CP": 0, "SP": 0, "EP": 0, "GP": 25, "PP": 0},
            "customBoxes": [
                {
                    "title": "Personality",
                    "fields": [
                        {"label": "Trait", "value": "Waterdavian. Circle of Spores Druid training."},
                        {"label": "Ideal", "value": "Returned to Waterdeep to work with Emerald Enclave."},
                        {"label": "Bond", "value": "Faith: Jergal."},
                    ]
                }
            ],
            "spellcasting": {
                "ability": "WIS",
                "type": "prepared",
                "slots": {"1": {"max": 4, "expended": 0}, "2": {"max": 2, "expended": 0}},
                "cantrips": cantrip_ids,
                "preparedSpells": prepared_ids,
                "knownSpells": known_ids,
                "spellOrder": {
                    "cantrips": cantrip_ids,
                    "prepared": prepared_ids,
                    "known": known_ids
                },
                "concentratingOn": None
            }
        }

        await db.execute(
            "INSERT INTO dnd_characters (name, class_name, level, data) VALUES (?, ?, ?, ?)",
            ("Gandthalas Telciron", "Druid", 3, json.dumps(gandthalas)),
        )
        await db.commit()
        print("  [OK] Gandthalas Telciron seeded")
    finally:
        await db.close()


async def seed_dnd():
    """Seed DnD character sheet with Garden Opus."""
    garden_opus = {
        "meta": {
            "name": "Garden Opus",
            "race": "Uma (Bipedal Homebrew)",
            "className": "Barbarian",
            "level": 2,
            "subclass": "Path of the Ancestral Guardian",
            "background": "Athlete",
            "alignment": "Chaotic Good",
            "appearance": "5'8\"",
            "languages": ["Common", "Sylvan", "Giant"],
            "speed": 35,
            "size": "Medium",
            "bodyType": "Humanoid"
        },
        "abilities": {
            "STR": 17, "DEX": 14, "CON": 16,
            "INT": 8, "WIS": 10, "CHA": 8
        },
        "saveProficiencies": ["STR", "CON"],
        "skillProficiencies": ["Acrobatics", "Athletics", "Insight", "Medicine", "Nature", "Survival"],
        "skillExpertise": [],
        "proficiencies": {
            "armor": ["Light", "Medium", "Shields"],
            "weapons": ["Simple", "Martial"],
            "tools": ["Chariot"]
        },
        "combat": {
            "ac": 15,
            "acSource": "Unarmored Defense (10 + DEX + CON)",
            "hpMax": 25, "hpCurrent": 25, "hpTemp": 0,
            "hitDiceType": 12, "hitDiceRemaining": 2,
            "deathSaves": {"successes": 0, "failures": 0}
        },
        "attacks": [
            {
                "name": "Maul", "atkAbility": "STR",
                "damage": "2d6", "damageType": "bludgeoning",
                "properties": "Heavy, Two-Handed",
                "affectedByClassFeature": True
            },
            {
                "name": "Thundering Rush", "atkAbility": "STR",
                "damage": "d6", "damageType": "bludgeoning",
                "properties": "25ft run-up. Miss = prone.",
                "atkBonus": 2, "affectedByClassFeature": True
            },
            {
                "name": "Handaxe", "atkAbility": "STR",
                "damage": "d6", "damageType": "slashing",
                "properties": "Light, Throwable (20/60)",
                "affectedByClassFeature": True
            },
            {
                "name": "Javelin", "atkAbility": "STR",
                "damage": "d6", "damageType": "piercing",
                "properties": "Throwable (30/120)",
                "affectedByClassFeature": False
            }
        ],
        "features": [
            {"name": "Unarmored Defense", "source": "Barbarian", "desc": "AC = 10 + DEX mod + CON mod"},
            {"name": "Reckless Attack", "source": "Barbarian", "desc": "First attack of your turn: advantage on STR melee attacks, but attacks against you have advantage until your next turn."},
            {"name": "Danger Sense", "source": "Barbarian", "desc": "Advantage on DEX saving throws against effects you can see. Must not be blinded, deafened, or incapacitated."},
            {"name": "Ancestral Protectors", "source": "Subclass", "desc": "While raging, the first creature you hit each turn is harassed by spirits. It has disadvantage attacking anyone but you, and targets other than you have resistance to its damage until your next turn."},
            {"name": "Thundering Rush", "source": "Homebrew", "desc": "25ft straight-line run-up, then melee attack with expertise (+7 to hit). On miss, you fall prone. d6 + STR bludgeoning."},
            {"name": "Equine Build", "source": "Race", "desc": "Count as one size larger for carrying capacity and push/drag/lift. Climbing costs extra movement."}
        ],
        "classFeature": {
            "type": "rage",
            "maxUses": 2, "currentUses": 2, "active": False,
            "bonusDamage": 2,
            "resistances": ["bludgeoning", "piercing", "slashing"],
            "extraWhileActive": "Ancestral Protectors: first creature hit has disadvantage attacking others, others resist its damage"
        },
        "equipment": [
            "Maul", "Handaxe", "Javelin", "Lucky Charm", "Backpack",
            "Bedroll", "Mess kit", "Tinderbox", "10 torches",
            "9 days of rations", "Waterskin", "50 feet of rope"
        ],
        "coins": {"CP": 0, "SP": 0, "EP": 0, "GP": 128, "PP": 0},
        "customBoxes": [
            {
                "title": "Personality",
                "fields": [
                    {"label": "Trait", "value": "I get irritated if people praise someone else and not me."},
                    {"label": "Ideal", "value": "Competition. I strive to test myself in all things. (Chaotic)"},
                    {"label": "Bond", "value": "I will overcome a rival and prove myself their better."},
                    {"label": "Flaw", "value": "I ignore anyone who doesn't compete and anyone who loses to me."}
                ]
            },
            {
                "title": "Appearance",
                "fields": [
                    {"label": "Description", "value": "5'8\", bipedal horse-person with a powerful build."}
                ]
            }
        ],
        "spellcasting": None
    }

    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO dnd_characters (name, class_name, level, data) VALUES (?, ?, ?, ?)",
            ("Garden Opus", "Barbarian", 2, json.dumps(garden_opus)),
        )
        await db.commit()
        print("  [OK] Garden Opus seeded")
    finally:
        await db.close()


async def main():
    import sys
    print("LifeBoard Seed Script")
    print("=" * 40)

    if "--clear" in sys.argv:
        print("\nClearing existing data...")
        await clear_all()

    print("\nInitializing database...")
    await init_db()

    if "--config" in sys.argv or "--all" in sys.argv:
        print("\nSeeding user config...")
        await seed_config()

    # Seed functions only run if their tables are empty
    # This prevents destroying user data on subsequent runs
    if not await _has_data("finance_accounts"):
        print("\nSeeding Finance data...")
        await seed_finance()
        print("\nSeeding Finance cycle summaries...")
        await seed_cycle_summaries()
    else:
        print("\n[SKIP] Finance — data already exists")

    if not await _has_data("life_tasks"):
        print("\nSeeding Life Manager data...")
        await seed_life_manager()
    else:
        print("[SKIP] Life Manager — data already exists")

    if not await _has_data("health_profile"):
        print("\nSeeding Health & Body data...")
        await seed_health()
    else:
        print("[SKIP] Health & Body — data already exists")

    if not await _has_data("investing_accounts"):
        print("\nSeeding Investing data...")
        await seed_investing()
    else:
        print("[SKIP] Investing — data already exists")

    if not await _has_data("fleet_concerns"):
        print("\nSeeding Fleet (Dr. Fleet) data...")
        await seed_fleet()
    else:
        print("[SKIP] Fleet — data already exists")

    if not await _has_data("documents"):
        print("\nSeeding Documents...")
        # Re-run the document seeding from life_manager seed
        # (documents are seeded as part of seed_life_manager, check if they exist)
    else:
        print("[SKIP] Documents — data already exists")

    if not await _has_data("dnd_spells"):
        print("\nSeeding DnD Spell Library...")
        await seed_dnd_spells()
    else:
        print("[SKIP] DnD Spells -- data already exists")

    if not await _has_data("dnd_characters"):
        print("\nSeeding DnD Characters...")
        await seed_dnd()
        await seed_gandthalas()
    else:
        print("[SKIP] DnD Characters -- data already exists")

    print("\n" + "=" * 40)
    print("Done! Restart the backend to pick up changes.")


if __name__ == "__main__":
    asyncio.run(main())
