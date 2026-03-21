"""
Unified document system — classifier, queries, and file management.
Replaces per-agent document/file tables with a single `documents` table.
All photos, PDFs, and documents go through the classifier agent (Haiku)
which generates a title, summary, tags, and category.
"""
import json
import logging
from pathlib import Path
from datetime import datetime

from backend.database import get_db

logger = logging.getLogger("lifeboard")

PROJECT_ROOT = Path(__file__).parent.parent

# Comprehensive tag set for document classification
VALID_TAGS = {
    "contract", "receipt", "invoice", "tax", "insurance", "medical",
    "prescription", "lab-result", "pay-stub", "bank-statement",
    "id-document", "lease", "visa", "portfolio", "brokerage",
    "checkup", "vaccination", "dental", "vision", "imaging",
    "employment", "legal", "utility", "other",
}

VALID_CATEGORIES = {"finance", "health", "investing", "life"}


# --- Classifier ---

async def classify_document(
    file_path: str,
    original_filename: str,
    mime_type: str,
    file_size: int,
    user_caption: str = "",
    image_data: bytes = None,
) -> dict:
    """
    Use Haiku to classify a document: generate title, summary, tags, and category.
    For images, sends the image to Claude vision. For PDFs, sends filename + caption context.
    """
    from backend import llm_client

    system_prompt = f"""You are a document classifier. Analyze the uploaded document and return a JSON object with:
- "title": short descriptive title (e.g., "Annual Health Checkup 2025", "March Electricity Bill")
- "summary": 2-4 sentence summary capturing key details. For pay stubs: dates, amounts. For medical: findings, provider. For contracts: parties, terms, dates. For receipts: items, amounts, vendor. Be specific with numbers and dates.
- "tags": array of tags from this set: {sorted(VALID_TAGS)}. Pick 1-3 most relevant.
- "category": one of: finance, health, investing, life. Use "health" for medical/dental/vision/prescription docs. Use "finance" for receipts/invoices/pay-stubs/bank-statements. Use "investing" for portfolio/brokerage docs. Use "life" for contracts/leases/ID docs/legal/insurance or anything that doesn't clearly fit the other 3.
- "date": ISO date if you can identify one from the document (nullable)
- "provider": organization/company/clinic name if identifiable (nullable)

User context: "{user_caption or 'No caption provided'}"
Filename: {original_filename}

Return ONLY the JSON object, no other text."""

    try:
        result = await llm_client.process_message(
            system_prompt=system_prompt,
            user_message=f"Classify this document: {original_filename}. {user_caption}",
            image_data=image_data if mime_type and mime_type.startswith("image/") else None,
            image_media_type=mime_type if mime_type and mime_type.startswith("image/") else "image/jpeg",
            max_tokens=500,
            model=llm_client.MODEL_FAST,
        )

        # Validate and sanitize
        title = result.get("title", original_filename)
        summary = result.get("summary", "")
        tags = [t for t in result.get("tags", []) if t in VALID_TAGS] or ["other"]
        category = result.get("category", "life")
        if category not in VALID_CATEGORIES:
            category = "life"

        return {
            "title": title,
            "summary": summary,
            "tags": tags,
            "category": category,
            "date": result.get("date"),
            "provider": result.get("provider"),
        }
    except Exception as e:
        logger.error(f"Document classification failed: {e}")
        # Fallback: basic classification from filename/caption
        return {
            "title": original_filename,
            "summary": user_caption or "Document uploaded via Telegram",
            "tags": ["other"],
            "category": "life",
            "date": None,
            "provider": None,
        }


# --- CRUD ---

async def store_document(
    title: str,
    summary: str,
    tags: list[str],
    category: str,
    file_path: str = None,
    original_filename: str = None,
    mime_type: str = None,
    file_size: int = None,
    date: str = None,
    provider: str = None,
    extracted_data: str = None,
) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO documents
               (title, summary, tags, category, file_path, original_filename,
                mime_type, file_size, date, provider, extracted_data)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (title, summary, json.dumps(tags), category, file_path,
             original_filename, mime_type, file_size, date, provider, extracted_data),
        )
        await db.commit()
        return await get_document(cursor.lastrowid)
    finally:
        await db.close()


async def get_document(doc_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = await cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        d["tags"] = json.loads(d["tags"]) if d["tags"] else []
        return d
    finally:
        await db.close()


async def search_documents(query: str = None, tags: list[str] = None,
                           category: str = None, limit: int = 50) -> list[dict]:
    db = await get_db()
    try:
        conditions = []
        params = []

        if query and query.strip():
            conditions.append("(title LIKE ? OR summary LIKE ? OR provider LIKE ?)")
            q = f"%{query}%"
            params.extend([q, q, q])

        if tags:
            for tag in tags:
                conditions.append("tags LIKE ?")
                params.append(f'%"{tag}"%')

        if category and category in VALID_CATEGORIES:
            conditions.append("category = ?")
            params.append(category)

        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        cursor = await db.execute(
            f"SELECT * FROM documents {where} ORDER BY created_at DESC LIMIT ?",
            params + [limit],
        )
        rows = await cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["tags"] = json.loads(d["tags"]) if d["tags"] else []
            result.append(d)
        return result
    finally:
        await db.close()


async def get_documents_by_category(category: str) -> list[dict]:
    return await search_documents(category=category)


async def get_medical_documents() -> list[dict]:
    """Get all health-tagged documents for Fleet's medical briefing."""
    return await search_documents(category="health")


async def get_medical_summary() -> dict:
    """Count medical documents by tag for Fleet briefing."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT tags FROM documents WHERE category = 'health'"
        )
        rows = await cursor.fetchall()
        tag_counts = {}
        total = 0
        for r in rows:
            tags = json.loads(r["tags"]) if r["tags"] else []
            total += 1
            for t in tags:
                tag_counts[t] = tag_counts.get(t, 0) + 1
        return {"total": total, "by_tag": tag_counts}
    finally:
        await db.close()


async def search_medical_records(query: str) -> list[dict]:
    """Search health documents for Fleet's mid-conversation retrieval (LM-42)."""
    return await search_documents(query=query, category="health")


async def update_document(doc_id: int, **fields) -> dict | None:
    allowed = {"title", "summary", "tags", "category", "date", "provider"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if "tags" in updates and isinstance(updates["tags"], list):
        updates["tags"] = json.dumps(updates["tags"])
    if not updates:
        return await get_document(doc_id)

    db = await get_db()
    try:
        sets = ", ".join(f"{k} = ?" for k in updates)
        vals = list(updates.values()) + [doc_id]
        await db.execute(f"UPDATE documents SET {sets} WHERE id = ?", vals)
        await db.commit()
        return await get_document(doc_id)
    finally:
        await db.close()


async def delete_document(doc_id: int) -> bool:
    doc = await get_document(doc_id)
    if not doc:
        return False

    # Delete file from disk if it exists
    if doc.get("file_path"):
        full_path = PROJECT_ROOT / "data" / "files" / doc["file_path"]
        if full_path.exists():
            full_path.unlink()

    db = await get_db()
    try:
        await db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        await db.commit()
        return True
    finally:
        await db.close()


async def get_all_tags_in_use() -> list[str]:
    """Get all tags that have at least one document."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT DISTINCT tags FROM documents")
        rows = await cursor.fetchall()
        tags_set = set()
        for r in rows:
            tags = json.loads(r["tags"]) if r["tags"] else []
            tags_set.update(tags)
        return sorted(tags_set)
    finally:
        await db.close()
