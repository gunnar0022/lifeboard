"""
Life Manager agent — Telegram message processing.
Routes user messages through Claude for structured extraction, then executes actions.
"""
import os
import logging
from pathlib import Path
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from backend.agents.life_manager.llm_prompt import build_system_prompt
from backend.agents.life_manager.actions import ACTION_REGISTRY
from backend.action_executor import execute_action
from backend import llm_client

logger = logging.getLogger(__name__)

# Conversation history (in-memory, last 5 messages per LM-13a)
_conversation_history: list[dict] = []


async def process_message(update: Update, text: str) -> str:
    """Process a Life Manager agent message and return the reply text."""
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
                system_prompt="Format this life management data for Telegram.",
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
            [InlineKeyboardButton(opt, callback_data=f"life:{opt}")]
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
    """Process a photo sent to the Life Manager agent (documents, receipts, etc.)."""
    global _conversation_history

    # Download the photo
    photo = update.message.photo[-1]  # Highest resolution
    file = await photo.get_file()
    image_data = await file.download_as_bytearray()

    # Save file to disk (LM-13c)
    now = datetime.now()
    file_dir = Path(__file__).parent.parent.parent.parent / "data" / "files" / "life_manager" / now.strftime("%Y-%m")
    file_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{now.strftime('%Y%m%d_%H%M%S')}_{file.file_unique_id}.jpg"
    file_path = file_dir / filename
    with open(file_path, "wb") as f:
        f.write(image_data)

    system_prompt = await build_system_prompt()

    message_text = caption or "Here's a document/photo. Extract the details and store it."

    # Include file info in the message context
    file_context_msg = (
        f"{message_text}\n\n"
        f"[File saved: {filename}, size: {len(image_data)} bytes, "
        f"path: life_manager/{now.strftime('%Y-%m')}/{filename}]"
    )

    action_data = await llm_client.process_message(
        system_prompt=system_prompt,
        user_message=file_context_msg,
        conversation_history=_conversation_history,
        image_data=bytes(image_data),
        image_media_type="image/jpeg",
    )

    _conversation_history.append({"role": "user", "content": f"[Photo] {message_text}"})

    # Inject file info into store_file actions
    if action_data.get("action") == "store_file":
        if "data" not in action_data:
            action_data["data"] = {}
        action_data["data"]["file_path"] = f"life_manager/{now.strftime('%Y-%m')}/{filename}"
        action_data["data"]["original_filename"] = filename
        action_data["data"]["mime_type"] = "image/jpeg"
        action_data["data"]["file_size"] = len(image_data)
    elif action_data.get("action") == "multi_action":
        for sub in action_data.get("actions", []):
            if sub.get("action") == "store_file":
                if "data" not in sub:
                    sub["data"] = {}
                sub["data"]["file_path"] = f"life_manager/{now.strftime('%Y-%m')}/{filename}"
                sub["data"]["original_filename"] = filename
                sub["data"]["mime_type"] = "image/jpeg"
                sub["data"]["file_size"] = len(image_data)

    result = await execute_action(action_data, ACTION_REGISTRY)

    reply_text = result["reply"]
    _conversation_history.append({"role": "assistant", "content": reply_text})

    if len(_conversation_history) > 10:
        _conversation_history = _conversation_history[-10:]

    # Handle clarify with keyboard
    if action_data.get("action") == "clarify" and result.get("options"):
        buttons = [
            [InlineKeyboardButton(opt, callback_data=f"life:{opt}")]
            for opt in result["options"]
        ]
        await update.message.reply_text(
            reply_text, reply_markup=InlineKeyboardMarkup(buttons)
        )
    else:
        await update.message.reply_text(reply_text)

    return reply_text
