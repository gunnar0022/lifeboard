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

def _extract_pdf_content(file_path_on_disk: str) -> dict:
    """Extract text and/or render pages as images from a PDF using pymupdf."""
    import fitz  # pymupdf

    doc = fitz.open(file_path_on_disk)
    pages_text = []
    pages_images = []

    for page in doc:
        text = page.get_text().strip()
        if text:
            pages_text.append(text)
        else:
            # No selectable text — render page as image for vision
            pix = page.get_pixmap(dpi=200)
            pages_images.append(pix.tobytes("png"))

    doc.close()

    full_text = "\n\n--- Page Break ---\n\n".join(pages_text) if pages_text else ""
    return {
        "text": full_text,
        "images": pages_images,
        "has_text": bool(full_text),
        "page_count": len(pages_text) + len(pages_images),
    }


async def classify_document(
    file_path: str,
    original_filename: str,
    mime_type: str,
    file_size: int,
    user_caption: str = "",
    image_data: bytes = None,
) -> dict:
    """
    Classify a document using Sonnet vision (images) or text extraction (PDFs).
    Extracts specific data points: names, IDs, dates, amounts, addresses.
    """
    from backend import llm_client
    import asyncio

    system_prompt = f"""You are a document data extractor. Your job is to READ the document and EXTRACT all important information.

Return a JSON object with:
- "title": short descriptive title (e.g., "Nevada Driver's License - Gunnar Anderson", "Employment Contract - TechCo Japan")
- "summary": A structured extraction of ALL important data found. Format as a list:
  * Full names (holder, issuer, parties involved)
  * ID/license/account/policy numbers (EXACT numbers as written)
  * Dates (birth, issue, expiry, effective — in ISO format where possible)
  * Monetary amounts (salaries, fees, totals)
  * Addresses (full addresses as written)
  * Key terms, conditions, or findings (1-2 sentences max each)
  Skip any field not present. Do NOT include boilerplate text, legal disclaimers, or generic descriptions.
  Be SPECIFIC — copy exact numbers, names, and dates from the document.
- "tags": array of tags from: {sorted(VALID_TAGS)}. Pick 1-3 most relevant.
- "category": one of: finance, health, investing, life
- "date": most relevant ISO date from the document (issue date, visit date, etc.)
- "provider": organization/company/clinic name

User context: "{user_caption or 'No caption provided'}"
Filename: {original_filename}

Return ONLY the JSON object."""

    try:
        is_image = mime_type and mime_type.startswith("image/")
        is_pdf = mime_type and mime_type == "application/pdf"
        send_image = None
        send_mime = "image/jpeg"
        extra_images = []
        user_message = f"Extract all data from this document: {original_filename}"
        if user_caption:
            user_message += f"\nContext: {user_caption}"

        if is_image and image_data:
            # Direct image — send to Sonnet vision
            send_image = image_data
            send_mime = mime_type

        elif is_pdf:
            # Extract text or render as images
            full_disk_path = str(PROJECT_ROOT / "data" / "files" / file_path)
            pdf_content = await asyncio.to_thread(_extract_pdf_content, full_disk_path)

            if pdf_content["has_text"]:
                # Text-based PDF — send extracted text (no vision needed)
                text_preview = pdf_content["text"][:8000]
                user_message += f"\n\nExtracted PDF text ({pdf_content['page_count']} pages):\n{text_preview}"
            elif pdf_content["images"]:
                # Scanned PDF — send all pages as images (up to 6)
                send_image = pdf_content["images"][0]
                send_mime = "image/png"
                extra_images = pdf_content["images"][1:6]
                if len(pdf_content["images"]) > 1:
                    user_message += f"\n\n(Scanned PDF: {len(pdf_content['images'])} pages)"

        # Build API call — supports multiple images for multi-page scanned PDFs
        import base64 as b64
        content = []
        if send_image:
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": send_mime, "data": b64.b64encode(send_image).decode()},
            })
            for extra_img in extra_images:
                content.append({
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/png", "data": b64.b64encode(extra_img).decode()},
                })
        content.append({"type": "text", "text": user_message})

        client = llm_client._get_client()
        response = await client.messages.create(
            model=llm_client.MODEL,  # Sonnet — better vision + extraction
            max_tokens=1500,
            system=system_prompt,
            messages=[{"role": "user", "content": content}],
        )
        result = llm_client._extract_json(response.content[0].text.strip())

        # Validate and sanitize
        title = result.get("title", original_filename)
        raw_summary = result.get("summary", "")
        # Summary might come back as a list of extracted fields — convert to string
        if isinstance(raw_summary, list):
            summary = "\n".join(f"• {item}" for item in raw_summary if item)
        elif isinstance(raw_summary, dict):
            summary = "\n".join(f"• {k}: {v}" for k, v in raw_summary.items() if v)
        else:
            summary = str(raw_summary) if raw_summary else ""
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
        logger.error(f"Document classification failed: {e}", exc_info=True)
        # Fallback
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
