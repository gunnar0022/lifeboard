"""Projects tab — CRUD API for project cards and context buckets."""
import json
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.database import get_db

logger = logging.getLogger("lifeboard")

router = APIRouter(prefix="/api/projects", tags=["projects"])

STAGE_ORDER = {"working_on": 0, "mostly_polished": 1, "scaffolding": 2}


# --- Request models ---

class ProjectCreate(BaseModel):
    id: str
    name: str
    stage: str = "scaffolding"
    card_html: Optional[str] = None
    context_bucket: Optional[dict] = None
    sort_order: int = 0

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    stage: Optional[str] = None
    card_html: Optional[str] = None
    context_bucket: Optional[dict] = None
    sort_order: Optional[int] = None

class StageUpdate(BaseModel):
    stage: str


# --- Endpoints ---

@router.get("")
async def list_projects():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM projects ORDER BY "
            "CASE stage WHEN 'working_on' THEN 0 WHEN 'mostly_polished' THEN 1 ELSE 2 END, "
            "sort_order ASC, created_at DESC"
        )
        rows = await cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if d.get("context_bucket"):
                try:
                    d["context_bucket"] = json.loads(d["context_bucket"])
                except (json.JSONDecodeError, TypeError):
                    pass
            result.append(d)
        return {"projects": result}
    finally:
        await db.close()


@router.get("/{project_id}")
async def get_project(project_id: str):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(404, "Project not found")
        d = dict(row)
        if d.get("context_bucket"):
            try:
                d["context_bucket"] = json.loads(d["context_bucket"])
            except (json.JSONDecodeError, TypeError):
                pass
        return d
    finally:
        await db.close()


@router.get("/{project_id}/bucket")
async def get_bucket(project_id: str):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT context_bucket FROM projects WHERE id = ?", (project_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(404, "Project not found")
        bucket = row["context_bucket"]
        if bucket:
            try:
                return json.loads(bucket)
            except (json.JSONDecodeError, TypeError):
                return {"raw": bucket}
        return {}
    finally:
        await db.close()


@router.post("")
async def create_project(body: ProjectCreate):
    if body.stage not in STAGE_ORDER:
        raise HTTPException(400, f"Invalid stage: {body.stage}")
    db = await get_db()
    try:
        bucket_json = json.dumps(body.context_bucket) if body.context_bucket else None
        await db.execute(
            """INSERT INTO projects (id, name, stage, card_html, context_bucket, sort_order)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (body.id, body.name, body.stage, body.card_html, bucket_json, body.sort_order),
        )
        await db.commit()
        return await get_project(body.id)
    except Exception as e:
        if "UNIQUE constraint" in str(e):
            raise HTTPException(409, f"Project '{body.id}' already exists")
        raise
    finally:
        await db.close()


@router.put("/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
        if not await cursor.fetchone():
            raise HTTPException(404, "Project not found")

        updates = {}
        if body.name is not None:
            updates["name"] = body.name
        if body.stage is not None:
            if body.stage not in STAGE_ORDER:
                raise HTTPException(400, f"Invalid stage: {body.stage}")
            updates["stage"] = body.stage
        if body.card_html is not None:
            updates["card_html"] = body.card_html
        if body.context_bucket is not None:
            updates["context_bucket"] = json.dumps(body.context_bucket)
        if body.sort_order is not None:
            updates["sort_order"] = body.sort_order

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            values = list(updates.values()) + [project_id]
            await db.execute(
                f"UPDATE projects SET {set_clause}, updated_at = strftime('%Y-%m-%dT%H:%M:%S', 'now') WHERE id = ?",
                values,
            )
            await db.commit()

        return await get_project(project_id)
    finally:
        await db.close()


@router.put("/{project_id}/stage")
async def update_stage(project_id: str, body: StageUpdate):
    if body.stage not in STAGE_ORDER:
        raise HTTPException(400, f"Invalid stage: {body.stage}")
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
        if not await cursor.fetchone():
            raise HTTPException(404, "Project not found")
        await db.execute(
            "UPDATE projects SET stage = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%S', 'now') WHERE id = ?",
            (body.stage, project_id),
        )
        await db.commit()
        return {"ok": True, "stage": body.stage}
    finally:
        await db.close()


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(404, "Project not found")
        return {"ok": True}
    finally:
        await db.close()
