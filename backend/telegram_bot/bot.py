"""
Telegram bot — primary input channel for LifeBoard.
Runs as a background task inside the FastAPI process (LM-12).
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

# In-memory context state (LM-14 — resets on restart, which is fine)
_active_agent: str = "finance"


def get_active_agent() -> str:
    return _active_agent


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    if not _is_authorized(update):
        return

    config = get_config()
    display_name = config.get("display_name", "friend")

    await update.message.reply_text(
        f"Hey {display_name}! Here's what I can do:\n\n"
        "*/f* or */finance* — Switch to Finance agent\n"
        "*/l* or */life* — Switch to Life Manager agent\n"
        "*/h* or */health* — Switch to Health & Body agent\n"
        "*/status* — Quick summary from all agents\n"
        "*/help* — Show this message\n\n"
        f"Currently talking to: *{_active_agent.replace('_', ' ').title()}*",
        parse_mode="Markdown",
    )


async def cmd_finance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Switch to Finance agent."""
    if not _is_authorized(update):
        return
    global _active_agent
    _active_agent = "finance"
    await update.message.reply_text(
        "💰 Finance active. Log a transaction, ask about your budget, or send a receipt photo."
    )


async def cmd_life(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Switch to Life Manager agent."""
    if not _is_authorized(update):
        return
    global _active_agent
    _active_agent = "life_manager"
    await update.message.reply_text(
        "📋 Life Manager active. Add tasks, track bills, or ask about upcoming events."
    )


async def cmd_health(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Switch to Health & Body agent."""
    if not _is_authorized(update):
        return
    global _active_agent
    _active_agent = "health_body"
    await update.message.reply_text(
        "💪 Health & Body active. Log meals, exercise, mood, or send medical docs."
    )


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Return a quick summary from all active agents."""
    if not _is_authorized(update):
        return

    from backend.agents.finance import queries as fq
    config = get_config()
    symbol = "¥" if config.get("primary_currency") == "JPY" else "$"

    try:
        cycle = await fq.get_cycle_summary()
        cycle_info = fq.get_cycle_day_info()
        accounts = await fq.get_accounts(active_only=True)
        total_balance = sum(a["current_balance"] for a in accounts if a["currency"] == config.get("primary_currency", "JPY"))

        finance_status = (
            f"💰 *Finance*\n"
            f"  Balance: {symbol}{total_balance:,}\n"
            f"  Cycle: {symbol}{cycle['expenses']:,} spent | {symbol}{cycle['income']:,} income\n"
            f"  Day {cycle_info['current_day']} | {cycle_info['days_to_payday']} days to payday"
        )
    except Exception:
        finance_status = "💰 *Finance*: No data yet"

    # Life Manager status
    try:
        from backend.agents.life_manager import queries as lq
        pulse = await lq.get_pulse()
        overdue = pulse["overdue_count"]
        tasks_today = pulse["tasks_due_today"]
        bills_7d = pulse["upcoming_bills"]
        life_status = (
            f"📋 *Life Manager*\n"
            f"  Tasks due today: {tasks_today}\n"
            f"  Bills coming (7d): {bills_7d}\n"
            f"  Overdue items: {overdue}"
        )
    except Exception:
        life_status = "📋 *Life Manager*: No data yet"

    # Health & Body status
    try:
        from backend.agents.health_body import queries as hq
        from datetime import date as dt_date
        profile = await hq.get_profile()
        if profile:
            today_str = dt_date.today().isoformat()
            meals = await hq.get_meals_for_date(today_str)
            today_cal = sum(m.get("calories", 0) for m in meals)
            goal = profile.get("daily_calorie_goal", 0)
            weight_kg = round(profile.get("weight_g", 0) / 1000, 1) if profile.get("weight_g") else "?"
            health_status = (
                f"💪 *Health & Body*\n"
                f"  Today: {today_cal}/{goal} kcal ({len(meals)} meals)\n"
                f"  Weight: {weight_kg}kg"
            )
        else:
            health_status = "💪 *Health & Body*: Profile not set up"
    except Exception:
        health_status = "💪 *Health & Body*: No data yet"

    await update.message.reply_text(
        f"📊 *LifeBoard Status*\n\n{finance_status}\n\n{life_status}\n\n{health_status}",
        parse_mode="Markdown",
    )


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    if not _is_authorized(update):
        return
    config = get_config()
    display_name = config.get("display_name", "friend")
    await update.message.reply_text(
        f"Welcome to LifeBoard, {display_name}! 🎉\n\n"
        "I'm your personal life management bot. Use /help to see what I can do."
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle free-text messages — route to active agent's LLM processing."""
    if not _is_authorized(update):
        return

    text = update.message.text

    if _active_agent == "finance":
        from backend.agents.finance.telegram import process_message
        await process_message(update, text)
    elif _active_agent == "life_manager":
        from backend.agents.life_manager.telegram import process_message as lm_process
        await lm_process(update, text)
    elif _active_agent == "health_body":
        from backend.agents.health_body.telegram import process_message as hb_process
        await hb_process(update, text)
    else:
        await update.message.reply_text(
            "I'm not sure which agent to use. Try /f for Finance, /l for Life Manager, or /h for Health."
        )


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle photo messages — route to active agent for extraction."""
    if not _is_authorized(update):
        return

    caption = update.message.caption or ""

    if _active_agent == "finance":
        from backend.agents.finance.telegram import process_photo
        await process_photo(update, caption)
    elif _active_agent == "life_manager":
        from backend.agents.life_manager.telegram import process_photo as lm_photo
        await lm_photo(update, caption)
    elif _active_agent == "health_body":
        from backend.agents.health_body.telegram import process_photo as hb_photo
        await hb_photo(update, caption)
    else:
        await update.message.reply_text(
            "Photo processing requires an active agent. Try /f for Finance, /l for Life Manager, or /h for Health."
        )


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline keyboard button presses."""
    query = update.callback_query
    await query.answer()

    data = query.data

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
        logger.warning("TELEGRAM_CHAT_ID not set — rejecting all messages")
        return False
    return str(update.effective_chat.id) == chat_id


_bot_app: Application | None = None


async def start_bot():
    """Start the Telegram bot as a background polling task."""
    global _bot_app

    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token or token == "your_bot_token_from_botfather":
        logger.warning(
            "TELEGRAM_BOT_TOKEN not configured — Telegram bot will not start. "
            "Set it in .env to enable the bot."
        )
        return

    _bot_app = Application.builder().token(token).build()

    # Register handlers
    _bot_app.add_handler(CommandHandler("start", cmd_start))
    _bot_app.add_handler(CommandHandler("help", cmd_help))
    _bot_app.add_handler(CommandHandler(["f", "finance"], cmd_finance))
    _bot_app.add_handler(CommandHandler(["l", "life"], cmd_life))
    _bot_app.add_handler(CommandHandler(["h", "health"], cmd_health))
    _bot_app.add_handler(CommandHandler("status", cmd_status))
    _bot_app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message)
    )
    _bot_app.add_handler(
        MessageHandler(filters.PHOTO, handle_photo)
    )
    _bot_app.add_handler(CallbackQueryHandler(handle_callback))

    # Set bot commands for Telegram menu
    await _bot_app.bot.set_my_commands([
        BotCommand("help", "Show available commands"),
        BotCommand("f", "Switch to Finance agent"),
        BotCommand("l", "Switch to Life Manager agent"),
        BotCommand("h", "Switch to Health & Body agent"),
        BotCommand("status", "Quick summary from all agents"),
    ])

    # Initialize and start polling
    await _bot_app.initialize()
    await _bot_app.start()
    await _bot_app.updater.start_polling(drop_pending_updates=True)
    logger.info("Telegram bot started (polling mode)")


async def stop_bot():
    """Gracefully stop the Telegram bot."""
    global _bot_app
    if _bot_app:
        await _bot_app.updater.stop()
        await _bot_app.stop()
        await _bot_app.shutdown()
        _bot_app = None
        logger.info("Telegram bot stopped")
