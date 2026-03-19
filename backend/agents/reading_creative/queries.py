"""
Reading & Creative agent — SQL query functions + filesystem operations.
Projects and file index in DB, actual .md content on disk.
Raw SQL with aiosqlite (no ORM per LM-01).
"""
import os
import re
import random
import shutil
import logging
from datetime import datetime
from pathlib import Path

from backend.database import get_db

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
CREATIVE_ROOT = PROJECT_ROOT / "data" / "creative"


def _ensure_creative_root():
    CREATIVE_ROOT.mkdir(parents=True, exist_ok=True)


def _slugify(name: str) -> str:
    """Convert a project name to a kebab-case slug."""
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "untitled"


def _validate_path(path: str) -> bool:
    """Reject directory traversal attempts."""
    if ".." in path or path.startswith("/") or path.startswith("\\"):
        return False
    resolved = (CREATIVE_ROOT / path).resolve()
    return str(resolved).startswith(str(CREATIVE_ROOT.resolve()))


# --- Projects ---

async def get_projects() -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM creative_projects ORDER BY name"
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def get_project(project_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM creative_projects WHERE id = ?", (project_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def get_project_by_slug(slug: str) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM creative_projects WHERE slug = ?", (slug,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def create_project(name: str, description: str = None) -> dict:
    _ensure_creative_root()
    slug = _slugify(name)

    # Ensure unique slug
    base_slug = slug
    counter = 1
    while (CREATIVE_ROOT / slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create folder + _ideas/
    project_dir = CREATIVE_ROOT / slug
    project_dir.mkdir(parents=True, exist_ok=True)
    (project_dir / "_ideas").mkdir(exist_ok=True)

    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO creative_projects (name, slug, description) VALUES (?, ?, ?)",
            (name, slug, description),
        )
        await db.commit()
        project_id = cursor.lastrowid

        # Index the _ideas directory
        await db.execute(
            "INSERT OR IGNORE INTO creative_file_index (project_id, file_path, file_name, is_directory) VALUES (?, ?, ?, 1)",
            (project_id, f"{slug}/_ideas", "_ideas"),
        )
        await db.commit()
    finally:
        await db.close()

    return await get_project(project_id)


async def update_project(project_id: int, **fields) -> dict | None:
    project = await get_project(project_id)
    if not project:
        return None

    allowed = {"name", "description"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}

    old_slug = project["slug"]

    if "name" in updates:
        new_slug = _slugify(updates["name"])
        if new_slug != old_slug:
            old_path = CREATIVE_ROOT / old_slug
            new_path = CREATIVE_ROOT / new_slug
            if old_path.exists() and not new_path.exists():
                old_path.rename(new_path)
                updates["slug"] = new_slug
                # Update file index paths
                db = await get_db()
                try:
                    rows = await db.execute_fetchall(
                        "SELECT id, file_path FROM creative_file_index WHERE project_id = ?",
                        (project_id,),
                    )
                    for row in rows:
                        new_file_path = row["file_path"].replace(old_slug, new_slug, 1)
                        await db.execute(
                            "UPDATE creative_file_index SET file_path = ? WHERE id = ?",
                            (new_file_path, row["id"]),
                        )
                    await db.commit()
                finally:
                    await db.close()

    if updates:
        updates["updated_at"] = datetime.now().isoformat()
        db = await get_db()
        try:
            sets = ", ".join(f"{k} = ?" for k in updates)
            vals = list(updates.values()) + [project_id]
            await db.execute(f"UPDATE creative_projects SET {sets} WHERE id = ?", vals)
            await db.commit()
        finally:
            await db.close()

    return await get_project(project_id)


async def delete_project(project_id: int) -> bool:
    project = await get_project(project_id)
    if not project:
        return False

    # Delete folder tree
    project_dir = CREATIVE_ROOT / project["slug"]
    if project_dir.exists():
        shutil.rmtree(project_dir)

    db = await get_db()
    try:
        await db.execute("DELETE FROM creative_projects WHERE id = ?", (project_id,))
        await db.commit()
    finally:
        await db.close()
    return True


# --- File/Folder Operations ---

async def list_directory(project_slug: str, path: str = "") -> list[dict]:
    """List directory contents from filesystem."""
    if not _validate_path(f"{project_slug}/{path}"):
        return []

    dir_path = CREATIVE_ROOT / project_slug / path if path else CREATIVE_ROOT / project_slug
    if not dir_path.exists() or not dir_path.is_dir():
        return []

    entries = []
    for entry in sorted(dir_path.iterdir()):
        rel_path = str(entry.relative_to(CREATIVE_ROOT)).replace("\\", "/")
        entries.append({
            "name": entry.name,
            "type": "dir" if entry.is_dir() else "file",
            "path": rel_path,
            "updated_at": datetime.fromtimestamp(entry.stat().st_mtime).isoformat(),
        })

    # Sort: directories first (with _ideas first among dirs), then files
    entries.sort(key=lambda e: (0 if e["type"] == "dir" and e["name"].startswith("_") else 1 if e["type"] == "dir" else 2, e["name"]))
    return entries


async def read_file(project_slug: str, path: str) -> dict | None:
    """Read a .md file from disk."""
    full_rel = f"{project_slug}/{path}"
    if not _validate_path(full_rel):
        return None

    file_path = CREATIVE_ROOT / full_rel
    if not file_path.exists() or not file_path.is_file():
        return None

    content = file_path.read_text(encoding="utf-8")
    return {
        "path": full_rel,
        "content": content,
        "updated_at": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
    }


async def write_file(project_slug: str, path: str, content: str) -> dict:
    """Write/save content to a .md file."""
    full_rel = f"{project_slug}/{path}"
    if not _validate_path(full_rel):
        raise ValueError("Invalid path")

    file_path = CREATIVE_ROOT / full_rel
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content, encoding="utf-8")

    # Update file index
    project = await get_project_by_slug(project_slug)
    if project:
        db = await get_db()
        try:
            await db.execute(
                """INSERT INTO creative_file_index (project_id, file_path, file_name, is_directory, updated_at)
                   VALUES (?, ?, ?, 0, ?)
                   ON CONFLICT(file_path) DO UPDATE SET updated_at = ?""",
                (project["id"], full_rel, file_path.name, datetime.now().isoformat(), datetime.now().isoformat()),
            )
            await db.commit()
        finally:
            await db.close()

    return {"path": full_rel, "updated_at": datetime.now().isoformat()}


async def create_file_or_dir(project_slug: str, path: str, entry_type: str, content: str = "") -> dict:
    """Create a new file or directory."""
    full_rel = f"{project_slug}/{path}"
    if not _validate_path(full_rel):
        raise ValueError("Invalid path")

    full_path = CREATIVE_ROOT / full_rel

    if entry_type == "dir":
        full_path.mkdir(parents=True, exist_ok=True)
    else:
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content, encoding="utf-8")

    # Update file index
    project = await get_project_by_slug(project_slug)
    if project:
        db = await get_db()
        try:
            await db.execute(
                """INSERT OR IGNORE INTO creative_file_index
                   (project_id, file_path, file_name, is_directory)
                   VALUES (?, ?, ?, ?)""",
                (project["id"], full_rel, full_path.name, 1 if entry_type == "dir" else 0),
            )
            await db.commit()
        finally:
            await db.close()

    return {
        "name": full_path.name,
        "type": entry_type,
        "path": full_rel,
        "updated_at": datetime.now().isoformat(),
    }


async def rename_file(project_slug: str, old_path: str, new_name: str) -> dict:
    """Rename a file or folder."""
    full_old = f"{project_slug}/{old_path}"
    if not _validate_path(full_old):
        raise ValueError("Invalid path")

    old_full = CREATIVE_ROOT / full_old
    new_full = old_full.parent / new_name
    full_new = f"{project_slug}/{str(Path(old_path).parent / new_name)}".replace("\\", "/")
    if full_new.endswith("/."):
        full_new = f"{project_slug}/{new_name}"

    if not old_full.exists():
        raise ValueError("Source not found")

    old_full.rename(new_full)

    # Update file index
    db = await get_db()
    try:
        await db.execute(
            "UPDATE creative_file_index SET file_path = ?, file_name = ?, updated_at = ? WHERE file_path = ?",
            (full_new, new_name, datetime.now().isoformat(), full_old),
        )
        # Also update children if it's a directory
        rows = await db.execute_fetchall(
            "SELECT id, file_path FROM creative_file_index WHERE file_path LIKE ?",
            (full_old + "/%",),
        )
        for row in rows:
            new_child_path = row["file_path"].replace(full_old, full_new, 1)
            await db.execute(
                "UPDATE creative_file_index SET file_path = ? WHERE id = ?",
                (new_child_path, row["id"]),
            )
        await db.commit()
    finally:
        await db.close()

    return {"path": full_new, "name": new_name}


async def move_file(project_slug: str, old_path: str, new_path: str) -> dict:
    """Move a file or folder."""
    full_old = f"{project_slug}/{old_path}"
    full_new = f"{project_slug}/{new_path}"
    if not _validate_path(full_old) or not _validate_path(full_new):
        raise ValueError("Invalid path")

    src = CREATIVE_ROOT / full_old
    dst = CREATIVE_ROOT / full_new
    if not src.exists():
        raise ValueError("Source not found")

    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dst))

    # Update file index
    db = await get_db()
    try:
        await db.execute(
            "UPDATE creative_file_index SET file_path = ?, file_name = ?, updated_at = ? WHERE file_path = ?",
            (full_new, dst.name, datetime.now().isoformat(), full_old),
        )
        rows = await db.execute_fetchall(
            "SELECT id, file_path FROM creative_file_index WHERE file_path LIKE ?",
            (full_old + "/%",),
        )
        for row in rows:
            new_child_path = row["file_path"].replace(full_old, full_new, 1)
            await db.execute(
                "UPDATE creative_file_index SET file_path = ? WHERE id = ?",
                (new_child_path, row["id"]),
            )
        await db.commit()
    finally:
        await db.close()

    return {"path": full_new}


async def delete_file(project_slug: str, path: str) -> bool:
    """Delete a file or folder (recursive for folders)."""
    full_rel = f"{project_slug}/{path}"
    if not _validate_path(full_rel):
        return False

    target = CREATIVE_ROOT / full_rel
    if not target.exists():
        return False

    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()

    # Remove from file index
    db = await get_db()
    try:
        await db.execute("DELETE FROM creative_file_index WHERE file_path = ?", (full_rel,))
        await db.execute("DELETE FROM creative_file_index WHERE file_path LIKE ?", (full_rel + "/%",))
        await db.commit()
    finally:
        await db.close()
    return True


async def search_files(query: str) -> list[dict]:
    """Search filenames across all projects."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT fi.file_name, fi.file_path, p.name as project_name, p.slug as project_slug
               FROM creative_file_index fi
               JOIN creative_projects p ON fi.project_id = p.id
               WHERE fi.file_name LIKE ? AND fi.is_directory = 0
               ORDER BY fi.updated_at DESC
               LIMIT 30""",
            (f"%{query}%",),
        )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def reindex_project(project_id: int) -> int:
    """Rebuild file index for a project by walking the filesystem."""
    project = await get_project(project_id)
    if not project:
        return 0

    project_dir = CREATIVE_ROOT / project["slug"]
    if not project_dir.exists():
        return 0

    db = await get_db()
    try:
        # Clear existing index for this project
        await db.execute("DELETE FROM creative_file_index WHERE project_id = ?", (project_id,))

        count = 0
        for root, dirs, files in os.walk(project_dir):
            root_path = Path(root)
            for d in dirs:
                rel = str((root_path / d).relative_to(CREATIVE_ROOT)).replace("\\", "/")
                await db.execute(
                    "INSERT OR IGNORE INTO creative_file_index (project_id, file_path, file_name, is_directory) VALUES (?, ?, ?, 1)",
                    (project_id, rel, d),
                )
                count += 1
            for f in files:
                rel = str((root_path / f).relative_to(CREATIVE_ROOT)).replace("\\", "/")
                await db.execute(
                    "INSERT OR IGNORE INTO creative_file_index (project_id, file_path, file_name, is_directory) VALUES (?, ?, ?, 0)",
                    (project_id, rel, f),
                )
                count += 1

        await db.commit()
        return count
    finally:
        await db.close()


# --- Reading Log ---

async def get_books(status: str = None) -> list[dict]:
    db = await get_db()
    try:
        if status:
            cursor = await db.execute(
                "SELECT * FROM reading_books WHERE status = ? ORDER BY CASE status WHEN 'reading' THEN 0 WHEN 'to_read' THEN 1 WHEN 'finished' THEN 2 END, sort_order, date_added DESC",
                (status,),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM reading_books ORDER BY CASE status WHEN 'reading' THEN 0 WHEN 'to_read' THEN 1 WHEN 'finished' THEN 2 END, sort_order, date_added DESC"
            )
        return [dict(r) for r in await cursor.fetchall()]
    finally:
        await db.close()


async def add_book(title: str, author: str = None, status: str = "to_read",
                   recommended_by: str = None, reflection: str = None,
                   date_finished: str = None) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO reading_books (title, author, status, recommended_by, reflection, date_finished)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (title, author, status, recommended_by, reflection, date_finished),
        )
        await db.commit()
        row = await (await db.execute("SELECT * FROM reading_books WHERE id = ?", (cursor.lastrowid,))).fetchone()
        return dict(row)
    finally:
        await db.close()


async def update_book(book_id: int, **fields) -> dict | None:
    allowed = {"title", "author", "status", "recommended_by", "reflection", "date_finished", "sort_order"}
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        return None

    db = await get_db()
    try:
        sets = ", ".join(f"{k} = ?" for k in updates)
        vals = list(updates.values()) + [book_id]
        await db.execute(f"UPDATE reading_books SET {sets} WHERE id = ?", vals)
        await db.commit()
        row = await (await db.execute("SELECT * FROM reading_books WHERE id = ?", (book_id,))).fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def finish_book_by_title(title: str, reflection: str = None) -> dict | None:
    """Find a book by title (case-insensitive) and mark finished."""
    from backend.agents.health_body.queries import _today
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM reading_books WHERE LOWER(title) = LOWER(?) AND status != 'finished' LIMIT 1",
            (title,),
        )
        row = await cursor.fetchone()
        if not row:
            # Fuzzy: try LIKE
            cursor = await db.execute(
                "SELECT * FROM reading_books WHERE LOWER(title) LIKE ? AND status != 'finished' LIMIT 1",
                (f"%{title.lower()}%",),
            )
            row = await cursor.fetchone()
        if not row:
            return None

        book = dict(row)
        await db.execute(
            "UPDATE reading_books SET status = 'finished', date_finished = ?, reflection = ? WHERE id = ?",
            (_today().isoformat(), reflection, book["id"]),
        )
        await db.commit()
        row = await (await db.execute("SELECT * FROM reading_books WHERE id = ?", (book["id"],))).fetchone()
        return dict(row)
    finally:
        await db.close()


async def delete_book(book_id: int) -> bool:
    db = await get_db()
    try:
        await db.execute("DELETE FROM reading_books WHERE id = ?", (book_id,))
        await db.commit()
        return True
    finally:
        await db.close()


# --- Snippets ---

async def get_snippets(count: int = 8) -> list[dict]:
    """Get random text snippets from authored .md files (not _ideas/)."""
    _ensure_creative_root()
    projects = await get_projects()
    if not projects:
        return []

    # Collect all .md files across projects, excluding _ideas/
    all_files = []
    for p in projects:
        project_dir = CREATIVE_ROOT / p["slug"]
        if not project_dir.exists():
            continue
        for root, dirs, files in os.walk(project_dir):
            # Skip _ideas directories
            if "_ideas" in Path(root).parts:
                continue
            for f in files:
                if f.endswith(".md"):
                    all_files.append((Path(root) / f, p["name"]))

    if not all_files:
        return []

    snippets = []
    random.shuffle(all_files)

    for file_path, project_name in all_files[:count * 3]:  # oversample then trim
        try:
            content = file_path.read_text(encoding="utf-8").strip()
            if not content:
                continue
            # Split into paragraphs, pick a random non-empty one
            paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
            # Filter out headings-only paragraphs
            paragraphs = [p for p in paragraphs if not p.startswith("#") or len(p) > 50]
            if not paragraphs:
                continue
            para = random.choice(paragraphs)
            # Truncate to ~50 words
            words = para.split()
            if len(words) > 50:
                para = " ".join(words[:50]) + "..."
            snippets.append({
                "text": para,
                "source_file": file_path.name,
                "project_name": project_name,
            })
        except Exception:
            continue

        if len(snippets) >= count:
            break

    return snippets[:count]


# --- Idea Capture ---

async def capture_idea(project_slug: str, content: str, short_slug: str = "idea") -> dict:
    """Create a timestamped idea file in the project's _ideas/ folder."""
    _ensure_creative_root()

    ideas_dir = CREATIVE_ROOT / project_slug / "_ideas"
    ideas_dir.mkdir(parents=True, exist_ok=True)

    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"{date_str}_{short_slug}.md"
    file_path = ideas_dir / filename

    # Avoid overwrites
    counter = 1
    while file_path.exists():
        filename = f"{date_str}_{short_slug}-{counter}.md"
        file_path = ideas_dir / filename
        counter += 1

    file_path.write_text(content, encoding="utf-8")

    # Update file index
    project = await get_project_by_slug(project_slug)
    if project:
        rel_path = f"{project_slug}/_ideas/{filename}"
        db = await get_db()
        try:
            await db.execute(
                "INSERT OR IGNORE INTO creative_file_index (project_id, file_path, file_name, is_directory) VALUES (?, ?, ?, 0)",
                (project["id"], rel_path, filename),
            )
            await db.commit()
        finally:
            await db.close()

    return {"file": filename, "project": project_slug, "path": f"{project_slug}/_ideas/{filename}"}


# --- Pulse ---

async def get_pulse() -> dict:
    """Key metrics for Home panel pulse card."""
    projects = await get_projects()
    books = await get_books()

    to_read = len([b for b in books if b["status"] == "to_read"])
    reading = len([b for b in books if b["status"] == "reading"])
    finished = len([b for b in books if b["status"] == "finished"])

    # Count total files
    db = await get_db()
    try:
        row = await (await db.execute("SELECT COUNT(*) as cnt FROM creative_file_index WHERE is_directory = 0")).fetchone()
        file_count = row["cnt"] if row else 0
    finally:
        await db.close()

    return {
        "projects": len(projects),
        "files": file_count,
        "books_reading": reading,
        "books_to_read": to_read,
        "books_finished": finished,
    }
