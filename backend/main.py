"""
LifeBoard — FastAPI backend
Serves the dashboard, API routes, and runs the Telegram bot.
"""
import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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


@app.get("/api/nudges")
async def get_nudges():
    """Aggregated nudges from all agents."""
    all_nudges = []
    errors = []
    try:
        from backend.agents.finance.nudges import check_nudges as finance_nudges
        all_nudges.extend(await finance_nudges())
    except Exception as e:
        logger.error(f"Finance nudge check failed: {e}")
        errors.append(f"finance: {e}")
    try:
        from backend.agents.life_manager.nudges import check_nudges as life_nudges
        all_nudges.extend(await life_nudges())
    except Exception as e:
        logger.error(f"Life Manager nudge check failed: {e}")
        errors.append(f"life_manager: {e}")
    try:
        from backend.agents.health_body.nudges import check_nudges as health_nudges
        all_nudges.extend(await health_nudges())
    except Exception as e:
        logger.error(f"Health nudge check failed: {e}")
        errors.append(f"health_body: {e}")
    try:
        from backend.agents.investing.nudges import check_nudges as investing_nudges
        all_nudges.extend(await investing_nudges())
    except Exception as e:
        logger.error(f"Investing nudge check failed: {e}")
        errors.append(f"investing: {e}")
    try:
        from backend.agents.reading_creative.nudges import check_nudges as creative_nudges
        all_nudges.extend(await creative_nudges())
    except Exception as e:
        logger.error(f"Reading & Creative nudge check failed: {e}")
        errors.append(f"reading_creative: {e}")
    if errors:
        logger.error(f"Nudge errors: {errors}")
    # Sort: alert > warning > info
    severity_order = {"alert": 0, "warning": 1, "info": 2}
    all_nudges.sort(key=lambda n: severity_order.get(n.get("severity", "info"), 3))
    return all_nudges


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
    """Check if Google Calendar is connected."""
    from backend.google_calendar import is_connected
    return {"connected": is_connected()}

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
