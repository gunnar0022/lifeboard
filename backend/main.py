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



# --- Serve built frontend (production) ---
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Serve static assets (JS, CSS, images)
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
