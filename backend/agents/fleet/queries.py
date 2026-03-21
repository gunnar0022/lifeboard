"""
Dr. Fleet — SQL query functions.
Raw SQL with aiosqlite (no ORM per LM-01).
Read/write access to fleet_concerns, fleet_concern_logs, fleet_visits.
Read access to health_* tables for medical briefing assembly.
"""
import json
from datetime import date, datetime, timedelta
from backend.database import get_db


# --- Concerns ---

async def get_active_concerns() -> list[dict]:
    """Get all active concerns with their log history."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM fleet_concerns WHERE status = 'active' ORDER BY created_at DESC"
        )
        concerns = [dict(r) for r in await cursor.fetchall()]

        for c in concerns:
            log_cursor = await db.execute(
                "SELECT * FROM fleet_concern_logs WHERE concern_id = ? ORDER BY created_at ASC",
                (c["id"],),
            )
            c["logs"] = [dict(r) for r in await log_cursor.fetchall()]

        return concerns
    finally:
        await db.close()


async def get_resolved_concerns() -> list[dict]:
    """Get resolved concerns (title, description, resolution summary, no logs)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT id, title, description, status, created_at, resolved_at,
                      resolution_summary, compressed_at
               FROM fleet_concerns WHERE status = 'resolved'
               ORDER BY resolved_at DESC"""
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def get_all_concerns() -> list[dict]:
    """Get all concerns (active first, then resolved) with logs for active."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM fleet_concerns ORDER BY status ASC, created_at DESC"
        )
        concerns = [dict(r) for r in await cursor.fetchall()]

        for c in concerns:
            if c["status"] == "active":
                log_cursor = await db.execute(
                    "SELECT * FROM fleet_concern_logs WHERE concern_id = ? ORDER BY created_at ASC",
                    (c["id"],),
                )
                c["logs"] = [dict(r) for r in await log_cursor.fetchall()]
            else:
                c["logs"] = []

        return concerns
    finally:
        await db.close()


async def get_concern(concern_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM fleet_concerns WHERE id = ?", (concern_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        c = dict(row)
        log_cursor = await db.execute(
            "SELECT * FROM fleet_concern_logs WHERE concern_id = ? ORDER BY created_at ASC",
            (concern_id,),
        )
        c["logs"] = [dict(r) for r in await log_cursor.fetchall()]
        return c
    finally:
        await db.close()


async def create_concern(title: str, description: str) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO fleet_concerns (title, description) VALUES (?, ?)",
            (title, description),
        )
        await db.commit()
        return await get_concern(cursor.lastrowid)
    finally:
        await db.close()


async def update_concern(concern_id: int, **fields) -> dict | None:
    allowed = {"title", "description", "status", "resolved_at", "resolution_summary"}
    fields = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not fields:
        return await get_concern(concern_id)

    db = await get_db()
    try:
        sets = ", ".join(f"{k} = ?" for k in fields)
        vals = list(fields.values()) + [concern_id]
        await db.execute(f"UPDATE fleet_concerns SET {sets} WHERE id = ?", vals)
        await db.commit()
        return await get_concern(concern_id)
    finally:
        await db.close()


async def resolve_concern(concern_id: int, resolution_summary: str) -> dict | None:
    db = await get_db()
    try:
        await db.execute(
            """UPDATE fleet_concerns
               SET status = 'resolved', resolved_at = ?, resolution_summary = ?
               WHERE id = ?""",
            (datetime.now().isoformat(), resolution_summary, concern_id),
        )
        await db.commit()
        return await get_concern(concern_id)
    finally:
        await db.close()


async def reactivate_concern(concern_id: int) -> dict | None:
    db = await get_db()
    try:
        await db.execute(
            """UPDATE fleet_concerns
               SET status = 'active', resolved_at = NULL, resolution_summary = NULL
               WHERE id = ?""",
            (concern_id,),
        )
        await db.commit()
        return await get_concern(concern_id)
    finally:
        await db.close()


# --- Concern Logs ---

async def add_concern_log(concern_id: int, source: str, content: str) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO fleet_concern_logs (concern_id, source, content) VALUES (?, ?, ?)",
            (concern_id, source, content),
        )
        await db.commit()
        row = await (await db.execute(
            "SELECT * FROM fleet_concern_logs WHERE id = ?", (cursor.lastrowid,)
        )).fetchone()
        return dict(row) if row else {"id": cursor.lastrowid}
    finally:
        await db.close()


# --- Visits ---

async def create_visit() -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO fleet_visits (conversation_history) VALUES ('[]')"
        )
        await db.commit()
        row = await (await db.execute(
            "SELECT * FROM fleet_visits WHERE id = ?", (cursor.lastrowid,)
        )).fetchone()
        return dict(row)
    finally:
        await db.close()


async def update_visit_conversation(visit_id: int, conversation_history: list) -> None:
    db = await get_db()
    try:
        await db.execute(
            "UPDATE fleet_visits SET conversation_history = ? WHERE id = ?",
            (json.dumps(conversation_history), visit_id),
        )
        await db.commit()
    finally:
        await db.close()


async def end_visit(visit_id: int, actions_taken: list | None, summary: str) -> None:
    db = await get_db()
    try:
        await db.execute(
            """UPDATE fleet_visits
               SET ended_at = ?, actions_taken = ?, summary = ?
               WHERE id = ?""",
            (
                datetime.now().isoformat(),
                json.dumps(actions_taken) if actions_taken else None,
                summary,
                visit_id,
            ),
        )
        await db.commit()
    finally:
        await db.close()


async def get_last_visit() -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM fleet_visits WHERE ended_at IS NOT NULL ORDER BY ended_at DESC LIMIT 1"
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def get_orphaned_visits() -> list[dict]:
    """Find visits with null ended_at (LM-41)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM fleet_visits WHERE ended_at IS NULL"
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def close_orphaned_visit(visit_id: int) -> None:
    """Close an orphaned visit (LM-41)."""
    db = await get_db()
    try:
        await db.execute(
            """UPDATE fleet_visits
               SET ended_at = ?, summary = 'Session interrupted -- no actions were taken. Start a new visit to continue.'
               WHERE id = ?""",
            (datetime.now().isoformat(), visit_id),
        )
        await db.commit()
    finally:
        await db.close()


# --- Compression ---

async def get_concerns_for_compression() -> list[dict]:
    """Get resolved concerns older than 90 days that haven't been compressed."""
    cutoff = (datetime.now() - timedelta(days=90)).isoformat()
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT id, title FROM fleet_concerns
               WHERE status = 'resolved'
               AND resolved_at IS NOT NULL AND resolved_at < ?
               AND compressed_at IS NULL""",
            (cutoff,),
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def compress_concern(concern_id: int) -> None:
    """Delete logs and mark as compressed."""
    db = await get_db()
    try:
        await db.execute(
            "DELETE FROM fleet_concern_logs WHERE concern_id = ?", (concern_id,)
        )
        await db.execute(
            "UPDATE fleet_concerns SET compressed_at = ? WHERE id = ?",
            (datetime.now().isoformat(), concern_id),
        )
        await db.commit()
    finally:
        await db.close()


# --- Health data read access (for medical briefing) ---

async def get_health_briefing() -> dict:
    """Assemble the medical briefing for Fleet's system prompt."""
    db = await get_db()
    try:
        # Profile
        profile_row = await (await db.execute(
            "SELECT * FROM health_profile WHERE id = 1"
        )).fetchone()
        profile = dict(profile_row) if profile_row else None

        # Recent weight measurements (last 5)
        weight_cursor = await db.execute(
            "SELECT date, weight_g, notes FROM health_measurements ORDER BY date DESC LIMIT 5"
        )
        weights = [dict(r) for r in await weight_cursor.fetchall()]

        # Medical records summary from unified documents table (health category)
        from backend.documents import get_medical_summary
        records_summary_data = await get_medical_summary()
        records_summary = records_summary_data.get("by_tag", {})

        # Active concerns with full logs
        active_cursor = await db.execute(
            "SELECT * FROM fleet_concerns WHERE status = 'active' ORDER BY created_at DESC"
        )
        active_concerns = [dict(r) for r in await active_cursor.fetchall()]
        for c in active_concerns:
            log_cursor = await db.execute(
                "SELECT * FROM fleet_concern_logs WHERE concern_id = ? ORDER BY created_at ASC",
                (c["id"],),
            )
            c["logs"] = [dict(r) for r in await log_cursor.fetchall()]

        # Resolved concerns (no logs — may be compressed)
        resolved_cursor = await db.execute(
            """SELECT id, title, description, created_at, resolved_at, resolution_summary
               FROM fleet_concerns WHERE status = 'resolved'
               ORDER BY resolved_at DESC"""
        )
        resolved_concerns = [dict(r) for r in await resolved_cursor.fetchall()]

        # Last visit
        last_visit_row = await (await db.execute(
            "SELECT started_at, summary FROM fleet_visits WHERE ended_at IS NOT NULL ORDER BY ended_at DESC LIMIT 1"
        )).fetchone()
        last_visit = dict(last_visit_row) if last_visit_row else None

        return {
            "profile": profile,
            "weights": weights,
            "records_summary": records_summary,
            "active_concerns": active_concerns,
            "resolved_concerns": resolved_concerns,
            "last_visit": last_visit,
        }
    finally:
        await db.close()


async def search_medical_records(query: str) -> list[dict]:
    """Search unified documents table for health records (LM-42)."""
    from backend.documents import search_medical_records as search_docs
    docs = await search_docs(query)
    return {"documents": docs, "files": []}


# --- Dashboard API queries ---

async def get_concerns_for_dashboard() -> dict:
    """Get concerns formatted for the Health dashboard display."""
    db = await get_db()
    try:
        # Active concerns with log count and last log date
        active_cursor = await db.execute(
            """SELECT c.*,
                      COUNT(l.id) as log_count,
                      MAX(l.created_at) as last_log_at
               FROM fleet_concerns c
               LEFT JOIN fleet_concern_logs l ON l.concern_id = c.id
               WHERE c.status = 'active'
               GROUP BY c.id
               ORDER BY c.created_at DESC"""
        )
        active = [dict(r) for r in await active_cursor.fetchall()]

        # For active concerns, also fetch logs
        for c in active:
            log_cursor = await db.execute(
                "SELECT * FROM fleet_concern_logs WHERE concern_id = ? ORDER BY created_at DESC",
                (c["id"],),
            )
            c["logs"] = [dict(r) for r in await log_cursor.fetchall()]

        # Resolved concerns
        resolved_cursor = await db.execute(
            """SELECT id, title, description, created_at, resolved_at,
                      resolution_summary, compressed_at
               FROM fleet_concerns WHERE status = 'resolved'
               ORDER BY resolved_at DESC"""
        )
        resolved = [dict(r) for r in await resolved_cursor.fetchall()]

        return {"active": active, "resolved": resolved}
    finally:
        await db.close()
