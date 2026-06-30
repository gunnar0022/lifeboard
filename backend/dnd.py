"""DnD Character Sheet — CRUD API routes for characters and spell library."""
import json
import logging
from fastapi import APIRouter, HTTPException
from backend.database import get_db

logger = logging.getLogger("lifeboard")

router = APIRouter(prefix="/api/dnd", tags=["dnd"])


# ── Characters ──────────────────────────────────────────────

@router.get("/characters")
async def list_characters():
    """List all characters (summary only)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, name, class_name, level, updated_at "
            "FROM dnd_characters ORDER BY updated_at DESC"
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


@router.get("/characters/{character_id}")
async def get_character(character_id: int):
    """Get full character data."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM dnd_characters WHERE id = ?", (character_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(404, "Character not found")
        result = dict(row)
        result["data"] = json.loads(result["data"])
        return result
    finally:
        await db.close()


@router.post("/characters")
async def create_character(body: dict):
    """Create a new character."""
    data = body.get("data", {})
    meta = data.get("meta", {})
    name = meta.get("name", "New Character")
    class_name = meta.get("className", "")
    level = meta.get("level", 1)

    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO dnd_characters (name, class_name, level, data) VALUES (?, ?, ?, ?)",
            (name, class_name, level, json.dumps(data)),
        )
        await db.commit()
        new_id = cursor.lastrowid
        return {"id": new_id, "name": name, "class_name": class_name, "level": level}
    finally:
        await db.close()


@router.put("/characters/{character_id}")
async def update_character(character_id: int, body: dict):
    """Update a character (full data replacement)."""
    data = body.get("data", {})
    meta = data.get("meta", {})
    name = meta.get("name", "New Character")
    class_name = meta.get("className", "")
    level = meta.get("level", 1)

    db = await get_db()
    try:
        cursor = await db.execute(
            "UPDATE dnd_characters SET name=?, class_name=?, level=?, data=?, "
            "updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (name, class_name, level, json.dumps(data), character_id),
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Character not found")
        return {"success": True}
    finally:
        await db.close()


@router.delete("/characters/{character_id}")
async def delete_character(character_id: int):
    """Delete a character."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM dnd_characters WHERE id = ?", (character_id,)
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Character not found")
        return {"success": True}
    finally:
        await db.close()


# ── Rules-tree lore overrides ───────────────────────────────
# The encyclopedia's flavor text (overview, tagline, lore sections) ships as
# static defaults in the JS rules tree. These endpoints let the user edit that
# fluff in-app and persist per-node overrides, which the client merges over the
# defaults at read time. Mechanical data (traits, progression) is NOT stored
# here — only the editable prose.

@router.get("/rules-overrides")
async def list_rules_overrides():
    """All lore overrides as a map of node_id → override object."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT node_id, data FROM dnd_rules_overrides")
        rows = await cursor.fetchall()
        return {r["node_id"]: json.loads(r["data"]) for r in rows}
    finally:
        await db.close()


@router.put("/rules-overrides/{node_id}")
async def put_rules_override(node_id: str, body: dict):
    """Upsert the lore override for a node. Body is the override object
    (e.g. { tagline, overview, lore: { physical, lifespan, ... } })."""
    payload = json.dumps(body or {})
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO dnd_rules_overrides (node_id, data, updated_at)
               VALUES (?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(node_id) DO UPDATE SET data=excluded.data,
                                                  updated_at=CURRENT_TIMESTAMP""",
            (node_id, payload),
        )
        await db.commit()
        return {"success": True}
    finally:
        await db.close()


# ── Spell Library ───────────────────────────────────────────

@router.get("/spells")
async def list_spells(
    q: str = "",
    level: int = None,
    level_min: int = None,
    level_max: int = None,
    cls: str = None,
    casting_time: str = None,
    limit: int = 20,
):
    """Search/list spells from the library.

    Filters (all optional, AND-combined):
      q            name contains
      level        exact level (kept for the Add-Spell modal)
      level_min    level >= (the encyclopedia's cantrip→X range)
      level_max    level <=
      cls          class tag — matches the JSON `classes` array (e.g. 'wizard')
      casting_time exact casting time string
    """
    db = await get_db()
    try:
        conditions = []
        params = []
        if q:
            conditions.append("name LIKE ?")
            params.append(f"%{q}%")
        if level is not None:
            conditions.append("level = ?")
            params.append(level)
        if level_min is not None:
            conditions.append("level >= ?")
            params.append(level_min)
        if level_max is not None:
            conditions.append("level <= ?")
            params.append(level_max)
        if casting_time:
            conditions.append("casting_time = ?")
            params.append(casting_time)
        if cls:
            # `classes` is a JSON array string like '["wizard","sorcerer"]';
            # match the quoted token so 'wizard' doesn't hit 'wizardry' etc.
            conditions.append("classes LIKE ?")
            params.append(f'%"{cls}"%')

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = (
            f"SELECT id, name, level, damage, range, concentration, casting_time, classes "
            f"FROM dnd_spells {where} ORDER BY level, name LIMIT ?"
        )
        params.append(limit)
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


@router.get("/spells/{spell_id}")
async def get_spell(spell_id: int):
    """Get full spell details."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM dnd_spells WHERE id = ?", (spell_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(404, "Spell not found")
        return dict(row)
    finally:
        await db.close()


@router.post("/spells")
async def create_spell(body: dict):
    """Create a spell (upsert — returns existing if name+level match)."""
    name = body.get("name", "")
    level = body.get("level", 0)

    db = await get_db()
    try:
        # Check for existing
        cursor = await db.execute(
            "SELECT * FROM dnd_spells WHERE name = ? AND level = ?", (name, level)
        )
        existing = await cursor.fetchone()
        if existing:
            return dict(existing)

        await db.execute(
            """INSERT INTO dnd_spells
               (name, level, casting_time, range, aoe, duration, concentration, ritual,
                components, spell_type, damage, save_type, save_effect, description, upcast,
                scaling_kind, scaling_per_level, classes, source)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                name, level,
                body.get("casting_time", "1 action"),
                body.get("range", ""),
                body.get("aoe"),
                body.get("duration", "Instantaneous"),
                1 if body.get("concentration") else 0,
                1 if body.get("ritual") else 0,
                body.get("components", ""),
                body.get("spell_type", "utility"),
                body.get("damage"),
                body.get("save_type"),
                body.get("save_effect"),
                body.get("description", ""),
                body.get("upcast"),
                body.get("scaling_kind") or None,
                body.get("scaling_per_level") or None,
                json.dumps(body.get("classes") or []),
                body.get("source", "PHB"),
            ),
        )
        await db.commit()
        cursor = await db.execute(
            "SELECT * FROM dnd_spells WHERE name = ? AND level = ?", (name, level)
        )
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()


@router.put("/spells/{spell_id}")
async def update_spell(spell_id: int, body: dict):
    """Update a spell in the library."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """UPDATE dnd_spells SET
               name=?, level=?, casting_time=?, range=?, aoe=?, duration=?,
               concentration=?, ritual=?, components=?, spell_type=?, damage=?,
               save_type=?, save_effect=?, description=?, upcast=?,
               scaling_kind=?, scaling_per_level=?, classes=?, source=?
               WHERE id=?""",
            (
                body.get("name", ""), body.get("level", 0),
                body.get("casting_time", "1 action"), body.get("range", ""),
                body.get("aoe"), body.get("duration", "Instantaneous"),
                1 if body.get("concentration") else 0,
                1 if body.get("ritual") else 0,
                body.get("components", ""), body.get("spell_type", "utility"),
                body.get("damage"), body.get("save_type"), body.get("save_effect"),
                body.get("description", ""), body.get("upcast"),
                body.get("scaling_kind") or None, body.get("scaling_per_level") or None,
                json.dumps(body.get("classes") or []),
                body.get("source", "PHB"),
                spell_id,
            ),
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Spell not found")
        return {"success": True}
    finally:
        await db.close()


@router.delete("/spells/{spell_id}")
async def delete_spell(spell_id: int):
    """Delete a spell from the library."""
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM dnd_spells WHERE id = ?", (spell_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Spell not found")
        return {"success": True}
    finally:
        await db.close()


@router.post("/spells/batch")
async def batch_spells(body: dict):
    """Get multiple spells by ID."""
    ids = body.get("ids", [])
    if not ids:
        return []
    db = await get_db()
    try:
        placeholders = ",".join("?" * len(ids))
        cursor = await db.execute(
            f"SELECT * FROM dnd_spells WHERE id IN ({placeholders})", ids
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


# ── Items Library (weapons, armor, ammo, consumables, magic) ──────────────

# Columns whose stored value is a JSON blob (decoded on read, encoded on write).
_ITEM_JSON_FIELDS = ("properties", "recharge", "data")
# Columns stored as 0/1 integers.
_ITEM_BOOL_FIELDS = ("stealth_disadvantage", "has_charges", "has_toggle")
# Every writable column, in insert order.
_ITEM_COLUMNS = (
    "name", "kind", "subtype", "rarity", "description", "properties",
    "damage_dice", "damage_type", "versatile_dice", "weapon_range",
    "range_normal", "default_ability", "base_ac", "dex_cap", "strength_req",
    "stealth_disadvantage", "has_charges", "max_charges", "recharge",
    "has_toggle", "weight", "cost", "source", "data",
)
_ITEM_DEFAULTS = {
    "name": "", "kind": "gear", "subtype": "", "rarity": "common",
    "description": "", "properties": [], "strength_req": 0,
    "stealth_disadvantage": 0, "has_charges": 0, "max_charges": 0,
    "recharge": None, "has_toggle": 0, "weight": 0, "cost": "",
    "source": "PHB", "data": {},
}


def _item_row(row):
    """Decode a DB row into an API dict (JSON fields parsed, bools as bools)."""
    d = dict(row)
    for k in _ITEM_JSON_FIELDS:
        if isinstance(d.get(k), str):
            try:
                d[k] = json.loads(d[k])
            except (ValueError, TypeError):
                d[k] = None
    for k in _ITEM_BOOL_FIELDS:
        d[k] = bool(d.get(k))
    return d


def _item_value(body, col):
    """Coerce one column's value from a request body for storage."""
    val = body.get(col, _ITEM_DEFAULTS.get(col))
    if col in _ITEM_JSON_FIELDS:
        return json.dumps(val) if val is not None else None
    if col in _ITEM_BOOL_FIELDS:
        return 1 if val else 0
    return val


@router.get("/items")
async def list_items(q: str = "", kind: str = None, limit: int = 200):
    """Search/list items from the library (optional name + kind filters)."""
    db = await get_db()
    try:
        conditions, params = [], []
        if q:
            conditions.append("name LIKE ?")
            params.append(f"%{q}%")
        if kind:
            conditions.append("kind = ?")
            params.append(kind)
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        params.append(limit)
        cursor = await db.execute(
            f"SELECT * FROM dnd_items {where} ORDER BY kind, name LIMIT ?", params
        )
        return [_item_row(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


@router.get("/items/{item_id}")
async def get_item(item_id: int):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM dnd_items WHERE id = ?", (item_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(404, "Item not found")
        return _item_row(row)
    finally:
        await db.close()


@router.post("/items")
async def create_item(body: dict):
    """Create an item (upsert by name — returns existing if the name matches)."""
    name = body.get("name", "")
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM dnd_items WHERE name = ?", (name,))
        existing = await cursor.fetchone()
        if existing:
            return _item_row(existing)

        placeholders = ", ".join("?" * len(_ITEM_COLUMNS))
        values = [_item_value(body, col) for col in _ITEM_COLUMNS]
        cursor = await db.execute(
            f"INSERT INTO dnd_items ({', '.join(_ITEM_COLUMNS)}) VALUES ({placeholders})",
            values,
        )
        await db.commit()
        cursor = await db.execute("SELECT * FROM dnd_items WHERE id = ?", (cursor.lastrowid,))
        return _item_row(await cursor.fetchone())
    finally:
        await db.close()


@router.put("/items/{item_id}")
async def update_item(item_id: int, body: dict):
    """Update an item; only the columns present in the body are changed."""
    db = await get_db()
    try:
        sets, vals = [], []
        for col in _ITEM_COLUMNS:
            if col in body:
                sets.append(f"{col} = ?")
                vals.append(_item_value(body, col))
        if not sets:
            raise HTTPException(400, "No fields to update")
        vals.append(item_id)
        cursor = await db.execute(
            f"UPDATE dnd_items SET {', '.join(sets)} WHERE id = ?", vals
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Item not found")
        cursor = await db.execute("SELECT * FROM dnd_items WHERE id = ?", (item_id,))
        return _item_row(await cursor.fetchone())
    finally:
        await db.close()


@router.delete("/items/{item_id}")
async def delete_item(item_id: int):
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM dnd_items WHERE id = ?", (item_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Item not found")
        return {"success": True}
    finally:
        await db.close()


@router.post("/items/batch")
async def batch_items(body: dict):
    """Resolve multiple items by ID (for the equipment item cache)."""
    ids = body.get("ids", [])
    if not ids:
        return []
    db = await get_db()
    try:
        placeholders = ",".join("?" * len(ids))
        cursor = await db.execute(
            f"SELECT * FROM dnd_items WHERE id IN ({placeholders})", ids
        )
        return [_item_row(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


# ── Feats Library (browsable + custom homebrew) ──────────────────────────
# Mirrors the spells/items libraries: a searchable list with custom-create. The
# `benefits` column is a JSON array of bullet strings; `asi` is a JSON object
# describing any ability-score rider, e.g.
#   {}                                      no ASI
#   {"fixed": {"CON": 1}}                   +1 to a specific ability
#   {"choose": ["STR","DEX"], "amount": 1}  +1 to one of a set (player picks)

_FEAT_JSON_FIELDS = ("benefits", "asi")
_FEAT_BOOL_FIELDS = ("repeatable", "is_custom")
_FEAT_COLUMNS = (
    "name", "prerequisite", "description", "benefits", "asi",
    "repeatable", "source", "is_custom",
)
_FEAT_DEFAULTS = {
    "prerequisite": "", "description": "", "benefits": [], "asi": {},
    "repeatable": 0, "source": "PHB", "is_custom": 0,
}


def _feat_row(row):
    d = dict(row)
    for k in _FEAT_JSON_FIELDS:
        if isinstance(d.get(k), str):
            try:
                d[k] = json.loads(d[k])
            except (ValueError, TypeError):
                d[k] = None
    for k in _FEAT_BOOL_FIELDS:
        d[k] = bool(d.get(k))
    return d


def _feat_value(body, col):
    val = body.get(col, _FEAT_DEFAULTS.get(col))
    if col in _FEAT_JSON_FIELDS:
        return json.dumps(val) if val is not None else None
    if col in _FEAT_BOOL_FIELDS:
        return 1 if val else 0
    return val


@router.get("/feats")
async def list_feats(q: str = "", limit: int = 200):
    """Search/list feats from the library (optional name/description filter)."""
    db = await get_db()
    try:
        conditions, params = [], []
        if q:
            conditions.append("(name LIKE ? OR description LIKE ?)")
            params.extend([f"%{q}%", f"%{q}%"])
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        params.append(limit)
        cursor = await db.execute(
            f"SELECT * FROM dnd_feats {where} ORDER BY name LIMIT ?", params
        )
        return [_feat_row(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


@router.get("/feats/{feat_id}")
async def get_feat(feat_id: int):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM dnd_feats WHERE id = ?", (feat_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(404, "Feat not found")
        return _feat_row(row)
    finally:
        await db.close()


@router.post("/feats")
async def create_feat(body: dict):
    """Create a feat (upsert by name — returns existing if the name matches)."""
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "Feat name is required")
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM dnd_feats WHERE name = ?", (name,))
        existing = await cursor.fetchone()
        if existing:
            return _feat_row(existing)
        body = {**body, "name": name}
        placeholders = ", ".join("?" * len(_FEAT_COLUMNS))
        values = [_feat_value(body, col) for col in _FEAT_COLUMNS]
        cursor = await db.execute(
            f"INSERT INTO dnd_feats ({', '.join(_FEAT_COLUMNS)}) VALUES ({placeholders})",
            values,
        )
        await db.commit()
        cursor = await db.execute("SELECT * FROM dnd_feats WHERE id = ?", (cursor.lastrowid,))
        return _feat_row(await cursor.fetchone())
    finally:
        await db.close()


@router.put("/feats/{feat_id}")
async def update_feat(feat_id: int, body: dict):
    """Update a feat; only the columns present in the body are changed."""
    db = await get_db()
    try:
        sets, vals = [], []
        for col in _FEAT_COLUMNS:
            if col in body:
                sets.append(f"{col} = ?")
                vals.append(_feat_value(body, col))
        if not sets:
            raise HTTPException(400, "No fields to update")
        vals.append(feat_id)
        cursor = await db.execute(
            f"UPDATE dnd_feats SET {', '.join(sets)} WHERE id = ?", vals
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Feat not found")
        cursor = await db.execute("SELECT * FROM dnd_feats WHERE id = ?", (feat_id,))
        return _feat_row(await cursor.fetchone())
    finally:
        await db.close()


@router.delete("/feats/{feat_id}")
async def delete_feat(feat_id: int):
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM dnd_feats WHERE id = ?", (feat_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Feat not found")
        return {"success": True}
    finally:
        await db.close()


@router.post("/feats/batch")
async def batch_feats(body: dict):
    """Resolve multiple feats by ID (for the character feat cache)."""
    ids = body.get("ids", [])
    if not ids:
        return []
    db = await get_db()
    try:
        placeholders = ",".join("?" * len(ids))
        cursor = await db.execute(
            f"SELECT * FROM dnd_feats WHERE id IN ({placeholders})", ids
        )
        return [_feat_row(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


# ── Beast Forms ──────────────────────────────────────────

@router.get("/beast-forms")
async def list_beast_forms():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM dnd_beast_forms ORDER BY name ASC")
        rows = await cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["speeds"] = json.loads(d["speeds"]) if isinstance(d["speeds"], str) else d["speeds"]
            d["ability_scores"] = json.loads(d["ability_scores"]) if isinstance(d["ability_scores"], str) else d["ability_scores"]
            d["attacks"] = json.loads(d["attacks"]) if isinstance(d["attacks"], str) else d["attacks"]
            d["special_abilities"] = json.loads(d["special_abilities"]) if isinstance(d["special_abilities"], str) else d["special_abilities"]
            result.append(d)
        return result
    finally:
        await db.close()


@router.post("/beast-forms")
async def create_beast_form(body: dict):
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO dnd_beast_forms (name, cr, hp, ac, speeds, ability_scores, attacks, special_abilities, senses)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                body.get("name", "Beast"),
                body.get("cr", "0"),
                body.get("hp", 10),
                body.get("ac", 10),
                json.dumps(body.get("speeds", {"walk": 30})),
                json.dumps(body.get("ability_scores", {"STR": 10, "DEX": 10, "CON": 10})),
                json.dumps(body.get("attacks", [])),
                json.dumps(body.get("special_abilities", [])),
                body.get("senses"),
            ),
        )
        await db.commit()
        new_id = cursor.lastrowid
        cursor = await db.execute("SELECT * FROM dnd_beast_forms WHERE id = ?", (new_id,))
        row = dict(await cursor.fetchone())
        for k in ("speeds", "ability_scores", "attacks", "special_abilities"):
            if isinstance(row[k], str):
                row[k] = json.loads(row[k])
        return row
    finally:
        await db.close()


@router.put("/beast-forms/{form_id}")
async def update_beast_form(form_id: int, body: dict):
    db = await get_db()
    try:
        sets, vals = [], []
        for k in ("name", "cr", "hp", "ac", "senses"):
            if k in body:
                sets.append(f"{k} = ?")
                vals.append(body[k])
        for k in ("speeds", "ability_scores", "attacks", "special_abilities"):
            if k in body:
                sets.append(f"{k} = ?")
                vals.append(json.dumps(body[k]))
        if not sets:
            raise HTTPException(400, "No fields to update")
        vals.append(form_id)
        cursor = await db.execute(f"UPDATE dnd_beast_forms SET {', '.join(sets)} WHERE id = ?", vals)
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Beast form not found")
        cursor = await db.execute("SELECT * FROM dnd_beast_forms WHERE id = ?", (form_id,))
        row = dict(await cursor.fetchone())
        for k in ("speeds", "ability_scores", "attacks", "special_abilities"):
            if isinstance(row[k], str):
                row[k] = json.loads(row[k])
        return row
    finally:
        await db.close()


@router.delete("/beast-forms/{form_id}")
async def delete_beast_form(form_id: int):
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM dnd_beast_forms WHERE id = ?", (form_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Beast form not found")
        return {"success": True}
    finally:
        await db.close()


# ── Campaigns ───────────────────────────────────────────

@router.get("/campaigns")
async def list_campaigns():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, name, color, updated_at FROM dnd_campaigns ORDER BY updated_at DESC"
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: int):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM dnd_campaigns WHERE id = ?", (campaign_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(404, "Campaign not found")
        return dict(row)
    finally:
        await db.close()


@router.post("/campaigns")
async def create_campaign(body: dict):
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO dnd_campaigns (name, color) VALUES (?, ?)",
            (body.get("name", "New Campaign"), body.get("color", "#c9a96e")),
        )
        await db.commit()
        new_id = cursor.lastrowid
        cursor = await db.execute("SELECT * FROM dnd_campaigns WHERE id = ?", (new_id,))
        return dict(await cursor.fetchone())
    finally:
        await db.close()


@router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: int, body: dict):
    db = await get_db()
    try:
        sets, vals = [], []
        for k in ("name", "color"):
            if k in body:
                sets.append(f"{k} = ?")
                vals.append(body[k])
        if not sets:
            raise HTTPException(400, "No fields to update")
        sets.append("updated_at = CURRENT_TIMESTAMP")
        vals.append(campaign_id)
        cursor = await db.execute(
            f"UPDATE dnd_campaigns SET {', '.join(sets)} WHERE id = ?", vals
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Campaign not found")
        cursor = await db.execute("SELECT * FROM dnd_campaigns WHERE id = ?", (campaign_id,))
        return dict(await cursor.fetchone())
    finally:
        await db.close()


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: int):
    db = await get_db()
    try:
        await db.execute("PRAGMA foreign_keys = ON")
        cursor = await db.execute("DELETE FROM dnd_campaigns WHERE id = ?", (campaign_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Campaign not found")
        return {"success": True}
    finally:
        await db.close()


# ── Campaign Notes ──────────────────────────────────────

@router.get("/campaigns/{campaign_id}/notes")
async def list_campaign_notes(campaign_id: int, type: str = None):
    db = await get_db()
    try:
        if type:
            cursor = await db.execute(
                "SELECT * FROM dnd_campaign_notes WHERE campaign_id = ? AND type = ? ORDER BY updated_at DESC",
                (campaign_id, type),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM dnd_campaign_notes WHERE campaign_id = ? ORDER BY updated_at DESC",
                (campaign_id,),
            )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


@router.post("/campaigns/{campaign_id}/notes")
async def create_campaign_note(campaign_id: int, body: dict):
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO dnd_campaign_notes (campaign_id, type, title, body) VALUES (?, ?, ?, ?)",
            (campaign_id, body.get("type", "note"), body.get("title", ""), body.get("body", "")),
        )
        await db.commit()
        new_id = cursor.lastrowid
        cursor = await db.execute("SELECT * FROM dnd_campaign_notes WHERE id = ?", (new_id,))
        return dict(await cursor.fetchone())
    finally:
        await db.close()


@router.put("/campaigns/{campaign_id}/notes/{note_id}")
async def update_campaign_note(campaign_id: int, note_id: int, body: dict):
    db = await get_db()
    try:
        sets, vals = [], []
        for k in ("type", "title", "body"):
            if k in body:
                sets.append(f"{k} = ?")
                vals.append(body[k])
        if not sets:
            raise HTTPException(400, "No fields to update")
        sets.append("updated_at = CURRENT_TIMESTAMP")
        vals.extend([campaign_id, note_id])
        cursor = await db.execute(
            f"UPDATE dnd_campaign_notes SET {', '.join(sets)} WHERE campaign_id = ? AND id = ?", vals
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Note not found")
        cursor = await db.execute("SELECT * FROM dnd_campaign_notes WHERE id = ?", (note_id,))
        return dict(await cursor.fetchone())
    finally:
        await db.close()


@router.delete("/campaigns/{campaign_id}/notes/{note_id}")
async def delete_campaign_note(campaign_id: int, note_id: int):
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM dnd_campaign_notes WHERE campaign_id = ? AND id = ?",
            (campaign_id, note_id),
        )
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Note not found")
        return {"success": True}
    finally:
        await db.close()
