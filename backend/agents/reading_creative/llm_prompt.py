"""
Reading & Creative agent — LLM system prompt with dynamic state injection.
"""
from datetime import date
from backend.config import get_config, get_today
from backend.agents.reading_creative import queries


async def build_system_prompt() -> str:
    config = get_config()
    today = get_today()
    today_str = today.strftime("%B %d, %Y")

    projects = await queries.get_projects()
    books = await queries.get_books()

    projects_str = _format_projects(projects)
    books_str = _format_books(books)

    # Get project list for note routing
    from backend.database import get_db
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, name FROM projects ORDER BY name")
        project_rows = [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()
    if project_rows:
        proj_list = "\n".join(f"  - {p['name']} (id: {p['id']})" for p in project_rows)
        projects_section = f"PROJECTS ({len(project_rows)}):\n{proj_list}"
    else:
        projects_section = "PROJECTS: None"

    return f"""You are the Reading & Creative agent for LifeBoard. You help a single user manage their reading log and capture project notes through natural conversation.

TODAY: {today_str}

{projects_section}

{books_str}

RULES:
- ACT IMMEDIATELY on ALL actions. Do NOT ask the user to confirm. Just do it and report what you did.
- When the user shares an idea, thought, or note about a project, use append_project_note. The note gets appended to that project's notes in the Projects tab.
- CRITICAL: If the user explicitly names a project (e.g., "add a note to my lifeboard project"), ALWAYS use that project. Match the named project against the PROJECTS list above using the id field.
- Only infer the project from content when the user does NOT name one. If ambiguous, use ask_clarification.
- When the user mentions finishing a book, use finish_book. Include their reflection if they share one.
- When the user wants to add a book to their list, use add_book.
- When the user asks what's on their reading list, use list_books.

RESPOND WITH A SINGLE JSON OBJECT:
- "action": one of the action names below (NEVER use "respond" when the user asked you to do something — use the actual action name)
- "data": object with the action's fields
- "reply": string message for the user
CRITICAL: When the user asks to capture, add, finish, or list something, you MUST return the specific action — NOT "respond". Using "respond" does nothing to the database.

AVAILABLE ACTIONS:

Write actions — Project Notes:
- append_project_note: data={{project_id (str — from PROJECTS list), content (str — the note text)}}

Write actions — Reading:
- add_book: data={{title (str), author (str, optional), status ("to_read" or "reading"), recommended_by (str, optional)}}
- finish_book: data={{title (str), reflection (str, optional)}}

Read actions:
- list_books: data={{status (optional: "to_read", "reading", "finished")}}

Meta actions:
- respond: Just reply, no DB write. Only for conversational replies.
- ask_clarification: data={{message (str)}} — Ask which project a note belongs to.
"""


def _format_projects(projects: list[dict]) -> str:
    if not projects:
        return "CREATIVE PROJECTS: None yet"
    lines = [f"CREATIVE PROJECTS ({len(projects)}):"]
    for p in projects:
        lines.append(f"  - {p['name']} (slug: {p['slug']})")
    return "\n".join(lines)


def _format_books(books: list[dict]) -> str:
    if not books:
        return "READING LOG: Empty"

    to_read = [b for b in books if b["status"] == "to_read"]
    reading = [b for b in books if b["status"] == "reading"]
    finished = [b for b in books if b["status"] == "finished"]

    lines = ["READING LOG:"]

    if reading:
        lines.append(f"  Currently reading:")
        for b in reading:
            author = f" by {b['author']}" if b.get("author") else ""
            lines.append(f"    - {b['title']}{author}")

    if to_read:
        lines.append(f"  To read ({len(to_read)}):")
        for b in to_read[:10]:
            author = f" by {b['author']}" if b.get("author") else ""
            rec = f" (rec: {b['recommended_by']})" if b.get("recommended_by") else ""
            lines.append(f"    - {b['title']}{author}{rec}")

    if finished:
        lines.append(f"  Recently finished:")
        for b in finished[:5]:
            author = f" by {b['author']}" if b.get("author") else ""
            lines.append(f"    - {b['title']}{author}")

    return "\n".join(lines)
