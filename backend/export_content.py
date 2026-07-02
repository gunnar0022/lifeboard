"""
DnD content exporter — snapshots the authored "base game" libraries from the
live database into version-controlled JSON under backend/seed_data/.

This is the source-of-truth capture for device portability: the database is the
working store you edit in-app; running this script re-catches everything you've
authored (spells, items, feats, backgrounds, and the encyclopedia lore) into git
so a fresh install can restore it with seed_content.py.

Read-only and re-runnable. Row ids are preserved so cross-table references
(a character's item/spell refs) survive a restore. Volatile timestamp columns
are dropped to keep diffs clean.

Run from the project root:
    python -m backend.export_content
"""
import asyncio
import json
from pathlib import Path

from backend.database import get_db

SEED_DIR = Path(__file__).parent / "seed_data"

# Columns never worth snapshotting (regenerated on insert; only add diff noise).
_SKIP_COLS = {"created_at", "updated_at"}

# Content tables to snapshot. `order` gives a stable row order for clean diffs.
# `json_cols` are TEXT columns holding a JSON blob — decoded on export and
# re-encoded on restore so the seed files stay human-readable and diffable.
CONTENT_TABLES = [
    {"file": "dnd_spells.json",      "table": "dnd_spells",      "order": "level, name",
     "json_cols": ["classes"]},
    {"file": "dnd_items.json",       "table": "dnd_items",       "order": "kind, name",
     "json_cols": ["properties", "recharge", "data"]},
    {"file": "dnd_feats.json",       "table": "dnd_feats",       "order": "name",
     "json_cols": ["benefits", "asi"]},
    {"file": "dnd_backgrounds.json", "table": "dnd_backgrounds", "order": "name",
     "json_cols": ["skill_proficiencies", "tool_proficiencies", "languages", "equipment"]},
    {"file": "dnd_rules_lore.json",  "table": "dnd_rules_overrides", "order": "node_id",
     "json_cols": ["data"]},
]


def _decode_row(row, json_cols):
    """Row → plain dict, dropping volatile columns and decoding JSON blobs."""
    out = {}
    for key in row.keys():
        if key in _SKIP_COLS:
            continue
        val = row[key]
        if key in json_cols and isinstance(val, str):
            try:
                val = json.loads(val)
            except (ValueError, TypeError):
                pass  # leave malformed JSON as the raw string
        out[key] = val
    return out


async def export_all():
    SEED_DIR.mkdir(exist_ok=True)
    db = await get_db()
    try:
        for spec in CONTENT_TABLES:
            cursor = await db.execute(
                f"SELECT * FROM {spec['table']} ORDER BY {spec['order']}"
            )
            rows = await cursor.fetchall()
            data = [_decode_row(r, spec["json_cols"]) for r in rows]
            path = SEED_DIR / spec["file"]
            path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
            print(f"  [OK] {len(data):4d} rows -> seed_data/{spec['file']}")
    finally:
        await db.close()


if __name__ == "__main__":
    print("Exporting DnD content libraries to backend/seed_data/ ...")
    asyncio.run(export_all())
    print("Done.")
