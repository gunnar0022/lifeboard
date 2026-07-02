"""
DnD content loader — restores the authored "base game" libraries from the
git-tracked JSON in backend/seed_data/ into the database.

This is the inverse of export_content.py and the single canonical seed path for
DnD content (spells, items, feats, backgrounds, and encyclopedia lore),
replacing the old hardcoded Python lists. Rows are inserted with INSERT OR
IGNORE keyed on their natural unique key (id / name / node_id), so it is safe to
run on a fresh database (full restore) or an existing one (tops up only what's
missing — never clobbers your in-app edits).

Run from the project root:
    python -m backend.seed_content
"""
import asyncio
import json

from backend.database import get_db, init_db
# Reuse the export spec so the two stay in lockstep (same tables, same JSON cols).
from backend.export_content import CONTENT_TABLES, SEED_DIR


def _encode_row(row, json_cols):
    """Re-encode the decoded JSON columns back to TEXT for storage."""
    out = {}
    for k, v in row.items():
        if k in json_cols and not isinstance(v, str):
            v = json.dumps(v, ensure_ascii=False)
        out[k] = v
    return out


async def load_table(db, spec):
    path = SEED_DIR / spec["file"]
    if not path.exists():
        print(f"  [skip] {spec['table']}: seed_data/{spec['file']} not found")
        return
    rows = json.loads(path.read_text())
    for raw in rows:
        row = _encode_row(raw, spec["json_cols"])
        cols = list(row.keys())
        placeholders = ", ".join("?" * len(cols))
        await db.execute(
            f"INSERT OR IGNORE INTO {spec['table']} ({', '.join(cols)}) VALUES ({placeholders})",
            [row[c] for c in cols],
        )
    await db.commit()
    print(f"  [OK] {spec['table']}: {len(rows)} rows from seed_data/{spec['file']}")


async def seed_content(db=None):
    owns = db is None
    if owns:
        db = await get_db()
    try:
        for spec in CONTENT_TABLES:
            await load_table(db, spec)
    finally:
        if owns:
            await db.close()


async def main():
    await init_db()  # ensure the content tables exist on a fresh database
    print("Loading DnD content libraries from backend/seed_data/ ...")
    await seed_content()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
