"""
Investing agent — Telegram message processing.
Routes user messages through Claude for structured extraction, then executes actions.
"""
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from backend.agents.investing.llm_prompt import build_system_prompt
from backend.agents.investing.actions import ACTION_REGISTRY
from backend.action_executor import execute_action
from backend import llm_client

logger = logging.getLogger(__name__)

# Conversation history (in-memory, last 5 messages)
_conversation_history: list[dict] = []


async def process_message(update: Update, text: str, send_reply: bool = True) -> str:
    """Process an Investing agent message and return the reply text."""
    global _conversation_history

    # Build system prompt with current state
    system_prompt = await build_system_prompt()

    # Send to Claude for parsing
    action_data = await llm_client.process_message(
        system_prompt=system_prompt,
        user_message=text,
        conversation_history=_conversation_history,
    )

    # Retry if LLM returned 'respond' when it should have returned an action
    if action_data.get("action") == "respond":
        result = await execute_action(action_data, ACTION_REGISTRY)
        if result.get("_hallucinated"):
            logger.info("Investing: retrying with correction prompt...")
            correction = (
                f"CORRECTION: You returned 'respond' but your reply claims you performed an action. "
                f"The 'respond' action does NOTHING to the database. Return the actual action name. "
                f"The user said: \"{text}\". Try again with the correct action."
            )
            action_data = await llm_client.process_message(
                system_prompt=system_prompt,
                user_message=correction,
                conversation_history=_conversation_history,
            )

    # Update conversation history
    _conversation_history.append({"role": "user", "content": text})

    # Execute the action
    result = await execute_action(action_data, ACTION_REGISTRY)

    # For read actions, format the data via Claude
    action_name = action_data.get("action", "")
    spec = ACTION_REGISTRY.get(action_name, {})
    if spec.get("is_read") and result["success"] and result["result"]:
        try:
            formatted_reply = await llm_client.format_data_response(
                system_prompt="Format this investment data for Telegram.",
                raw_data=result["result"],
                original_query=text,
            )
            result["reply"] = formatted_reply
        except Exception as e:
            logger.warning(f"Formatting failed, using raw reply: {e}")

    # Handle clarify action with inline keyboard
    reply_text = result["reply"]
    keyboard = None

    if action_data.get("action") == "clarify" and result.get("options"):
        buttons = [
            [InlineKeyboardButton(opt, callback_data=f"investing:{opt}")]
            for opt in result["options"]
        ]
        keyboard = InlineKeyboardMarkup(buttons)

    # Add to conversation history
    _conversation_history.append({"role": "assistant", "content": reply_text})

    # Keep history at 5 messages (10 entries = 5 user + 5 assistant)
    if len(_conversation_history) > 10:
        _conversation_history = _conversation_history[-10:]

    # Send reply
    if send_reply:
        if keyboard:
            await update.message.reply_text(reply_text, reply_markup=keyboard)
        else:
            await update.message.reply_text(reply_text)

    return reply_text


async def process_photo(update: Update, caption: str = None, send_reply: bool = True) -> str:
    """Photos go through the unified document classifier. Redirect to text handler."""
    return await process_message(update, caption or "Photo received", send_reply)
