"""System Health endpoint — live Mac Mini metrics."""
import json
import logging
import os
import platform
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

import psutil
from fastapi import APIRouter

from backend.database import DB_PATH

logger = logging.getLogger("lifeboard")

router = APIRouter(tags=["system_health"])

# Module-level state for network throughput calculation
_prev_net = None  # {"bytes_sent": int, "bytes_recv": int, "time": float}


def _format_uptime(seconds: float) -> int:
    return int(seconds)


def _get_system_info() -> dict:
    mac_ver = platform.mac_ver()[0] or "Unknown"
    chip = platform.processor() or "Unknown"
    arch = platform.machine()
    boot_time = psutil.boot_time()
    uptime = time.time() - boot_time
    return {
        "hostname": platform.node(),
        "macos_version": mac_ver,
        "chip": chip,
        "architecture": arch,
        "uptime_seconds": _format_uptime(uptime),
    }


def _get_cpu() -> dict:
    overall = psutil.cpu_percent(interval=None)
    per_core = psutil.cpu_percent(interval=None, percpu=True)
    core_count = psutil.cpu_count()

    # Try to get CPU temperature
    temp = None
    try:
        result = subprocess.run(
            ["osx-cpu-temp"], capture_output=True, text=True, timeout=3
        )
        if result.returncode == 0:
            temp_str = result.stdout.strip().replace("°C", "").strip()
            temp = float(temp_str)
    except (FileNotFoundError, subprocess.TimeoutExpired, ValueError):
        pass

    return {
        "overall_percent": overall,
        "per_core_percent": per_core,
        "core_count": core_count,
        "temperature_celsius": temp,
    }


def _get_memory() -> dict:
    vm = psutil.virtual_memory()
    swap = psutil.swap_memory()
    return {
        "total_bytes": vm.total,
        "used_bytes": vm.used,
        "available_bytes": vm.available,
        "percent": vm.percent,
        "swap_total_bytes": swap.total,
        "swap_used_bytes": swap.used,
    }


def _get_disk() -> dict:
    volumes = []

    # Use diskutil for accurate APFS container-level usage on macOS
    try:
        result = subprocess.run(
            ["diskutil", "apfs", "list", "-plist"],
            capture_output=True, timeout=5,
        )
        if result.returncode == 0:
            import plistlib
            plist = plistlib.loads(result.stdout)
            # Pick the largest APFS container (the main disk)
            containers = plist.get("Containers", [])
            main = max(containers, key=lambda c: c.get("CapacityCeiling", 0)) if containers else None
            if main:
                total = main.get("CapacityCeiling", 0)
                free = main.get("CapacityFree", 0)
                used = total - free
                pct = round((used / total) * 100, 1) if total > 0 else 0
                volumes.append({
                    "mount_point": "/",
                    "total_bytes": total,
                    "used_bytes": used,
                    "free_bytes": free,
                    "percent": pct,
                })
    except Exception as e:
        logger.warning(f"diskutil failed, falling back to psutil: {e}")

    # Fallback to psutil if diskutil didn't work
    if not volumes:
        try:
            usage = psutil.disk_usage("/")
            volumes.append({
                "mount_point": "/",
                "total_bytes": usage.total,
                "used_bytes": usage.used,
                "free_bytes": usage.free,
                "percent": usage.percent,
            })
        except Exception as e:
            logger.warning(f"Failed to get disk usage: {e}")

    db_size = 0
    try:
        db_size = os.path.getsize(DB_PATH)
    except Exception:
        pass

    return {
        "volumes": volumes,
        "lifeboard_db_size_bytes": db_size,
    }


def _get_network() -> dict:
    global _prev_net
    counters = psutil.net_io_counters()
    now = time.time()

    send_rate = None
    recv_rate = None

    if _prev_net is not None:
        elapsed = now - _prev_net["time"]
        if elapsed > 0:
            send_rate = (counters.bytes_sent - _prev_net["bytes_sent"]) / elapsed
            recv_rate = (counters.bytes_recv - _prev_net["bytes_recv"]) / elapsed

    _prev_net = {
        "bytes_sent": counters.bytes_sent,
        "bytes_recv": counters.bytes_recv,
        "time": now,
    }

    return {
        "bytes_sent_total": counters.bytes_sent,
        "bytes_recv_total": counters.bytes_recv,
        "send_rate_bytes_per_sec": round(send_rate) if send_rate is not None else None,
        "recv_rate_bytes_per_sec": round(recv_rate) if recv_rate is not None else None,
    }


def _get_top_processes() -> dict:
    procs = []
    for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info"]):
        try:
            info = p.info
            mem = info.get("memory_info")
            procs.append({
                "pid": info["pid"],
                "name": info["name"],
                "cpu_percent": info.get("cpu_percent") or 0.0,
                "memory_mb": round(mem.rss / (1024 * 1024), 1) if mem else 0,
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    by_cpu = sorted(procs, key=lambda p: p["cpu_percent"], reverse=True)[:10]
    by_memory = sorted(procs, key=lambda p: p["memory_mb"], reverse=True)[:10]

    return {
        "by_cpu": by_cpu,
        "by_memory": by_memory,
    }


def _get_services() -> dict:
    # FastAPI process info
    proc = psutil.Process(os.getpid())
    fastapi_info = {
        "pid": proc.pid,
        "memory_mb": round(proc.memory_info().rss / (1024 * 1024), 1),
        "uptime_seconds": int(time.time() - proc.create_time()),
    }

    # DB size
    db_size = 0
    try:
        db_size = os.path.getsize(DB_PATH)
    except Exception:
        pass

    # Docker containers
    containers = []
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{json .}}"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            for line in result.stdout.strip().split("\n"):
                try:
                    c = json.loads(line)
                    containers.append({
                        "id": c.get("ID", ""),
                        "name": c.get("Names", ""),
                        "image": c.get("Image", ""),
                        "status": c.get("Status", ""),
                        "ports": c.get("Ports", ""),
                    })
                except json.JSONDecodeError:
                    continue
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    return {
        "fastapi": fastapi_info,
        "db_size_bytes": db_size,
        "docker_containers": containers,
    }


@router.get("/api/weather")
async def weather():
    """Get cached weather data for dashboard."""
    from backend.schedulers import get_cached_weather, WEATHER_CODES
    weekly = await get_cached_weather("week_daily")
    hourly = await get_cached_weather("today_hourly")
    return {
        "weekly": weekly,
        "hourly": hourly,
        "codes": {str(k): v for k, v in WEATHER_CODES.items()},
    }


@router.post("/api/weather/refresh")
async def weather_refresh(body: dict = None):
    """Force re-fetch weather data, optionally for a specific location."""
    from backend.schedulers import fetch_weather_for_location
    location_key = (body or {}).get("location")
    await fetch_weather_for_location("week_daily", location_key)
    await fetch_weather_for_location("today_hourly", location_key)
    return {"ok": True}


@router.get("/api/system-health")
async def system_health():
    now = datetime.now(timezone.utc).isoformat()
    return {
        "timestamp": now,
        "system": _get_system_info(),
        "cpu": _get_cpu(),
        "memory": _get_memory(),
        "disk": _get_disk(),
        "network": _get_network(),
        "top_processes": _get_top_processes(),
        "services": _get_services(),
    }
