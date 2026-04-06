"""
Reading & Creative agent — ACTION_REGISTRY.
Telegram actions: project note appending, reading log management.
"""
from backend.agents.reading_creative import queries


async def handle_append_project_note(data: dict) -> dict:
    """Append a note to a project's notes field via the projects API."""
    from datetime import datetime
    from backend.database import get_db

    project_id = data["project_id"]
    content = data["content"]

    db = await get_db()
    try:
        cursor = await db.execute("SELECT notes FROM projects WHERE id = ?", (project_id,))
        row = await cursor.fetchone()
        if not row:
            return {"error": f"Project '{project_id}' not found"}

        existing = row["notes"] or ""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        entry = f"\n[{timestamp}] {content}"
        updated = (existing + entry).strip()

        await db.execute(
            "UPDATE projects SET notes = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%S', 'now') WHERE id = ?",
            (updated, project_id),
        )
        await db.commit()
        return {"ok": True, "project_id": project_id}
    finally:
        await db.close()


async def handle_add_book(data: dict) -> dict:
    return await queries.add_book(
        title=data["title"],
        author=data.get("author"),
        status=data.get("status", "to_read"),
        recommended_by=data.get("recommended_by"),
    )


async def handle_finish_book(data: dict) -> dict:
    result = await queries.finish_book_by_title(
        title=data["title"],
        reflection=data.get("reflection"),
    )
    if not result:
        return {"error": f"Could not find '{data['title']}' in your reading list"}
    return result


async def handle_list_books(data: dict) -> list:
    return await queries.get_books(status=data.get("status"))


ACTION_REGISTRY = {
    "append_project_note": {
        "handler": handle_append_project_note,
        "required": ["project_id", "content"],
    },
    "add_book": {
        "handler": handle_add_book,
        "required": ["title"],
        "optional": ["author", "status", "recommended_by"],
    },
    "finish_book": {
        "handler": handle_finish_book,
        "required": ["title"],
        "optional": ["reflection"],
    },
    "list_books": {
        "handler": handle_list_books,
        "required": [],
        "optional": ["status"],
        "is_read": True,
    },
}
