"""Reading & Creative agent — FastAPI routes."""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.agents.reading_creative import queries

logger = logging.getLogger("lifeboard")

router = APIRouter(prefix="/api/reading_creative", tags=["reading_creative"])


# --- Request models ---

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class FileCreate(BaseModel):
    project_slug: str
    path: str
    type: str = "file"
    content: Optional[str] = ""

class FileWrite(BaseModel):
    project_slug: str
    path: str
    content: str

class FileRename(BaseModel):
    project_slug: str
    old_path: str
    new_name: str

class FileMove(BaseModel):
    project_slug: str
    old_path: str
    new_path: str

class BookCreate(BaseModel):
    title: str
    author: Optional[str] = None
    status: str = "to_read"
    recommended_by: Optional[str] = None
    reflection: Optional[str] = None
    date_finished: Optional[str] = None

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[str] = None
    recommended_by: Optional[str] = None
    reflection: Optional[str] = None
    date_finished: Optional[str] = None
    sort_order: Optional[int] = None


# --- Pulse ---

@router.get("/pulse")
async def get_pulse():
    try:
        pulse = await queries.get_pulse()
        titles = pulse.get("books_reading_titles", [])
        count = pulse["books_reading"]
        if count == 1:
            reading_value = titles[0]
        elif count > 1:
            reading_value = f"({count}) books"
        else:
            reading_value = "None"

        return {
            "metrics": [
                {"label": "Projects", "value": str(pulse["projects"])},
                {"label": "In Progress", "value": reading_value},
                {"label": "Finished", "value": str(pulse["books_finished"])},
            ]
        }
    except Exception:
        return {
            "metrics": [
                {"label": "Projects", "value": "-"},
                {"label": "Reading", "value": "-"},
                {"label": "Finished", "value": "-"},
            ]
        }


# --- Projects ---

@router.get("/projects")
async def list_projects():
    """List all projects, syncing with filesystem first to pick up manually added folders."""
    await queries.sync_filesystem()
    return await queries.get_projects()

@router.post("/projects")
async def create_project(body: ProjectCreate):
    return await queries.create_project(name=body.name, description=body.description)

@router.put("/projects/{project_id}")
async def update_project(project_id: int, body: ProjectUpdate):
    result = await queries.update_project(project_id, **body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(404, "Project not found")
    return result

@router.delete("/projects/{project_id}")
async def delete_project(project_id: int):
    if not await queries.delete_project(project_id):
        raise HTTPException(404, "Project not found")
    return {"ok": True}


# --- Files ---

@router.get("/files")
async def list_files(project_slug: str, path: str = ""):
    return await queries.list_directory(project_slug, path)

@router.post("/files")
async def create_file(body: FileCreate):
    try:
        return await queries.create_file_or_dir(
            body.project_slug, body.path, body.type, body.content or ""
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.get("/files/read")
async def read_file(project_slug: str, path: str):
    result = await queries.read_file(project_slug, path)
    if not result:
        raise HTTPException(404, "File not found")
    return result

@router.put("/files/write")
async def write_file(body: FileWrite):
    try:
        return await queries.write_file(body.project_slug, body.path, body.content)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.put("/files/rename")
async def rename_file(body: FileRename):
    try:
        return await queries.rename_file(body.project_slug, body.old_path, body.new_name)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.put("/files/move")
async def move_file(body: FileMove):
    try:
        return await queries.move_file(body.project_slug, body.old_path, body.new_path)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.delete("/files")
async def delete_file(project_slug: str, path: str):
    if not await queries.delete_file(project_slug, path):
        raise HTTPException(404, "File not found")
    return {"ok": True}

@router.get("/files/search")
async def search_files(q: str):
    return await queries.search_files(q)

@router.post("/files/reindex")
async def reindex_files():
    """Rebuild file index for all projects."""
    projects = await queries.get_projects()
    total = 0
    for p in projects:
        total += await queries.reindex_project(p["id"])
    return {"ok": True, "indexed": total}

@router.post("/sync")
async def sync_filesystem():
    """Sync filesystem with database — discovers new folders, removes deleted ones, reindexes all."""
    return await queries.sync_filesystem()


# --- Snippets ---

@router.get("/snippets")
async def get_snippets(count: int = 8):
    return await queries.get_snippets(count)


# --- Books ---

@router.get("/books")
async def list_books(status: str = None):
    return await queries.get_books(status)

@router.post("/books")
async def create_book(body: BookCreate):
    return await queries.add_book(
        title=body.title, author=body.author, status=body.status,
        recommended_by=body.recommended_by, reflection=body.reflection,
        date_finished=body.date_finished,
    )

@router.put("/books/{book_id}")
async def update_book(book_id: int, body: BookUpdate):
    result = await queries.update_book(book_id, **body.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(404, "Book not found")
    return result

@router.delete("/books/{book_id}")
async def delete_book(book_id: int):
    if not await queries.delete_book(book_id):
        raise HTTPException(404, "Book not found")
    return {"ok": True}


# --- Health ---

@router.get("/health")
async def health():
    return {"agent": "reading_creative", "status": "ok"}
