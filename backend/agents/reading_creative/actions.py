"""
Reading & Creative agent — ACTION_REGISTRY.
Telegram actions: idea capture, reading log management.
"""
from backend.agents.reading_creative import queries


async def handle_capture_idea(data: dict) -> dict:
    short_slug = data.get("short_slug", "idea")
    return await queries.capture_idea(
        project_slug=data["project_slug"],
        content=data["content"],
        short_slug=short_slug,
    )


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
    "capture_idea": {
        "handler": handle_capture_idea,
        "required": ["project_slug", "content"],
        "optional": ["short_slug"],
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
