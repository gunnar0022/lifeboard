"""
LifeBoard — FastAPI backend
Serves the dashboard, API routes, and runs the Telegram bot.
"""
import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, Form, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.ws_manager import manager as ws_manager

from backend.database import init_db
from backend.config import get_config, get_currency_symbol
from backend.agents.registry import discover_agents, get_agent_routers
from backend.telegram_bot.bot import start_bot, stop_bot

# Load environment
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("lifeboard")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Initialize database
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database ready")

    # Start Telegram bot
    logger.info("Starting Telegram bot...")
    await start_bot()

    # Start schedulers for active agents
    config = get_config()
    active = config.get("active_agents", [])
    health_scheduler_running = False
    finance_scheduler_running = False
    investing_scheduler_running = False
    fleet_scheduler_running = False

    if "health_body" in active:
        try:
            from backend.agents.health_body.scheduler import start_scheduler as start_health_scheduler
            await start_health_scheduler()
            health_scheduler_running = True
        except Exception as e:
            logger.error(f"Health scheduler failed to start: {e}")

    if "finance" in active:
        try:
            from backend.agents.finance.scheduler import start_scheduler as start_finance_scheduler
            await start_finance_scheduler()
            finance_scheduler_running = True
        except Exception as e:
            logger.error(f"Finance scheduler failed to start: {e}")

    if "investing" in active:
        try:
            from backend.agents.investing.scheduler import start_scheduler as start_investing_scheduler
            await start_investing_scheduler()
            investing_scheduler_running = True
        except Exception as e:
            logger.error(f"Investing scheduler failed to start: {e}")

    # Fleet scheduler (compression + orphaned session recovery) — always runs if health is active
    if "health_body" in active:
        try:
            from backend.agents.fleet.scheduler import start_scheduler as start_fleet_scheduler
            await start_fleet_scheduler()
            fleet_scheduler_running = True
        except Exception as e:
            logger.error(f"Fleet scheduler failed to start: {e}")

    # Google Calendar sync + reminder scheduler
    google_cal_running = False
    if "life_manager" in active:
        try:
            from backend.google_calendar import start_sync_scheduler, is_connected
            if is_connected():
                await start_sync_scheduler()
                google_cal_running = True
                logger.info("Google Calendar sync started")
            else:
                logger.info("Google Calendar not connected — visit /api/google/auth to connect")
        except Exception as e:
            logger.error(f"Google Calendar scheduler failed: {e}")

    # System schedulers (FX, weather, morning briefing)
    system_schedulers_running = False
    try:
        from backend.schedulers import start_schedulers as start_system_schedulers
        await start_system_schedulers()
        system_schedulers_running = True
    except Exception as e:
        logger.error(f"System schedulers failed to start: {e}")

    # Backup scheduler
    backup_running = False
    try:
        from backend.backup import start_backup_scheduler
        await start_backup_scheduler()
        backup_running = True
    except Exception as e:
        logger.error(f"Backup scheduler failed to start: {e}")

    yield

    # Shutdown schedulers
    if health_scheduler_running:
        try:
            from backend.agents.health_body.scheduler import stop_scheduler as stop_health_scheduler
            await stop_health_scheduler()
        except Exception as e:
            logger.error(f"Health scheduler stop error: {e}")

    if finance_scheduler_running:
        try:
            from backend.agents.finance.scheduler import stop_scheduler as stop_finance_scheduler
            await stop_finance_scheduler()
        except Exception as e:
            logger.error(f"Finance scheduler stop error: {e}")

    if investing_scheduler_running:
        try:
            from backend.agents.investing.scheduler import stop_scheduler as stop_investing_scheduler
            await stop_investing_scheduler()
        except Exception as e:
            logger.error(f"Investing scheduler stop error: {e}")

    if fleet_scheduler_running:
        try:
            from backend.agents.fleet.scheduler import stop_scheduler as stop_fleet_scheduler
            await stop_fleet_scheduler()
        except Exception as e:
            logger.error(f"Fleet scheduler stop error: {e}")

    if google_cal_running:
        try:
            from backend.google_calendar import stop_sync_scheduler
            await stop_sync_scheduler()
        except Exception as e:
            logger.error(f"Google Calendar scheduler stop error: {e}")

    if system_schedulers_running:
        try:
            from backend.schedulers import stop_schedulers as stop_system_schedulers
            await stop_system_schedulers()
        except Exception as e:
            logger.error(f"System schedulers stop error: {e}")

    if backup_running:
        try:
            from backend.backup import stop_backup_scheduler
            await stop_backup_scheduler()
        except Exception as e:
            logger.error(f"Backup scheduler stop error: {e}")

    logger.info("Shutting down Telegram bot...")
    await stop_bot()


app = FastAPI(title="LifeBoard", version="0.1.0", lifespan=lifespan)

# CORS — permissive in dev, unnecessary in prod (same-origin)
env = os.getenv("ENV", "dev")
if env == "dev":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register agent routers
for router in get_agent_routers():
    app.include_router(router)

# DnD Character Sheet routes
from backend.dnd import router as dnd_router
app.include_router(dnd_router)

# System Health dashboard
from backend.system_health import router as system_health_router
app.include_router(system_health_router)

# Projects tab
from backend.projects import router as projects_router
app.include_router(projects_router)

# Garmin health data
from backend.garmin.routes import router as garmin_router
app.include_router(garmin_router)


# --- Setup Wizard API ---

@app.get("/api/setup/status")
async def setup_status():
    from backend.setup import get_setup_status
    return get_setup_status()

@app.post("/api/setup/env")
async def setup_env(body: dict):
    from backend.setup import save_env
    save_env(body)
    return {"ok": True}

@app.post("/api/setup/config")
async def setup_config(body: dict):
    from backend.setup import save_config
    save_config(body)
    return {"ok": True}

@app.post("/api/setup/test-anthropic")
async def setup_test_anthropic(body: dict):
    from backend.setup import test_anthropic_key
    return await test_anthropic_key(body.get("api_key", ""))

@app.post("/api/setup/test-telegram")
async def setup_test_telegram(body: dict):
    from backend.setup import test_telegram_token
    return await test_telegram_token(body.get("token", ""))

@app.post("/api/setup/health-profile")
async def setup_health_profile(body: dict):
    """Save health profile from the wizard."""
    from backend.agents.health_body.queries import upsert_profile
    await upsert_profile(**body)
    return {"ok": True}

@app.post("/api/setup/add-holding")
async def setup_add_holding(body: dict):
    """Add an investment holding from the wizard (skips if symbol already exists)."""
    from backend.agents.investing.queries import add_holding, record_transaction, get_holdings
    # Prevent duplicates on repeated wizard runs
    existing = await get_holdings()
    symbol = body["symbol"].strip().upper()
    for h in existing:
        if h["symbol"] == symbol:
            return {"ok": True, "skipped": True, "holding_id": h["id"]}
    holding = await add_holding(
        symbol=symbol,
        name=body.get("name", symbol),
        asset_class=body.get("asset_class", "stock"),
        currency=body.get("currency", "USD"),
    )
    if body.get("shares") and body.get("price"):
        price_int = int(float(body["price"]) * (100 if body.get("currency", "USD") != "JPY" else 1))
        await record_transaction(
            holding_id=holding["id"],
            tx_type="buy",
            shares=float(body["shares"]),
            price_per_share=price_int,
            total_amount=int(float(body["shares"]) * price_int),
            currency=body.get("currency", "USD"),
            date_str=body.get("date"),
        )
    # Immediately fetch current market price
    try:
        from backend.agents.investing.scheduler import refresh_single_holding_price
        await refresh_single_holding_price(holding["id"])
    except Exception:
        pass  # Non-critical — daily scheduler will catch it
    return {"ok": True}

@app.post("/api/setup/add-book")
async def setup_add_book(body: dict):
    """Add a book from the wizard (skips if title already exists)."""
    from backend.agents.reading_creative.queries import add_book, get_books
    # Prevent duplicates on repeated wizard runs
    existing = await get_books()
    title = body["title"].strip()
    for b in existing:
        if b["title"].lower() == title.lower():
            return {"ok": True, "skipped": True}
    await add_book(
        title=title,
        author=body.get("author"),
        status=body.get("status", "reading"),
    )
    return {"ok": True}

@app.post("/api/setup/complete")
async def setup_complete():
    """Mark setup as complete."""
    from backend.setup import save_config
    save_config({"setup_complete": True})
    return {"ok": True}


# --- Shell-level API routes ---


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "lifeboard"}


@app.get("/api/config")
async def get_user_config():
    """Return user config for the frontend (non-sensitive fields)."""
    config = get_config()
    return {
        "display_name": config.get("display_name", "friend"),
        "timezone": config.get("timezone", "UTC"),
        "primary_currency": config.get("primary_currency", "USD"),
        "currency_symbol": get_currency_symbol(),
        "secondary_currency": config.get("secondary_currency"),
        "pay_cycle_day": config.get("pay_cycle_day", 1),
        "locale": config.get("locale", "en"),
    }


@app.get("/api/agents")
async def get_agents():
    """Return all agent configs for the sidebar."""
    return discover_agents()


async def _collect_nudges() -> list[dict]:
    """Collect nudges from all agents. Used by both API and morning briefing."""
    all_nudges = []
    for mod_path, label in [
        ("backend.agents.finance.nudges", "Finance"),
        ("backend.agents.life_manager.nudges", "Life Manager"),
        ("backend.agents.health_body.nudges", "Health"),
        ("backend.agents.investing.nudges", "Investing"),
        ("backend.agents.reading_creative.nudges", "Creative"),
    ]:
        try:
            from importlib import import_module
            mod = import_module(mod_path)
            all_nudges.extend(await mod.check_nudges())
        except Exception as e:
            logger.error(f"{label} nudge check failed: {e}")
    severity_order = {"alert": 0, "warning": 1, "info": 2}
    all_nudges.sort(key=lambda n: severity_order.get(n.get("severity", "info"), 3))
    return all_nudges


@app.get("/api/nudges")
async def get_nudges():
    """Aggregated nudges from all agents."""
    return await _collect_nudges()


# --- Google Calendar OAuth ---

@app.get("/api/google/auth")
async def google_auth():
    """Redirect to Google OAuth consent screen."""
    from backend.google_calendar import get_auth_url
    from fastapi.responses import RedirectResponse
    return RedirectResponse(get_auth_url())

@app.get("/api/google/callback")
async def google_callback(code: str):
    """Handle OAuth callback from Google."""
    from backend.google_calendar import exchange_code, start_sync_scheduler
    from fastapi.responses import RedirectResponse
    import asyncio
    try:
        await asyncio.to_thread(exchange_code, code)
        logger.info("Google OAuth token exchange successful")
    except Exception as e:
        logger.error(f"Google OAuth token exchange failed: {e}", exc_info=True)
        return {"error": f"Token exchange failed: {str(e)}"}
    # Start sync now that we're connected
    try:
        await start_sync_scheduler()
    except Exception as e:
        logger.error(f"Failed to start sync after auth: {e}")
    return RedirectResponse("/")

@app.get("/api/google/status")
async def google_status():
    """Check if Google Calendar is connected and whether credentials are configured."""
    import os
    from backend.google_calendar import is_connected
    has_creds = bool(os.getenv("GOOGLE_CLIENT_ID")) and bool(os.getenv("GOOGLE_CLIENT_SECRET"))
    return {"connected": is_connected(), "has_credentials": has_creds}

@app.post("/api/google/sync")
async def google_sync():
    """Manually trigger a Google Calendar sync."""
    from backend.google_calendar import sync_calendar
    await sync_calendar()
    return {"ok": True}


# --- Backup API ---

@app.post("/api/backup")
async def manual_backup():
    """Trigger a manual backup of everything."""
    import asyncio
    from backend.backup import backup_all_manual
    result = await asyncio.to_thread(backup_all_manual)
    return result

@app.get("/api/backups")
async def list_all_backups():
    """List all available backups."""
    from backend.backup import list_backups
    return list_backups()


# --- Settings API ---

@app.get("/api/settings")
async def get_settings():
    """Get user settings for the settings panel."""
    from backend.config import get_config
    config = get_config()
    # Fetch evening_checkin_time from health profile
    checkin_time = "21:00"
    try:
        from backend.database import get_db
        db = await get_db()
        try:
            cursor = await db.execute("SELECT evening_checkin_time FROM health_profile LIMIT 1")
            row = await cursor.fetchone()
            if row:
                checkin_time = row["evening_checkin_time"] or "21:00"
        finally:
            await db.close()
    except Exception:
        pass

    # Migrate old flat panel keys to new dot-notation format
    raw_panels = config.get("panels", {})
    if raw_panels and not any('.' in k for k in raw_panels):
        # Old format detected — migrate
        migrated = {}
        mapping = {
            "life_manager": ("organizer", ["calendar", "tasks_bills", "documents"]),
            "health_body": ("health_fitness", ["health", "fitness"]),
            "finance": ("money", ["finance"]),
            "investing": ("money", ["investing"]),
            "reading_creative": ("creative", ["workspace", "reading", "dnd"]),
            "projects": ("projects", []),
        }
        parents_seen = {}
        for old_id, (parent, subs) in mapping.items():
            was_on = raw_panels.get(old_id, True) is not False
            if parent not in parents_seen:
                parents_seen[parent] = False
            if was_on:
                parents_seen[parent] = True
            for sub in subs:
                migrated[f"{parent}.{sub}"] = was_on
        for parent, visible in parents_seen.items():
            migrated[parent] = visible
        migrated.setdefault("system", True)
        migrated.setdefault("system.health", True)
        raw_panels = migrated

    # Ensure defaults for any missing keys
    defaults = {
        "organizer": True, "organizer.calendar": True, "organizer.tasks_bills": True, "organizer.documents": True,
        "health_fitness": True, "health_fitness.health": True, "health_fitness.fitness": True,
        "money": True, "money.finance": True, "money.investing": True,
        "creative": True, "creative.workspace": True, "creative.reading": True, "creative.dnd": True,
        "projects": True,
        "system": True, "system.health": True,
    }
    for key, default_val in defaults.items():
        if key not in raw_panels:
            raw_panels[key] = default_val

    return {
        "theme": config.get("theme", "dark"),
        "panels": raw_panels,
        "pay_cycle_day": config.get("pay_cycle_day", 25),
        "timezone": config.get("timezone", "Asia/Tokyo"),
        "weather_location": config.get("weather_location", "oyama"),
        "evening_checkin_time": checkin_time,
    }


@app.put("/api/settings")
async def update_settings(body: dict):
    """Update user settings."""
    from backend.config import get_config, CONFIG_PATH
    import json as _json

    config = get_config()
    updated = False

    for key in ("theme", "panels", "pay_cycle_day"):
        if key in body:
            config[key] = body[key]
            updated = True

    if updated:
        # Invalidate cache
        import backend.config as _cfg
        _cfg._config_cache = None
        _cfg._config_mtime = None
        CONFIG_PATH.write_text(_json.dumps(config, indent=2, ensure_ascii=False))

    # Evening checkin time goes to health_profile table
    if "evening_checkin_time" in body:
        try:
            from backend.database import get_db
            db = await get_db()
            try:
                await db.execute(
                    "UPDATE health_profile SET evening_checkin_time = ?",
                    (body["evening_checkin_time"],)
                )
                await db.commit()
            finally:
                await db.close()
        except Exception as e:
            logger.error(f"Failed to update evening_checkin_time: {e}")

    return await get_settings()


@app.get("/api/settings/backup")
async def download_backup():
    """Download the database as a backup file."""
    import shutil
    from datetime import date as _date
    from fastapi.responses import FileResponse
    from backend.database import DB_PATH, get_db

    # WAL checkpoint to ensure .db file is self-contained
    db = await get_db()
    try:
        await db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    finally:
        await db.close()

    # Copy to temp file for download
    backup_name = f"lifeboard-backup-{_date.today().isoformat()}.db"
    backup_path = DB_PATH.parent / backup_name
    shutil.copy2(str(DB_PATH), str(backup_path))

    return FileResponse(
        path=str(backup_path),
        filename=backup_name,
        media_type="application/octet-stream",
    )


@app.post("/api/settings/restore")
async def restore_backup(file: UploadFile):
    """Restore database from an uploaded backup file."""
    import shutil
    import tempfile
    from datetime import datetime as _dt
    from backend.database import DB_PATH, get_db, init_db

    # Save uploaded file to temp location
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
    try:
        content = await file.read()
        tmp.write(content)
        tmp.close()

        # Validate it's a real SQLite database
        import aiosqlite
        try:
            test_db = await aiosqlite.connect(tmp.name)
            cursor = await test_db.execute("PRAGMA integrity_check")
            result = await cursor.fetchone()
            await test_db.close()
            if result[0] != "ok":
                raise ValueError(f"Database integrity check failed: {result[0]}")
        except Exception as e:
            os.unlink(tmp.name)
            raise HTTPException(400, f"Invalid database file: {str(e)}")

        # Safety backup of current database
        timestamp = _dt.now().strftime("%Y%m%d-%H%M%S")
        safety_path = DB_PATH.parent / f"lifeboard-pre-restore-{timestamp}.db"
        shutil.copy2(str(DB_PATH), str(safety_path))
        logger.info(f"Safety backup saved to {safety_path}")

        # Replace the database
        shutil.copy2(tmp.name, str(DB_PATH))
        os.unlink(tmp.name)

        # Reinitialize to ensure new tables exist
        await init_db()

        return {
            "success": True,
            "message": f"Database restored. Previous database saved as {safety_path.name}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Restore failed: {e}", exc_info=True)
        raise HTTPException(500, f"Restore failed: {str(e)}")


# --- Event enrichment (set reminders from dashboard) ---

from pydantic import BaseModel
from typing import Optional

class ReminderUpdate(BaseModel):
    reminder_offset: Optional[int] = None

@app.put("/api/events/{event_id}/reminder")
async def update_event_reminder(event_id: int, body: ReminderUpdate):
    """Set or clear a reminder for an event."""
    from backend.agents.life_manager.queries import set_event_reminder as _set_reminder
    result = await _set_reminder(event_id, body.reminder_offset)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(404, "Event not found")
    return result


# --- Unified Document API (shell-level, spans all agents) ---

@app.get("/api/documents")
async def list_documents(query: str = None, tag: str = None, category: str = None, limit: int = 50):
    from backend.documents import search_documents
    tags = [tag] if tag else None
    return await search_documents(query=query, tags=tags, category=category, limit=limit)

@app.get("/api/documents/tags")
async def list_document_tags():
    from backend.documents import get_all_tags_in_use
    return await get_all_tags_in_use()

@app.get("/api/documents/{doc_id}")
async def get_document_detail(doc_id: int):
    from backend.documents import get_document
    doc = await get_document(doc_id)
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(404, "Document not found")
    return doc

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[list] = None
    category: Optional[str] = None
    provider: Optional[str] = None
    date: Optional[str] = None

@app.put("/api/documents/{doc_id}")
async def update_document_entry(doc_id: int, body: DocumentUpdate):
    from backend.documents import update_document
    result = await update_document(doc_id, **body.model_dump(exclude_none=True))
    if not result:
        from fastapi import HTTPException
        raise HTTPException(404, "Document not found")
    return result

@app.delete("/api/documents/{doc_id}")
async def delete_document_entry(doc_id: int):
    from backend.documents import delete_document
    if not await delete_document(doc_id):
        from fastapi import HTTPException
        raise HTTPException(404, "Document not found")
    return {"ok": True}

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile,
    title: str = Form(""),
    summary: str = Form(""),
    tags: str = Form(""),
    category: str = Form("life"),
    provider: str = Form(""),
    date: str = Form(""),
):
    """Upload a document with manual metadata (no AI processing)."""
    import uuid
    from backend.documents import store_document

    # Save file to disk
    files_dir = PROJECT_ROOT / "data" / "files"
    files_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix if file.filename else ""
    safe_name = f"{uuid.uuid4().hex[:12]}{ext}"
    file_path = files_dir / safe_name

    content = await file.read()
    file_path.write_bytes(content)

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    doc = await store_document(
        title=title or file.filename or "Untitled",
        summary=summary or None,
        tags=tag_list,
        category=category or "life",
        file_path=safe_name,
        original_filename=file.filename,
        mime_type=file.content_type,
        file_size=len(content),
        date=date or None,
        provider=provider or None,
    )
    return doc


@app.get("/api/documents/{doc_id}/view")
async def view_document_file(doc_id: int):
    from backend.documents import get_document
    doc = await get_document(doc_id)
    if not doc or not doc.get("file_path"):
        from fastapi import HTTPException
        raise HTTPException(404, "File not found")
    full_path = PROJECT_ROOT / "data" / "files" / doc["file_path"]
    if not full_path.exists():
        from fastapi import HTTPException
        raise HTTPException(404, "File missing from disk")
    return FileResponse(str(full_path), media_type=doc.get("mime_type", "application/octet-stream"), filename=doc.get("original_filename"))


# --- WebSocket for live dashboard updates ---

@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        ws_manager.disconnect(websocket)


# --- Serve built frontend (production) --- (MUST be last — catch-all route)
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"


def _register_spa_routes():
    """Register SPA routes at the very end so they don't catch API routes."""
    if not FRONTEND_DIST.exists():
        return

    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST / "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the SPA — all non-API routes return index.html."""
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST / "index.html"))


# Serve uploaded files
DATA_FILES = PROJECT_ROOT / "data" / "files"
if DATA_FILES.exists():
    app.mount(
        "/files",
        StaticFiles(directory=str(DATA_FILES)),
        name="uploaded_files",
    )

# Register SPA catch-all LAST so it doesn't intercept API routes
_register_spa_routes()
