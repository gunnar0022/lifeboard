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

        # --- Events ---
        events = [
            ("Dentist checkup", (today + timedelta(days=5)).isoformat(), "14:00", "appointment", "Dr. Tanaka — routine cleaning"),
            ("Team dinner", (today + timedelta(days=2)).isoformat(), "19:00", "social", "Izakaya in Shibuya"),
            ("Package delivery", (today + timedelta(days=1)).isoformat(), "10:00", "reminder", "Amazon — electronics order"),
            ("Lease renewal deadline", (today + timedelta(days=14)).isoformat(), None, "deadline", "Current lease expires end of month"),
            ("Mom's birthday", (today + timedelta(days=10)).isoformat(), None, "reminder", "Don't forget the gift!"),
            ("Apartment inspection", (today + timedelta(days=21)).isoformat(), "11:00", "appointment", "Annual fire safety check"),
        ]
        for title, dt, time, cat, desc in events:
            await db.execute(
                "INSERT INTO life_events (title, date, time, category, description) VALUES (?, ?, ?, ?, ?)",
                [title, dt, time, cat, desc],
            )
        print(f"  [OK] Life Manager events ({len(events)})")

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


async def seed_reading_creative():
    """Seed Reading & Creative data — projects, files, books."""
    import shutil
    from pathlib import Path

    db = await get_db()
    creative_root = Path(__file__).parent.parent / "data" / "creative"

    # NEVER delete existing creative content — only create sample projects
    # if the directory is empty or doesn't exist
    creative_root.mkdir(parents=True, exist_ok=True)
    existing_projects = [d for d in creative_root.iterdir() if d.is_dir()] if creative_root.exists() else []
    if existing_projects:
        print(f"  [SKIP] Creative projects — {len(existing_projects)} projects already exist on disk")
        await db.close()
        return

    try:
        # --- Projects ---
        projects = [
            ("Post-Apoc World", "post-apoc-world", "Post-apocalyptic worldbuilding with a magic system based on symbols"),
            ("Living City", "living-city", "A city that grows and changes like a living organism"),
        ]
        for name, slug, desc in projects:
            await db.execute(
                "INSERT INTO creative_projects (name, slug, description) VALUES (?, ?, ?)",
                [name, slug, desc],
            )
            # Create folders
            (creative_root / slug).mkdir(parents=True, exist_ok=True)
            (creative_root / slug / "_ideas").mkdir(exist_ok=True)

        print(f"  [OK] Creative projects ({len(projects)})")

        # --- Sample files ---
        # Post-Apoc World
        (creative_root / "post-apoc-world" / "magic").mkdir(exist_ok=True)
        (creative_root / "post-apoc-world" / "magic" / "symbols.md").write_text(
            "# Symbol System\n\n"
            "The magic system is based on combining elemental symbols carved into stone or bone.\n\n"
            "## Base Symbols\n\n"
            "- **Bind** — connection, joining, sealing\n"
            "- **Release** — opening, freeing, dispersing\n"
            "- **Flow** — movement, direction, current\n"
            "- **Hold** — stasis, preservation, containment\n\n"
            "## Elemental Modifiers\n\n"
            "Each base symbol can be modified with an elemental suffix:\n"
            "- Air, Water, Fire, Earth\n\n"
            "Combinations create specific effects. For example, Bind + Air could create a vacuum seal.\n",
            encoding="utf-8",
        )
        (creative_root / "post-apoc-world" / "factions.md").write_text(
            "# Factions\n\n"
            "## The Mountain Cities\n\n"
            "Isolated settlements in the high ranges. They've preserved the most knowledge of the old symbol system. "
            "Their economy runs on preserved food and clean water, both maintained through symbol magic.\n\n"
            "## The Lowland Traders\n\n"
            "Nomadic groups that move between settlements. They carry news, goods, and — most importantly — "
            "new symbol combinations discovered in ruins.\n",
            encoding="utf-8",
        )
        (creative_root / "post-apoc-world" / "_ideas" / "2026-03-15_vacuum-preservation.md").write_text(
            "What if the bind symbol combined with air creates a vacuum? "
            "That could be how they preserve food in the mountain cities.\n",
            encoding="utf-8",
        )

        # Living City
        (creative_root / "living-city" / "districts.md").write_text(
            "# Districts\n\n"
            "The city is divided into districts that function like organs in a body.\n\n"
            "## The Market Heart\n\n"
            "The central bazaar. It pulses with activity during the day and contracts at night. "
            "The buildings themselves shift slightly to accommodate the flow of people.\n\n"
            "## The Guild Quarter\n\n"
            "Where the trade halls are. Each guild has its own building that reflects its craft — "
            "the blacksmiths' hall is warm and always slightly glowing.\n",
            encoding="utf-8",
        )
        (creative_root / "living-city" / "_ideas" / "2026-03-18_guild-izakaya.md").write_text(
            "What if the guild halls double as evening social spaces, like izakayas but tied to your trade.\n",
            encoding="utf-8",
        )

        # Index files
        file_entries = [
            (1, "post-apoc-world/_ideas", "_ideas", 1),
            (1, "post-apoc-world/magic", "magic", 1),
            (1, "post-apoc-world/magic/symbols.md", "symbols.md", 0),
            (1, "post-apoc-world/factions.md", "factions.md", 0),
            (1, "post-apoc-world/_ideas/2026-03-15_vacuum-preservation.md", "2026-03-15_vacuum-preservation.md", 0),
            (2, "living-city/_ideas", "_ideas", 1),
            (2, "living-city/districts.md", "districts.md", 0),
            (2, "living-city/_ideas/2026-03-18_guild-izakaya.md", "2026-03-18_guild-izakaya.md", 0),
        ]
        for pid, fpath, fname, is_dir in file_entries:
            await db.execute(
                "INSERT OR IGNORE INTO creative_file_index (project_id, file_path, file_name, is_directory) VALUES (?, ?, ?, ?)",
                [pid, fpath, fname, is_dir],
            )
        print(f"  [OK] Creative files ({len(file_entries)})")

        # --- Books ---
        books = [
            ("A Wizard of Earthsea", "Ursula K. Le Guin", "finished", None,
             "The prose is so restrained it forces you to fill in the emotional weight yourself.",
             "2026-02-20"),
            ("The Tombs of Atuan", "Ursula K. Le Guin", "finished", None,
             "Tenar's choice to leave wasn't about Ged — it was about refusing to be defined by the institution that raised her.",
             "2026-03-10"),
            ("The Left Hand of Darkness", "Ursula K. Le Guin", "reading", "Jake", None, None),
            ("The Dispossessed", "Ursula K. Le Guin", "to_read", "Jake", None, None),
            ("Piranesi", "Susanna Clarke", "to_read", None, None, None),
            ("The Name of the Wind", "Patrick Rothfuss", "to_read", "Online rec", None, None),
        ]
        for title, author, status, rec, reflection, date_fin in books:
            await db.execute(
                "INSERT INTO reading_books (title, author, status, recommended_by, reflection, date_finished) VALUES (?, ?, ?, ?, ?, ?)",
                [title, author, status, rec, reflection, date_fin],
            )
        print(f"  [OK] Reading books ({len(books)})")

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

    print("\nSeeding Finance data...")
    await seed_finance()

    print("\nSeeding Finance cycle summaries...")
    await seed_cycle_summaries()

    print("\nSeeding Life Manager data...")
    await seed_life_manager()

    print("\nSeeding Health & Body data...")
    await seed_health()

    print("\nSeeding Investing data...")
    await seed_investing()

    print("\nSeeding Fleet (Dr. Fleet) data...")
    await seed_fleet()

    print("\nSeeding Reading & Creative data...")
    await seed_reading_creative()

    print("\n" + "=" * 40)
    print("Done! Restart the backend to pick up changes.")


if __name__ == "__main__":
    asyncio.run(main())
