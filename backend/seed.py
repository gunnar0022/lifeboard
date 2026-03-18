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
        "active_agents": ["finance", "life_manager"],
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
            ("SMBC Checking", "bank", "JPY", 485000, 1),
            ("Rakuten Card", "wallet", "JPY", -32000, 2),
            ("Cash Wallet", "cash", "JPY", 15000, 3),
            ("Wise USD", "transfer_service", "USD", 120000, 4),  # $1,200
        ]
        for name, atype, curr, balance, sort in accounts:
            await db.execute(
                "INSERT INTO finance_accounts (name, account_type, currency, current_balance, sort_order) VALUES (?, ?, ?, ?, ?)",
                [name, atype, curr, balance, sort],
            )
        print("  [OK] Finance accounts (4)")

        # --- Budgets ---
        budgets = [
            ("food", 80000),
            ("transport", 15000),
            ("entertainment", 30000),
            ("shopping", 20000),
            ("health", 10000),
        ]
        for cat, limit in budgets:
            await db.execute(
                "INSERT INTO finance_budgets (category, monthly_limit) VALUES (?, ?)",
                [cat, limit],
            )
        print("  [OK] Finance budgets (5)")

        # --- Recurring ---
        recurring = [
            ("Apartment Rent", -95000, 1, "rent", "monthly", today.replace(day=28).isoformat(), 1),
            ("Softbank Mobile", -8500, 1, "utilities", "monthly", today.replace(day=15).isoformat(), 1),
            ("Netflix", -1490, 2, "entertainment", "monthly", today.replace(day=10).isoformat(), 1),
            ("Spotify", -980, 2, "entertainment", "monthly", today.replace(day=5).isoformat(), 1),
            ("Tokyo Gas", -4200, 1, "utilities", "monthly", today.replace(day=20).isoformat(), 0),
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
            (cycle_start.isoformat(), 380000, 1, "salary", "Monthly salary (net)"),
            # Food
            ((today - timedelta(days=1)).isoformat(), -1280, 1, "food", "Lawson lunch"),
            ((today - timedelta(days=2)).isoformat(), -3500, 1, "food", "Yakiniku dinner with friends"),
            ((today - timedelta(days=3)).isoformat(), -850, 1, "food", "FamilyMart onigiri & coffee"),
            ((today - timedelta(days=5)).isoformat(), -2200, 1, "food", "Sushi takeout"),
            ((today - timedelta(days=6)).isoformat(), -4500, 1, "food", "Weekly groceries — OK Store"),
            ((today - timedelta(days=8)).isoformat(), -1100, 1, "food", "Starbucks"),
            ((today - timedelta(days=10)).isoformat(), -950, 1, "food", "7-Eleven snacks"),
            ((today - timedelta(days=12)).isoformat(), -5800, 1, "food", "Groceries — LIFE supermarket"),
            ((today - timedelta(days=14)).isoformat(), -3200, 1, "food", "Ramen & gyoza"),
            ((today - timedelta(days=18)).isoformat(), -6000, 1, "food", "Big weekly grocery run"),
            # Transport
            ((today - timedelta(days=1)).isoformat(), -500, 3, "transport", "Suica top-up"),
            ((today - timedelta(days=7)).isoformat(), -2000, 3, "transport", "Suica top-up"),
            ((today - timedelta(days=15)).isoformat(), -5000, 1, "transport", "Monthly commuter pass top-up"),
            # Entertainment
            ((today - timedelta(days=4)).isoformat(), -1800, 2, "entertainment", "Kindle manga"),
            ((today - timedelta(days=9)).isoformat(), -2500, 1, "entertainment", "Movie ticket"),
            ((today - timedelta(days=20)).isoformat(), -3000, 1, "entertainment", "Karaoke"),
            # Shopping
            ((today - timedelta(days=3)).isoformat(), -6800, 2, "shopping", "Amazon — USB-C hub"),
            ((today - timedelta(days=11)).isoformat(), -3500, 2, "shopping", "Uniqlo basics"),
            # Rent & utilities
            ((today - timedelta(days=2)).isoformat(), -95000, 1, "rent", "March rent"),
            ((today - timedelta(days=5)).isoformat(), -8500, 1, "utilities", "Softbank mobile"),
            ((today - timedelta(days=10)).isoformat(), -1490, 2, "entertainment", "Netflix"),
            ((today - timedelta(days=5)).isoformat(), -980, 2, "entertainment", "Spotify"),
            # Health
            ((today - timedelta(days=13)).isoformat(), -2800, 1, "health", "Pharmacy — supplements"),
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

        # --- Documents ---
        documents = [
            ("Apartment Lease", "housing", (today + timedelta(days=180)).isoformat(), "2-year lease with Oakhouse. Renewal in September."),
            ("National Health Insurance Card", "insurance", (today + timedelta(days=270)).isoformat(), "NHI card — renewal around December."),
            ("Residence Card (Zairyu)", "legal", (today + timedelta(days=720)).isoformat(), "Zairyu card valid through 2028."),
            ("Employment Contract", "legal", None, "Current employment contract with TechCo Japan."),
            ("Renter's Insurance Policy", "insurance", (today + timedelta(days=300)).isoformat(), "JA Kyosai policy — fire + liability."),
            ("Passport", "legal", (today + timedelta(days=1000)).isoformat(), "Swedish passport — valid until 2029."),
        ]
        for name, cat, expiry, notes in documents:
            await db.execute(
                "INSERT INTO life_documents (name, category, expiry_date, notes) VALUES (?, ?, ?, ?)",
                [name, cat, expiry, notes],
            )
        print(f"  [OK] Life Manager documents ({len(documents)})")

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

        # Medical documents
        docs = [
            ("Annual health checkup 2025", "checkup", (today - timedelta(days=90)).isoformat(), "Tanaka Clinic", "All results normal"),
            ("Flu vaccination 2025", "vaccination", (today - timedelta(days=120)).isoformat(), "City Hospital", None),
        ]
        for name, cat, doc_date, provider, notes in docs:
            await db.execute(
                "INSERT INTO health_documents (name, category, date, provider, notes) VALUES (?, ?, ?, ?, ?)",
                [name, cat, doc_date, provider, notes],
            )

        await db.commit()
        print(f"  [OK] Health profile, {len(meals)} meals, {len(exercises)} exercises, 26 daily summaries, {len(docs)} medical docs")
    finally:
        await db.close()


async def clear_all():
    """Clear all data from all tables."""
    db = await get_db()
    try:
        await db.execute("PRAGMA foreign_keys=OFF")
        tables = [
            "finance_files", "finance_transactions", "finance_transfers",
            "finance_recurring", "finance_budgets", "finance_accounts",
            "life_files", "life_events", "life_tasks", "life_bills", "life_documents",
            "health_files", "health_documents", "health_measurements",
            "health_daily_summary", "health_exercises", "health_meals", "health_profile",
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

    print("\nSeeding Life Manager data...")
    await seed_life_manager()

    print("\nSeeding Health & Body data...")
    await seed_health()

    print("\n" + "=" * 40)
    print("Done! Restart the backend to pick up changes.")


if __name__ == "__main__":
    asyncio.run(main())
