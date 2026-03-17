"""
Finance agent — Telegram message processing.
Routes user messages through Claude for structured extraction, then executes actions.
"""
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from backend.agents.finance.llm_prompt import build_system_prompt
from backend.agents.finance.actions import ACTION_REGISTRY
from backend.action_executor import execute_action
from backend import llm_client

logger = logging.getLogger(__name__)

# Conversation history (in-memory, last 5 messages per LM-13a)
_conversation_history: list[dict] = []


async def process_message(update: Update, text: str) -> str:
    """Process a Finance agent message and return the reply text."""
    global _conversation_history

    # Build system prompt with current state (LM-13e)
    system_prompt = await build_system_prompt()

    # Send to Claude for parsing (LM-13)
    action_data = await llm_client.process_message(
        system_prompt=system_prompt,
        user_message=text,
        conversation_history=_conversation_history,
    )

    # Update conversation history
    _conversation_history.append({"role": "user", "content": text})

    # Execute the action (LM-13d)
    result = await execute_action(action_data, ACTION_REGISTRY)

    # For read actions, format the data via Claude (LM-13f)
    action_name = action_data.get("action", "")
    spec = ACTION_REGISTRY.get(action_name, {})
    if spec.get("is_read") and result["success"] and result["result"]:
        try:
            formatted_reply = await llm_client.format_data_response(
                system_prompt="Format this financial data for Telegram.",
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
            [InlineKeyboardButton(opt, callback_data=f"finance:{opt}")]
            for opt in result["options"]
        ]
        keyboard = InlineKeyboardMarkup(buttons)

    # Add to conversation history
    _conversation_history.append({"role": "assistant", "content": reply_text})

    # Keep history at 5 messages (LM-13a)
    if len(_conversation_history) > 10:
        _conversation_history = _conversation_history[-10:]

    # Send reply
    if keyboard:
        await update.message.reply_text(reply_text, reply_markup=keyboard)
    else:
        await update.message.reply_text(reply_text)

    return reply_text


async def process_photo(update: Update, caption: str = None) -> str:
    """Process a photo sent to the Finance agent (receipts, etc.)."""
    global _conversation_history

    # Download the photo
    photo = update.message.photo[-1]  # Highest resolution
    file = await photo.get_file()
    image_data = await file.download_as_bytearray()

    system_prompt = await build_system_prompt()

    message_text = caption or "Here's a receipt/financial document. Extract the details."

    action_data = await llm_client.process_message(
        system_prompt=system_prompt,
        user_message=message_text,
        conversation_history=_conversation_history,
        image_data=bytes(image_data),
        image_media_type="image/jpeg",
    )

    _conversation_history.append({"role": "user", "content": f"[Photo] {message_text}"})

    result = await execute_action(action_data, ACTION_REGISTRY)

    reply_text = result["reply"]
    _conversation_history.append({"role": "assistant", "content": reply_text})

    if len(_conversation_history) > 10:
        _conversation_history = _conversation_history[-10:]

    # Handle clarify with keyboard
    if action_data.get("action") == "clarify" and result.get("options"):
        buttons = [
            [InlineKeyboardButton(opt, callback_data=f"finance:{opt}")]
            for opt in result["options"]
        ]
        await update.message.reply_text(
            reply_text, reply_markup=InlineKeyboardMarkup(buttons)
        )
    else:
        await update.message.reply_text(reply_text)

    return reply_text
