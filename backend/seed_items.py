"""
Items-only seeder — scoped, idempotent, and safe to run on a live database.

Touches ONLY the `dnd_items` table: creates it if missing, then inserts the
library (weapons, armor, ammo, the level-1 adventuring-pack gear, consumables,
magic items) with INSERT OR IGNORE, so re-running only adds what's not already
there and never disturbs existing rows or any other table.

Run from the project root:
    python -m backend.seed_items
"""
import asyncio

from backend.database import get_db
from backend.export_content import CONTENT_TABLES
from backend.seed_content import load_table

_ITEMS_SPEC = next(s for s in CONTENT_TABLES if s["table"] == "dnd_items")

# Mirror of the dnd_items schema in database.py, so this seeder also works on a
# DB created before the items table existed (without running full init_db).
_CREATE_ITEMS = """
CREATE TABLE IF NOT EXISTS dnd_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'gear',
    subtype TEXT NOT NULL DEFAULT '',
    rarity TEXT NOT NULL DEFAULT 'common',
    description TEXT NOT NULL DEFAULT '',
    properties TEXT NOT NULL DEFAULT '[]',
    damage_dice TEXT DEFAULT NULL,
    damage_type TEXT DEFAULT NULL,
    versatile_dice TEXT DEFAULT NULL,
    weapon_range TEXT DEFAULT NULL,
    range_normal TEXT DEFAULT NULL,
    default_ability TEXT DEFAULT NULL,
    base_ac INTEGER DEFAULT NULL,
    dex_cap INTEGER DEFAULT NULL,
    strength_req INTEGER DEFAULT 0,
    stealth_disadvantage BOOLEAN NOT NULL DEFAULT 0,
    has_charges BOOLEAN NOT NULL DEFAULT 0,
    max_charges INTEGER NOT NULL DEFAULT 0,
    recharge TEXT DEFAULT NULL,
    has_toggle BOOLEAN NOT NULL DEFAULT 0,
    weight REAL NOT NULL DEFAULT 0,
    cost TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'PHB',
    data TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);
"""


async def main():
    db = await get_db()
    try:
        await db.execute(_CREATE_ITEMS)
        await db.commit()
        print("  [OK] dnd_items table ready")
        # Load the items from the git-tracked JSON snapshot (INSERT OR IGNORE).
        await load_table(db, _ITEMS_SPEC)
        print("Items seeding complete.")
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(main())
