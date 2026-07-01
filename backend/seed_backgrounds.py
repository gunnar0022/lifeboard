"""
Backgrounds-only seeder — scoped, idempotent, and safe to run on a live database.

It touches ONLY the `dnd_backgrounds` table: creates it if missing, then inserts
the starter background(s) with INSERT OR IGNORE (re-running never disturbs existing
rows or any other table). Nothing else in the database is read or written.

Only ONE demo background (Athlete) is seeded on purpose — the rest are cheap to add
by hand through the Encyclopedia's Backgrounds CRUD.

Run from the project root:
    python -m backend.seed_backgrounds
"""
import asyncio
import json

from backend.database import get_db

# Mirror of the dnd_backgrounds schema in database.py, so this seeder also works
# on a DB created before the table was added (without running full init_db).
_CREATE_BACKGROUNDS = """
CREATE TABLE IF NOT EXISTS dnd_backgrounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    skill_proficiencies TEXT NOT NULL DEFAULT '[]',
    tool_proficiencies TEXT NOT NULL DEFAULT '[]',
    languages TEXT NOT NULL DEFAULT '[]',
    equipment TEXT NOT NULL DEFAULT '[]',
    feature_name TEXT NOT NULL DEFAULT '',
    feature_desc TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'PHB',
    is_custom BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);
"""

# One canonical demo background. Structure over quantity — a template to copy.
_BACKGROUNDS = [
    {
        "name": "Athlete",
        "description": (
            "You trained your body to peak physical condition, competing in feats of "
            "strength, speed, and agility. Whether wrestler, runner, gladiator, or "
            "acrobat, you know both the roar of the crowd and the quiet discipline of "
            "relentless practice."
        ),
        "skill_proficiencies": ["Athletics", "Acrobatics"],
        "tool_proficiencies": [],
        "languages": ["One of your choice"],
        "equipment": [
            "A trophy from an athletic contest (a ribbon, a medal, or a bit of a "
            "wooden spar you broke)",
            "A bottle of liniment",
            "A bandage",
            "A set of common clothes",
            "A belt pouch containing 10 gp",
        ],
        "feature_name": "Echoes of Victory",
        "feature_desc": (
            "People are inclined to remember your past athletic triumphs, and you can "
            "trade on that fame. You know the local sports scene and can readily find "
            "fellow athletes, trainers, sponsors, and enthusiasts who might offer "
            "lodging, a friendly ear, or an introduction. You can also recall notable "
            "competitions, champions, and rivalries, and use that knowledge to strike "
            "up rapport with those who follow the games."
        ),
        "source": "SCAG",
        "is_custom": 0,
    },
]


async def main():
    db = await get_db()
    try:
        await db.execute(_CREATE_BACKGROUNDS)
        await db.commit()
        print("  [OK] dnd_backgrounds table ready")

        inserted = 0
        for bg in _BACKGROUNDS:
            cursor = await db.execute(
                """
                INSERT OR IGNORE INTO dnd_backgrounds
                    (name, description, skill_proficiencies, tool_proficiencies,
                     languages, equipment, feature_name, feature_desc, source, is_custom)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    bg["name"],
                    bg["description"],
                    json.dumps(bg["skill_proficiencies"]),
                    json.dumps(bg["tool_proficiencies"]),
                    json.dumps(bg["languages"]),
                    json.dumps(bg["equipment"]),
                    bg["feature_name"],
                    bg["feature_desc"],
                    bg["source"],
                    bg["is_custom"],
                ),
            )
            inserted += cursor.rowcount or 0
        await db.commit()
        print(f"  [OK] backgrounds seeded ({inserted} new, {len(_BACKGROUNDS) - inserted} already present)")
    finally:
        await db.close()

    print("Backgrounds seeding complete.")


if __name__ == "__main__":
    asyncio.run(main())
