"""
LLM client — Anthropic API wrapper for agent message processing (LM-13).
Claude is the parser, not the database. It returns structured JSON actions.
"""
import os
import json
import logging
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)

# Default model for agent processing
MODEL = "claude-sonnet-4-5-20250514"
# Lightweight model for classification tasks (routing)
MODEL_FAST = "claude-haiku-4-5-20251001"

_client: AsyncAnthropic | None = None


def _get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key or api_key == "your_anthropic_api_key":
            raise RuntimeError("ANTHROPIC_API_KEY not configured in .env")
        _client = AsyncAnthropic(api_key=api_key)
    return _client


def _extract_json(text: str) -> dict:
    """Extract a JSON object from LLM response text, handling preamble/postamble."""
    text = text.strip()

    # Try markdown code blocks first
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        candidate = text.split("```")[1].split("```")[0].strip()
        if candidate.startswith("{"):
            text = candidate

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find first { and last } — extract JSON object from surrounding text
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace > first_brace:
        try:
            return json.loads(text[first_brace:last_brace + 1])
        except json.JSONDecodeError:
            pass

    # Nothing worked
    raise json.JSONDecodeError("No valid JSON found", text, 0)


async def process_message(
    system_prompt: str,
    user_message: str,
    conversation_history: list[dict] = None,
    image_data: bytes = None,
    image_media_type: str = "image/jpeg",
    max_tokens: int = 2048,
    model: str = None,
) -> dict:
    """
    Send a message to Claude and get a structured JSON action back.

    Args:
        system_prompt: Agent-specific system prompt with state context (LM-13b, LM-13e).
        user_message: The user's natural language message.
        conversation_history: Last 5 messages for context (LM-13a).
        image_data: Optional image bytes (receipt, document).
        image_media_type: MIME type of the image.

    Returns:
        Parsed JSON action dict from Claude's response.
    """
    client = _get_client()

    # Build messages (cap at 5 for cost control per LM-13a)
    messages = []
    if conversation_history:
        for msg in conversation_history[-5:]:
            messages.append(msg)

    # Build current message content
    content = []
    if image_data:
        import base64
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": image_media_type,
                "data": base64.b64encode(image_data).decode(),
            },
        })
    content.append({"type": "text", "text": user_message})

    messages.append({"role": "user", "content": content})

    try:
        response = await client.messages.create(
            model=model or MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages,
        )

        response_text = response.content[0].text.strip()

        # Parse JSON from response
        action = _extract_json(response_text)
        return action

    except json.JSONDecodeError:
        logger.warning(f"Failed to parse LLM response as JSON: {response_text[:200]}")
        return {
            "action": "respond",
            "reply": response_text,
        }
    except Exception as e:
        logger.error(f"LLM API error: {e}")
        return {
            "action": "respond",
            "reply": "Sorry, I had trouble processing that. Could you try rephrasing?",
        }


async def format_data_response(
    system_prompt: str,
    raw_data: dict,
    original_query: str,
) -> str:
    """
    Send raw data back to Claude for formatting into a nice Telegram response (LM-13f).
    Two-step pattern: Claude picks action → agent fetches data → Claude formats response.
    """
    client = _get_client()

    formatting_prompt = (
        "You are formatting data for a Telegram message response. "
        "Use MarkdownV2-safe formatting: bold with *, monospace with `. "
        "Use emoji for visual appeal. Keep it concise and readable. "
        "Format numbers with appropriate currency symbols and thousands separators. "
        "Respond with ONLY the formatted message text, no JSON."
    )

    user_content = (
        f"The user asked: \"{original_query}\"\n\n"
        f"Here is the raw data to format:\n```json\n{json.dumps(raw_data, indent=2)}\n```\n\n"
        "Format this into a clean, readable Telegram message."
    )

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=formatting_prompt,
            messages=[{"role": "user", "content": user_content}],
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error(f"LLM formatting error: {e}")
        return f"Here's what I found:\n{json.dumps(raw_data, indent=2)}"
