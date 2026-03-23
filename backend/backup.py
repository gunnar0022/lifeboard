"""
Backup system — scheduled snapshots of database, files, and creative content.

- Daily: creative workspace files (14-day rolling window)
- Twice weekly (Mon + Thu): full system backup (8-backup rolling window)
- Manual: on-demand via API or Telegram, no retention limit
"""
import asyncio
import logging
import shutil
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from backend.config import get_config

logger = logging.getLogger("lifeboard")

PROJECT_ROOT = Path(__file__).parent.parent
BACKUP_ROOT = PROJECT_ROOT / "backups"
CREATIVE_BACKUP_DIR = BACKUP_ROOT / "creative"
FULL_BACKUP_DIR = BACKUP_ROOT / "full"

CREATIVE_RETENTION = 14  # keep last 14 daily creative backups
FULL_RETENTION = 8       # keep last 8 full backups

_backup_task: asyncio.Task | None = None


def _ensure_dirs():
    CREATIVE_BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    FULL_BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def _zip_directory(source_dir: Path, zip_path: Path, base_name: str = ""):
    """Recursively zip a directory."""
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in source_dir.rglob("*"):
            if file_path.is_file():
                arcname = str(file_path.relative_to(source_dir))
                if base_name:
                    arcname = f"{base_name}/{arcname}"
                zf.write(file_path, arcname)


def backup_creative(manual: bool = False) -> Path | None:
    """Backup the creative workspace files."""
    _ensure_dirs()
    creative_dir = PROJECT_ROOT / "data" / "creative"
    if not creative_dir.exists() or not any(creative_dir.iterdir()):
        logger.info("No creative content to backup")
        return None

    suffix = "-manual" if manual else ""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    zip_name = f"creative-{timestamp}{suffix}.zip"
    zip_path = CREATIVE_BACKUP_DIR / zip_name

    _zip_directory(creative_dir, zip_path, "creative")
    logger.info(f"Creative backup: {zip_path} ({zip_path.stat().st_size / 1024:.1f} KB)")

    if not manual:
        _enforce_retention(CREATIVE_BACKUP_DIR, CREATIVE_RETENTION)

    return zip_path


def backup_full(manual: bool = False) -> Path | None:
    """Backup database, uploaded files, tokens, and config (not creative)."""
    _ensure_dirs()

    suffix = "-manual" if manual else ""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    zip_name = f"lifeboard-{timestamp}{suffix}.zip"
    zip_path = FULL_BACKUP_DIR / zip_name

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Database
        db_path = PROJECT_ROOT / "data" / "lifeboard.db"
        if db_path.exists():
            zf.write(db_path, "lifeboard.db")

        # Uploaded files (documents, photos)
        files_dir = PROJECT_ROOT / "data" / "files"
        if files_dir.exists():
            for file_path in files_dir.rglob("*"):
                if file_path.is_file():
                    zf.write(file_path, f"files/{file_path.relative_to(files_dir)}")

        # Google tokens
        tokens_path = PROJECT_ROOT / "data" / "google_tokens.json"
        if tokens_path.exists():
            zf.write(tokens_path, "google_tokens.json")

        # User config
        config_path = PROJECT_ROOT / "user_config.json"
        if config_path.exists():
            zf.write(config_path, "user_config.json")

    logger.info(f"Full backup: {zip_path} ({zip_path.stat().st_size / 1024:.1f} KB)")

    if not manual:
        _enforce_retention(FULL_BACKUP_DIR, FULL_RETENTION)

    return zip_path


def backup_all_manual() -> dict:
    """Run both backups manually (no retention enforcement)."""
    creative_path = backup_creative(manual=True)
    full_path = backup_full(manual=True)
    return {
        "creative": str(creative_path) if creative_path else None,
        "full": str(full_path) if full_path else None,
        "timestamp": datetime.now().isoformat(),
    }


def _enforce_retention(backup_dir: Path, max_count: int):
    """Delete oldest non-manual backups beyond the retention limit."""
    zips = sorted(
        [f for f in backup_dir.glob("*.zip") if "-manual" not in f.name],
        key=lambda f: f.stat().st_mtime,
    )
    while len(zips) > max_count:
        oldest = zips.pop(0)
        oldest.unlink()
        logger.info(f"Deleted old backup: {oldest.name}")


def list_backups() -> dict:
    """List all available backups."""
    _ensure_dirs()
    creative = sorted(CREATIVE_BACKUP_DIR.glob("*.zip"), key=lambda f: f.stat().st_mtime, reverse=True)
    full = sorted(FULL_BACKUP_DIR.glob("*.zip"), key=lambda f: f.stat().st_mtime, reverse=True)
    return {
        "creative": [
            {"name": f.name, "size_kb": round(f.stat().st_size / 1024, 1), "date": datetime.fromtimestamp(f.stat().st_mtime).isoformat()}
            for f in creative
        ],
        "full": [
            {"name": f.name, "size_kb": round(f.stat().st_size / 1024, 1), "date": datetime.fromtimestamp(f.stat().st_mtime).isoformat()}
            for f in full
        ],
    }


# --- Scheduler ---

async def start_backup_scheduler():
    global _backup_task
    _backup_task = asyncio.create_task(_backup_loop())
    logger.info("Backup scheduler started")


async def stop_backup_scheduler():
    global _backup_task
    if _backup_task and not _backup_task.done():
        _backup_task.cancel()
        try:
            await _backup_task
        except asyncio.CancelledError:
            pass
    _backup_task = None
    logger.info("Backup scheduler stopped")


async def _backup_loop():
    """Run backup checks every hour. Execute based on schedule."""
    config = get_config()
    tz = ZoneInfo(config.get("timezone", "UTC"))

    while True:
        try:
            now = datetime.now(tz)
            hour = now.hour
            weekday = now.weekday()  # 0=Monday

            # Daily creative backup at 2 AM
            if hour == 2:
                await asyncio.to_thread(backup_creative)

            # Full backup on Monday (0) and Thursday (3) at 3 AM
            if hour == 3 and weekday in (0, 3):
                await asyncio.to_thread(backup_full)

            # Sleep until next hour
            next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
            wait = (next_hour - now).total_seconds()
            await asyncio.sleep(max(wait, 60))

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Backup loop error: {e}")
            await asyncio.sleep(3600)
