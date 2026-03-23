"""
Telegram bot — primary input channel for LifeBoard.
Runs as a background task inside the FastAPI process (LM-12).
All messages route through the LLM router (LM-27) — no manual agent switching.
"""
import os
import logging
import asyncio
from telegram import Update, BotCommand
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes,
)
from backend.config import get_config

logger = logging.getLogger(__name__)


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    if not _is_authorized(update):
        return

    config = get_config()
    display_name = config.get("display_name", "friend")

    await update.message.reply_text(
        f"Hey {display_name}! Just send me a message and I'll route it automatically.\n\n"
        "*Agents:*\n"
        "  \U0001f4cb *Life Manager* \u2014 events, tasks, bills (syncs with Google Calendar)\n"
        "  \U0001f4aa *Health & Body* \u2014 meals, exercise, mood, weight, concerns\n"
        "  \U0001f4b0 *Finance* \u2014 spending, budget, accounts, transfers\n"
        "  \U0001f4c8 *Investing* \u2014 stocks, portfolio, holdings, dividends\n"
        "  \U0001fab6 *Reading & Creative* \u2014 idea capture, reading log\n"
        "  \U0001f4c4 *Documents* \u2014 search, edit, delete uploaded docs\n"
        "  \U0001fa7a *Dr. Fleet* \u2014 say \"see the doctor\" for a health consultation\n\n"
        "*Tips:*\n"
        "  \u2022 Multi-topic: \"spent 1000 on ramen\" \u2192 Finance + Health\n"
        "  \u2022 Direct: \"tell health I had a burger\" routes to Health\n"
        "  \u2022 Photos/PDFs auto-classified and stored as documents\n"
        "  \u2022 Ask about docs: \"what's my license number?\"\n\n"
        "*/status* \u2014 Daily briefing\n"
        "*/help* \u2014 This message",
        parse_mode="Markdown",
    )


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Return a comprehensive daily briefing from all agents."""
    if not _is_authorized(update):
        return

    from datetime import date as dt_date, datetime, timedelta
    from zoneinfo import ZoneInfo

    config = get_config()
    tz = ZoneInfo(config.get("timezone", "UTC"))
    now = datetime.now(tz)
    today_str = now.date().isoformat()
    symbol = "\u00a5" if config.get("primary_currency") == "JPY" else "$"
    display_name = config.get("display_name", "friend")

    sections = []

    # Header
    day_name = now.strftime("%A")
    date_str = now.strftime("%B %d")
    sections.append(f"\U0001f4ca *Good {('morning' if now.hour < 12 else 'afternoon' if now.hour < 18 else 'evening')}, {display_name}*\n{day_name}, {date_str}\n")

    # Calendar — next 3 events
    try:
        from backend.google_calendar import get_events_live
        events = await get_events_live(days=7)
        personal = [e for e in events if not e.get("is_holiday")][:3]
        if personal:
            event_lines = []
            for e in personal:
                start = e.get("start", e.get("start_time", ""))
                time_str = ""
                if "T" in str(start):
                    time_str = str(start).split("T")[1][:5] + " "
                event_lines.append(f"  \u2022 {time_str}{e.get('title', 'Event')}")
            sections.append("\U0001f4c5 *Upcoming*\n" + "\n".join(event_lines))
        else:
            sections.append("\U0001f4c5 *Calendar*: Nothing coming up this week")
    except Exception:
        sections.append("\U0001f4c5 *Calendar*: Unavailable")

    # Life Manager
    try:
        from backend.agents.life_manager import queries as lq
        pulse = await lq.get_pulse()
        parts = []
        if pulse["tasks_due_today"] > 0:
            parts.append(f"{pulse['tasks_due_today']} tasks due today")
        if pulse["upcoming_bills"] > 0:
            parts.append(f"{pulse['upcoming_bills']} bills this week")
        if pulse["overdue_count"] > 0:
            parts.append(f"\u26a0\ufe0f {pulse['overdue_count']} overdue")
        if parts:
            sections.append("\U0001f4cb *Life*: " + " \u2022 ".join(parts))
    except Exception:
        pass

    # Health
    try:
        from backend.agents.health_body import queries as hq
        profile = await hq.get_profile()
        if profile:
            meals = await hq.get_meals_for_date(today_str)
            today_cal = sum(m.get("calories", 0) for m in meals)
            goal = profile.get("daily_calorie_goal", 0)
            pct = f" ({int(today_cal/goal*100)}%)" if goal > 0 else ""
            sections.append(f"\U0001f4aa *Health*: {today_cal:,}/{goal:,} kcal{pct} \u2022 {len(meals)} meals logged")
    except Exception:
        pass

    # Health concerns
    try:
        from backend.agents.fleet.queries import get_active_concerns
        concerns = await get_active_concerns()
        if concerns:
            concern_names = [c["title"] for c in concerns[:3]]
            sections.append(f"\U0001fa7a *Concerns*: " + ", ".join(concern_names))
    except Exception:
        pass

    # Finance
    try:
        from backend.agents.finance import queries as fq
        cycle = await fq.get_cycle_summary()
        cycle_info = fq.get_cycle_day_info()
        net = cycle["income"] - cycle["expenses"]
        sections.append(
            f"\U0001f4b0 *Finance*: {symbol}{net:,} net \u2022 "
            f"Day {cycle_info['current_day']}/{cycle_info['total_days']} \u2022 "
            f"{cycle_info['days_to_payday']}d to payday"
        )
    except Exception:
        pass

    # Investing
    try:
        from backend.agents.investing.queries import get_portfolio_summary
        portfolio = await get_portfolio_summary()
        if portfolio.get("holding_count", 0) > 0:
            total = portfolio["total_value"]
            gain_pct = portfolio["gain_loss_pct"]
            sign = "+" if gain_pct >= 0 else ""
            sections.append(f"\U0001f4c8 *Portfolio*: {symbol}{total:,} ({sign}{gain_pct}%)")
    except Exception:
        pass

    # Reading
    try:
        from backend.agents.reading_creative.queries import get_books
        books = await get_books(status="reading")
        if books:
            titles = [b["title"] for b in books[:2]]
            sections.append(f"\U0001f4d6 *Reading*: " + ", ".join(titles))
    except Exception:
        pass

    await update.message.reply_text(
        "\n\n".join(sections),
        parse_mode="Markdown",
    )


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    if not _is_authorized(update):
        return
    config = get_config()
    display_name = config.get("display_name", "friend")
    await update.message.reply_text(
        f"Welcome to LifeBoard, {display_name}! \U0001f389\n\n"
        "I'm your personal life management bot. Just send me any message\n"
        "and I'll route it to the right agent automatically.\n\n"
        "Use /help to see what I can do."
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle free-text messages — route through LLM router."""
    if not _is_authorized(update):
        return

    try:
        from backend.telegram_bot.router import dispatch_text
        await dispatch_text(update, update.message.text)
    except Exception as e:
        logger.error(f"Message handler error: {e}", exc_info=True)
        await update.message.reply_text("Something went wrong processing that message.")


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle photo messages — route through LLM router."""
    if not _is_authorized(update):
        return

    logger.info(f"Photo received (caption: {bool(update.message.caption)})")
    try:
        from backend.telegram_bot.router import dispatch_photo
        await dispatch_photo(update, update.message.caption or "")
    except Exception as e:
        logger.error(f"Photo handler error: {e}", exc_info=True)
        await update.message.reply_text("Something went wrong processing that photo.")


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle documents — PDFs, images sent as files, etc."""
    if not _is_authorized(update):
        return

    doc = update.message.document
    if not doc or not doc.mime_type:
        return

    caption = update.message.caption or ""
    logger.info(f"Document received: {doc.file_name} ({doc.mime_type}, {doc.file_size} bytes)")

    try:
        if doc.mime_type.startswith("image/"):
            # Image sent as document — save and route like a photo
            from backend.telegram_bot.router import dispatch_photo
            await dispatch_photo(update, caption)
        elif doc.mime_type == "application/pdf":
            # PDF — save to disk and route to appropriate agent
            from backend.telegram_bot.router import dispatch_document
            await dispatch_document(update, caption)
        else:
            await update.message.reply_text(
                f"I received {doc.file_name} but I can only process images and PDFs right now."
            )
    except Exception as e:
        logger.error(f"Document handler error: {e}", exc_info=True)
        await update.message.reply_text("Something went wrong processing that document.")


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline keyboard button presses."""
    query = update.callback_query
    await query.answer()

    data = query.data

    # Router fallback callbacks
    if data.startswith("router:") or data.startswith("router_photo:"):
        from backend.telegram_bot.router import handle_router_fallback
        await handle_router_fallback(query, data)
        return

    # Agent-specific callbacks (from clarify actions)
    class FakeMessage:
        """Adapter to reuse process_message with callback data."""
        def __init__(self, query, text):
            self.text = text
            self._query = query
        async def reply_text(self, text, **kwargs):
            await self._query.edit_message_text(text, **kwargs)

    class FakeUpdate:
        def __init__(self, query, text):
            self.message = FakeMessage(query, text)

    if data.startswith("finance:"):
        option_text = data[len("finance:"):]
        from backend.agents.finance.telegram import process_message
        fake = FakeUpdate(query, option_text)
        await process_message(fake, option_text)
    elif data.startswith("life:"):
        option_text = data[len("life:"):]
        from backend.agents.life_manager.telegram import process_message as lm_process
        fake = FakeUpdate(query, option_text)
        await lm_process(fake, option_text)
    elif data.startswith("health:"):
        option_text = data[len("health:"):]
        from backend.agents.health_body.telegram import process_message as hb_process
        fake = FakeUpdate(query, option_text)
        await hb_process(fake, option_text)


def _is_authorized(update: Update) -> bool:
    """Check if the message is from the authorized user."""
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
    if not chat_id:
        logger.warning("TELEGRAM_CHAT_ID not set -- rejecting all messages")
        return False
    return str(update.effective_chat.id) == chat_id


_bot_app: Application | None = None


async def start_bot():
    """Start the Telegram bot as a background polling task."""
    global _bot_app

    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token or token == "your_bot_token_from_botfather":
        logger.warning(
            "TELEGRAM_BOT_TOKEN not configured -- Telegram bot will not start. "
            "Set it in .env to enable the bot."
        )
        return

    _bot_app = Application.builder().token(token).build()

    # Register handlers
    _bot_app.add_handler(CommandHandler("start", cmd_start))
    _bot_app.add_handler(CommandHandler("help", cmd_help))
    _bot_app.add_handler(CommandHandler("status", cmd_status))
    _bot_app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message)
    )
    _bot_app.add_handler(
        MessageHandler(filters.PHOTO, handle_photo)
    )
    _bot_app.add_handler(
        MessageHandler(filters.Document.ALL, handle_document)
    )
    _bot_app.add_handler(CallbackQueryHandler(handle_callback))

    # Set bot commands for Telegram menu
    await _bot_app.bot.set_my_commands([
        BotCommand("help", "What can LifeBoard do?"),
        BotCommand("status", "Daily briefing from all agents"),
    ])

    # Initialize and start polling
    await _bot_app.initialize()
    await _bot_app.start()
    await _bot_app.updater.start_polling(drop_pending_updates=True)
    logger.info("Telegram bot started (polling mode, LLM router active)")


async def stop_bot():
    """Gracefully stop the Telegram bot."""
    global _bot_app
    if _bot_app:
        await _bot_app.updater.stop()
        await _bot_app.stop()
        await _bot_app.shutdown()
        _bot_app = None
        logger.info("Telegram bot stopped")
