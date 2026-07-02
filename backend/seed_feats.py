"""
Feats-only seeder — scoped, idempotent, and safe to run on a live database.

It touches ONLY the `dnd_feats` table: it creates the table if it doesn't exist,
then inserts the starter feats with INSERT OR IGNORE (so re-running never disturbs
existing rows or any other table). Nothing else in the database is read or written.

Run from the project root:
    python -m backend.seed_feats
"""
import asyncio

from backend.database import get_db
from backend.export_content import CONTENT_TABLES
from backend.seed_content import load_table

_FEATS_SPEC = next(s for s in CONTENT_TABLES if s["table"] == "dnd_feats")

# Mirror of the dnd_feats schema in database.py, so this seeder also works on a
# DB created before the feats table was added (without running full init_db).
_CREATE_FEATS = """
CREATE TABLE IF NOT EXISTS dnd_feats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    prerequisite TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    benefits TEXT NOT NULL DEFAULT '[]',
    asi TEXT NOT NULL DEFAULT '{}',
    repeatable BOOLEAN NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'PHB',
    is_custom BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);
"""


async def main():
    db = await get_db()
    try:
        await db.execute(_CREATE_FEATS)
        await db.commit()
        print("  [OK] dnd_feats table ready")
        # Load the feats from the git-tracked JSON snapshot (INSERT OR IGNORE).
        await load_table(db, _FEATS_SPEC)
        print("Feats seeding complete.")
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(main())
