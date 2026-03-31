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


# ── Spell Library ───────────────────────────────────────────

@router.get("/spells")
async def list_spells(q: str = "", level: int = None, limit: int = 20):
    """Search/list spells from the library."""
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

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = (
            f"SELECT id, name, level, damage, range, concentration, casting_time "
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
                components, spell_type, damage, save_type, save_effect, description, upcast, source)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
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
               save_type=?, save_effect=?, description=?, upcast=?, source=?
               WHERE id=?""",
            (
                body.get("name", ""), body.get("level", 0),
                body.get("casting_time", "1 action"), body.get("range", ""),
                body.get("aoe"), body.get("duration", "Instantaneous"),
                1 if body.get("concentration") else 0,
                1 if body.get("ritual") else 0,
                body.get("components", ""), body.get("spell_type", "utility"),
                body.get("damage"), body.get("save_type"), body.get("save_effect"),
                body.get("description", ""), body.get("upcast"), body.get("source", "PHB"),
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
