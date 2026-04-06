"""
System-level scheduled jobs: FX rates, weather, morning briefing.
Runs alongside agent-specific schedulers.
"""
import asyncio
import json
import logging
import os
from datetime import datetime, timedelta, date
from zoneinfo import ZoneInfo

import httpx

from backend.database import get_db
from backend.config import get_config

logger = logging.getLogger("lifeboard")

# --- Location config for weather ---
LOCATIONS = {
    "oyama": {"name": "Oyama, Tochigi", "lat": 36.3146, "lon": 139.8003, "active": True},
    "yurihonjo": {"name": "Yurihonjo, Akita", "lat": 39.3854, "lon": 140.0496},
    "tokyo": {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503},
}

# --- Task handles ---
_fx_task = None
_weather_hourly_task = None
_weather_daily_task = None
_briefing_task = None


# ──────────────────────── FX Rate ────────────────────────

async def fetch_fx_rate():
    """Pull JPY/USD rate from frankfurter.app and store in DB."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://api.frankfurter.app/latest?from=USD&to=JPY")
            resp.raise_for_status()
            data = resp.json()
            rate = data.get("rates", {}).get("JPY")
            if rate and rate > 0:
                db = await get_db()
                try:
                    await db.execute(
                        "INSERT INTO exchange_rates (pair, rate) VALUES ('JPY_USD', ?)",
                        (rate,),
                    )
                    await db.commit()
                    logger.info(f"FX rate updated: 1 USD = {rate} JPY")
                finally:
                    await db.close()
                return rate
    except Exception as e:
        logger.warning(f"FX rate fetch failed: {e}")
    return None


async def get_cached_fx_rate() -> dict:
    """Get the most recent FX rate from DB."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT rate, fetched_at FROM exchange_rates WHERE pair = 'JPY_USD' ORDER BY id DESC LIMIT 1"
        )
        row = await cursor.fetchone()
        if row:
            rate = row["rate"]
            return {
                "usd_to_jpy": rate,
                "jpy_to_usd": 1.0 / rate if rate > 0 else 0,
                "date": row["fetched_at"][:10],
                "source": "cached",
            }
        return {"usd_to_jpy": 159.0, "jpy_to_usd": 1 / 159.0, "date": "seed", "source": "seed"}
    finally:
        await db.close()


async def _fx_loop():
    """Daily FX rate fetch at 06:00 local time."""
    config = get_config()
    tz = ZoneInfo(config.get("timezone", "Asia/Tokyo"))
    while True:
        try:
            now = datetime.now(tz)
            target = now.replace(hour=6, minute=3, second=0, microsecond=0)
            if target <= now:
                target += timedelta(days=1)
            wait = (target - now).total_seconds()
            logger.info(f"Next FX rate fetch in {wait / 3600:.1f}h")
            await asyncio.sleep(wait)
            await fetch_fx_rate()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"FX loop error: {e}")
            await asyncio.sleep(3600)


# ──────────────────────── Weather ────────────────────────

def _get_active_location() -> dict:
    config = get_config()
    active_key = config.get("weather_location", None)
    if active_key and active_key in LOCATIONS:
        return {"key": active_key, **LOCATIONS[active_key]}
    # Fallback to hardcoded active flag
    for key, loc in LOCATIONS.items():
        if loc.get("active"):
            return {"key": key, **loc}
    first_key = next(iter(LOCATIONS))
    return {"key": first_key, **LOCATIONS[first_key]}


WEATHER_CODES = {
    0: {"label": "Sunny", "icon": "☀️"},
    1: {"label": "Partly cloudy", "icon": "⛅"}, 2: {"label": "Partly cloudy", "icon": "⛅"},
    3: {"label": "Cloudy", "icon": "☁️"},
    45: {"label": "Fog", "icon": "🌫️"}, 48: {"label": "Fog", "icon": "🌫️"},
    51: {"label": "Drizzle", "icon": "🌦️"}, 53: {"label": "Drizzle", "icon": "🌦️"},
    55: {"label": "Drizzle", "icon": "🌦️"}, 56: {"label": "Drizzle", "icon": "🌦️"},
    57: {"label": "Drizzle", "icon": "🌦️"},
    61: {"label": "Rain", "icon": "🌧️"}, 63: {"label": "Rain", "icon": "🌧️"},
    65: {"label": "Rain", "icon": "🌧️"}, 66: {"label": "Rain", "icon": "🌧️"},
    67: {"label": "Rain", "icon": "🌧️"},
    80: {"label": "Rain showers", "icon": "🌧️"}, 81: {"label": "Rain showers", "icon": "🌧️"},
    82: {"label": "Rain showers", "icon": "🌧️"},
    71: {"label": "Snow", "icon": "🌨️"}, 73: {"label": "Snow", "icon": "🌨️"},
    75: {"label": "Snow", "icon": "🌨️"}, 77: {"label": "Snow", "icon": "🌨️"},
    85: {"label": "Snow", "icon": "🌨️"}, 86: {"label": "Snow", "icon": "🌨️"},
    95: {"label": "Thunderstorm", "icon": "⛈️"}, 96: {"label": "Thunderstorm", "icon": "⛈️"},
    99: {"label": "Thunderstorm", "icon": "⛈️"},
}


async def fetch_weather(scope: str = "week_daily"):
    """Fetch weather from Open-Meteo and cache it."""
    loc = _get_active_location()
    try:
        params = {
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "timezone": "Asia/Tokyo",
        }
        if scope == "week_daily":
            params["daily"] = "temperature_2m_max,temperature_2m_min,weathercode"
            params["forecast_days"] = 7
        else:
            params["hourly"] = "temperature_2m,weathercode,precipitation_probability"
            params["forecast_days"] = 1

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
            resp.raise_for_status()
            data = resp.json()

        db = await get_db()
        try:
            # Upsert: delete old then insert
            await db.execute(
                "DELETE FROM weather_cache WHERE location_key = ? AND scope = ?",
                (loc["key"], scope),
            )
            await db.execute(
                "INSERT INTO weather_cache (location_key, payload, scope) VALUES (?, ?, ?)",
                (loc["key"], json.dumps(data), scope),
            )
            await db.commit()
            logger.info(f"Weather cache updated: {scope} for {loc['name']}")
        finally:
            await db.close()
        return data
    except Exception as e:
        logger.warning(f"Weather fetch failed ({scope}): {e}")
        return None


async def get_cached_weather(scope: str = "week_daily") -> dict | None:
    loc = _get_active_location()
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT payload, fetched_at FROM weather_cache WHERE location_key = ? AND scope = ? ORDER BY id DESC LIMIT 1",
            (loc["key"], scope),
        )
        row = await cursor.fetchone()
        if row:
            data = json.loads(row["payload"])
            data["_fetched_at"] = row["fetched_at"]
            data["_location"] = loc["name"]
            return data
        return None
    finally:
        await db.close()


async def _weather_hourly_loop():
    """Refresh today's hourly weather every hour."""
    while True:
        try:
            await asyncio.sleep(5)  # Initial small delay
            await fetch_weather("today_hourly")
            await asyncio.sleep(3600)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Weather hourly loop error: {e}")
            await asyncio.sleep(3600)


async def _weather_daily_loop():
    """Refresh 7-day forecast at 06:00 daily."""
    config = get_config()
    tz = ZoneInfo(config.get("timezone", "Asia/Tokyo"))
    # Initial fetch on startup
    await fetch_weather("week_daily")
    while True:
        try:
            now = datetime.now(tz)
            target = now.replace(hour=6, minute=5, second=0, microsecond=0)
            if target <= now:
                target += timedelta(days=1)
            wait = (target - now).total_seconds()
            logger.info(f"Next weather daily fetch in {wait / 3600:.1f}h")
            await asyncio.sleep(wait)
            await fetch_weather("week_daily")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Weather daily loop error: {e}")
            await asyncio.sleep(3600)


# ──────────────────────── Morning Briefing ────────────────────────

async def compose_morning_briefing() -> str:
    """Build the morning briefing message."""
    config = get_config()
    tz = ZoneInfo(config.get("timezone", "Asia/Tokyo"))
    now = datetime.now(tz)
    loc = _get_active_location()

    lines = []
    lines.append(f"*{now.strftime('%A, %B %d')} — {loc['name']}*")
    lines.append("")

    # Weather
    try:
        weather = await get_cached_weather("week_daily")
        if weather and "daily" in weather:
            daily = weather["daily"]
            today_idx = 0
            hi = daily["temperature_2m_max"][today_idx]
            lo = daily["temperature_2m_min"][today_idx]
            code = daily.get("weathercode", [0])[today_idx]
            w = WEATHER_CODES.get(code, {"label": "Unknown", "icon": "❓"})
            lines.append(f"{w['icon']} {w['label']} — {lo:.0f}°C / {hi:.0f}°C")
        else:
            lines.append("(weather unavailable)")
    except Exception:
        lines.append("(weather unavailable)")
    lines.append("")

    # Calendar events
    try:
        from backend.agents.life_manager.queries import get_events
        today_str = now.strftime("%Y-%m-%d")
        tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        events = await get_events(date_from=today_str, date_to=today_str, include_holidays=False)
        if events:
            lines.append("📅 *Today's schedule:*")
            for ev in events:
                time_str = ""
                if not ev.get("all_day"):
                    st = ev.get("start_time", "")
                    if "T" in st:
                        time_str = st.split("T")[1][:5] + " "
                lines.append(f"  • {time_str}{ev['title']}")
        else:
            lines.append("📅 No events today")
    except Exception:
        lines.append("📅 (calendar unavailable)")
    lines.append("")

    # Nudges / high-priority
    try:
        from backend.main import _collect_nudges
        nudges = await _collect_nudges()
        alerts = [n for n in nudges if n["severity"] == "alert"]
        if alerts:
            lines.append("⚠️ *Alerts:*")
            for n in alerts[:3]:
                lines.append(f"  • {n['text']}")
            lines.append("")
    except Exception:
        pass

    # Yesterday's heatmap snapshot
    try:
        from backend.agents.health_body.queries import get_daily_summary
        yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        summary = await get_daily_summary(yesterday)
        if summary and summary.get("total_calories"):
            cal = summary["total_calories"]
            goal = 2200
            pct = round((cal / goal) * 100)
            block = min(30, max(1, round((min(cal / goal, 1.4) / 1.4) * 29) + 1))
            lines.append(f"📊 Yesterday: {cal} kcal ({pct}% of goal, block {block}/30)")
    except Exception:
        pass

    return "\n".join(lines)


async def send_morning_briefing():
    """Compose and send the morning briefing via Telegram."""
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        logger.warning("Morning briefing skipped: no Telegram credentials")
        return

    # Check if already sent today
    db = await get_db()
    try:
        today = date.today().isoformat()
        cursor = await db.execute(
            "SELECT id FROM briefing_history WHERE sent_at >= ?", (today,)
        )
        if await cursor.fetchone():
            logger.info("Morning briefing already sent today, skipping")
            return
    finally:
        await db.close()

    content = await compose_morning_briefing()

    try:
        from telegram import Bot
        bot = Bot(token=token)
        await bot.send_message(chat_id=chat_id, text=content, parse_mode="Markdown")
        logger.info("Morning briefing sent")

        db = await get_db()
        try:
            await db.execute(
                "INSERT INTO briefing_history (content) VALUES (?)", (content,)
            )
            await db.commit()
        finally:
            await db.close()
    except Exception as e:
        logger.error(f"Failed to send morning briefing: {e}")


async def _briefing_loop():
    """Send morning briefing at 07:00 daily."""
    config = get_config()
    tz = ZoneInfo(config.get("timezone", "Asia/Tokyo"))
    while True:
        try:
            now = datetime.now(tz)
            target = now.replace(hour=7, minute=0, second=0, microsecond=0)
            if target <= now:
                target += timedelta(days=1)
            wait = (target - now).total_seconds()
            logger.info(f"Next morning briefing in {wait / 3600:.1f}h")
            await asyncio.sleep(wait)
            await send_morning_briefing()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Briefing loop error: {e}")
            await asyncio.sleep(3600)


# ──────────────────────── Lifecycle ────────────────────────

async def start_schedulers():
    global _fx_task, _weather_hourly_task, _weather_daily_task, _briefing_task
    _fx_task = asyncio.create_task(_fx_loop())
    _weather_hourly_task = asyncio.create_task(_weather_hourly_loop())
    _weather_daily_task = asyncio.create_task(_weather_daily_loop())
    _briefing_task = asyncio.create_task(_briefing_loop())
    logger.info("System schedulers started (FX, weather, briefing)")

    # Fetch FX rate on startup if stale
    cached = await get_cached_fx_rate()
    if cached.get("source") == "seed":
        asyncio.create_task(fetch_fx_rate())


async def stop_schedulers():
    for task in [_fx_task, _weather_hourly_task, _weather_daily_task, _briefing_task]:
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
    logger.info("System schedulers stopped")
