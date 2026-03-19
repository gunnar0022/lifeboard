"""
Reading & Creative agent — Telegram message processing.
Handles idea capture and reading log management.
"""
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from backend.agents.reading_creative.llm_prompt import build_system_prompt
from backend.agents.reading_creative.actions import ACTION_REGISTRY
from backend.action_executor import execute_action
from backend import llm_client

logger = logging.getLogger(__name__)

_conversation_history: list[dict] = []


async def process_message(update: Update, text: str, send_reply: bool = True) -> str:
    global _conversation_history

    system_prompt = await build_system_prompt()

    action_data = await llm_client.process_message(
        system_prompt=system_prompt,
        user_message=text,
        conversation_history=_conversation_history,
    )

    logger.info(f"Creative LLM action: {action_data.get('action')} | data keys: {list(action_data.get('data', {}).keys())}")

    # Retry if LLM returned 'respond' when it should have returned an action
    if action_data.get("action") == "respond":
        result = await execute_action(action_data, ACTION_REGISTRY)
        if result.get("_hallucinated"):
            logger.info("Creative: retrying with correction prompt...")
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

    # Handle ask_clarification as inline keyboard
    if action_data.get("action") == "ask_clarification":
        msg = action_data.get("data", {}).get("message", action_data.get("reply", "Which project?"))
        _conversation_history.append({"role": "user", "content": text})
        _conversation_history.append({"role": "assistant", "content": msg})
        if len(_conversation_history) > 10:
            _conversation_history = _conversation_history[-10:]
        if send_reply:
            await update.message.reply_text(msg)
        return msg

    _conversation_history.append({"role": "user", "content": text})

    result = await execute_action(action_data, ACTION_REGISTRY)

    # For read actions, format the data via Claude
    action_name = action_data.get("action", "")
    spec = ACTION_REGISTRY.get(action_name, {})
    if spec.get("is_read") and result["success"] and result["result"]:
        try:
            formatted_reply = await llm_client.format_data_response(
                system_prompt="Format this reading/creative data for Telegram. Be concise.",
                raw_data=result["result"],
                original_query=text,
            )
            result["reply"] = formatted_reply
        except Exception as e:
            logger.warning(f"Formatting failed, using raw reply: {e}")

    reply_text = result["reply"]
    _conversation_history.append({"role": "assistant", "content": reply_text})

    if len(_conversation_history) > 10:
        _conversation_history = _conversation_history[-10:]

    if send_reply:
        await update.message.reply_text(reply_text)

    return reply_text


async def process_photo(update: Update, caption: str = None, send_reply: bool = True) -> str:
    """Photos aren't a primary feature for this agent, just treat as a text message."""
    text = caption or "Here's a photo related to my creative work."
    return await process_message(update, text, send_reply)
