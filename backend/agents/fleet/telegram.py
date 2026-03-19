"""
Dr. Fleet — Telegram session handler.
Manages multi-turn Opus conversation with three-way handshake termination.
LM-37: Fleet session lock is global — all messages bypass router when active.
LM-38: Fleet uses Opus. Everything else uses Haiku/Sonnet.
LM-39: Actions execute only after three-way handshake.
"""
import json
import logging
from datetime import datetime

from anthropic import AsyncAnthropic
from telegram import Update

from backend.config import get_config
from backend.agents.fleet import queries
from backend.agents.fleet.llm_prompt import build_system_prompt
from backend import llm_client

logger = logging.getLogger(__name__)

# LM-38: Fleet uses Opus
MODEL_OPUS = "claude-opus-4-20250514"

# LM-37: Global session lock
_fleet_session = {
    "active": False,
    "visit_id": None,
    "conversation_history": [],
    "system_prompt": None,
}


def is_session_active() -> bool:
    return _fleet_session["active"]


async def start_session(update: Update) -> str:
    """
    Start a Fleet consultation session.
    Assembles medical briefing, creates visit row, sends opening message.
    """
    global _fleet_session

    if _fleet_session["active"]:
        msg = "You're already in a visit with Dr. Fleet. Send your message, or say goodbye to end the session."
        await update.message.reply_text(msg)
        return msg

    # Build the Opus system prompt with medical briefing
    system_prompt = await build_system_prompt()

    # Create the visit row
    visit = await queries.create_visit()
    visit_id = visit["id"]

    # Initialize session state
    _fleet_session["active"] = True
    _fleet_session["visit_id"] = visit_id
    _fleet_session["conversation_history"] = []
    _fleet_session["system_prompt"] = system_prompt

    # Get Fleet's opening message via Opus
    config = get_config()
    user_name = config.get("display_name", config.get("user_name", "there"))

    opening_prompt = (
        f"The patient ({user_name}) has just arrived for a visit. "
        "Greet them warmly and ask how they're doing. Reference any active concerns "
        "or recent history naturally, like a doctor who remembers their patient. "
        "Keep it brief and conversational -- this is the start of the visit."
    )

    client = llm_client._get_client()
    try:
        response = await client.messages.create(
            model=MODEL_OPUS,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": opening_prompt}],
        )
        opening_message = response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Fleet Opus call failed on session start: {e}")
        opening_message = (
            f"Hey {user_name}! Good to see you. "
            "What's on your mind today? Anything bothering you, or just a check-in?"
        )

    # Store the opening exchange in conversation history
    _fleet_session["conversation_history"] = [
        {"role": "user", "content": opening_prompt},
        {"role": "assistant", "content": opening_message},
    ]
    await queries.update_visit_conversation(visit_id, _fleet_session["conversation_history"])

    await update.message.reply_text(opening_message)
    return opening_message


async def handle_message(update: Update, text: str) -> str:
    """
    Handle a message during an active Fleet session.
    LM-39: No writes until three-way handshake. Only retrieve_records allowed mid-session.
    """
    global _fleet_session

    if not _fleet_session["active"]:
        return "No active Fleet session."

    visit_id = _fleet_session["visit_id"]
    conversation = _fleet_session["conversation_history"]
    system_prompt = _fleet_session["system_prompt"]

    # Add user message to history
    conversation.append({"role": "user", "content": text})

    # Send to Opus
    client = llm_client._get_client()
    try:
        response = await client.messages.create(
            model=MODEL_OPUS,
            max_tokens=2048,
            system=system_prompt,
            messages=conversation,
        )
        fleet_response = response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Fleet Opus call failed: {e}")
        fleet_response = "Sorry, I had a moment there. Could you say that again?"
        conversation.append({"role": "assistant", "content": fleet_response})
        await queries.update_visit_conversation(visit_id, conversation)
        await update.message.reply_text(fleet_response)
        return fleet_response

    # Check if Fleet returned JSON (retrieve_records or end_visit)
    parsed_action = _try_parse_json(fleet_response)

    if parsed_action and parsed_action.get("action") == "retrieve_records":
        # LM-42: Mid-conversation record retrieval (read-only)
        query_text = parsed_action.get("query", "")
        logger.info(f"Fleet requesting records: {query_text}")

        results = await queries.search_medical_records(query_text)

        # Format results for injection into conversation
        result_summary = _format_record_results(results)

        # Add the retrieval exchange to conversation as assistant thinking
        conversation.append({"role": "assistant", "content": f"[Looking up records: {query_text}]"})
        conversation.append({
            "role": "user",
            "content": f"[Record retrieval results]\n{result_summary}\n\n[Continue the conversation naturally with this information. Do NOT return JSON.]",
        })

        # Get Fleet's follow-up response with the records
        try:
            response2 = await client.messages.create(
                model=MODEL_OPUS,
                max_tokens=2048,
                system=system_prompt,
                messages=conversation,
            )
            fleet_response = response2.content[0].text.strip()
        except Exception as e:
            logger.error(f"Fleet Opus follow-up failed: {e}")
            fleet_response = "I found some records but had trouble processing them. Let me continue without those for now."

        conversation.append({"role": "assistant", "content": fleet_response})
        await queries.update_visit_conversation(visit_id, conversation)
        await update.message.reply_text(fleet_response)
        return fleet_response

    elif parsed_action and parsed_action.get("action") == "end_visit":
        # Three-way handshake complete — execute actions
        await _execute_visit_actions(update, parsed_action)
        return parsed_action.get("closing_message", "Take care!")

    else:
        # Normal conversational response
        conversation.append({"role": "assistant", "content": fleet_response})
        await queries.update_visit_conversation(visit_id, conversation)
        await update.message.reply_text(fleet_response)
        return fleet_response


async def _execute_visit_actions(update: Update, action_data: dict):
    """
    Execute all actions after three-way handshake confirmation.
    LM-39: This is the ONLY point where Fleet writes to the database.
    """
    global _fleet_session

    visit_id = _fleet_session["visit_id"]
    actions = action_data.get("actions", [])
    summary = action_data.get("summary", "Visit completed.")
    closing = action_data.get("closing_message", "Take care!")

    executed = []
    for act in actions:
        act_type = act.get("type")
        try:
            if act_type == "create_concern":
                result = await queries.create_concern(
                    title=act["title"],
                    description=act["description"],
                )
                executed.append({"type": act_type, "title": act["title"], "concern_id": result["id"]})

            elif act_type == "add_log":
                await queries.add_concern_log(
                    concern_id=act["concern_id"],
                    source="fleet_visit",
                    content=act["content"],
                )
                executed.append({"type": act_type, "concern_id": act["concern_id"]})

            elif act_type == "update_description":
                await queries.update_concern(
                    act["concern_id"],
                    description=act["description"],
                )
                executed.append({"type": act_type, "concern_id": act["concern_id"]})

            elif act_type == "resolve":
                await queries.resolve_concern(
                    concern_id=act["concern_id"],
                    resolution_summary=act["resolution_summary"],
                )
                executed.append({"type": act_type, "concern_id": act["concern_id"]})

            elif act_type == "reactivate":
                await queries.reactivate_concern(concern_id=act["concern_id"])
                executed.append({"type": act_type, "concern_id": act["concern_id"]})

            elif act_type == "update_profile":
                from backend.agents.health_body.queries import upsert_profile
                await upsert_profile(**act.get("fields", {}))
                executed.append({"type": act_type, "fields": list(act.get("fields", {}).keys())})

            else:
                logger.warning(f"Unknown Fleet action type: {act_type}")

        except Exception as e:
            logger.error(f"Fleet action failed ({act_type}): {e}")
            executed.append({"type": act_type, "error": str(e)})

    # End the visit
    await queries.end_visit(visit_id, executed, summary)

    # Send closing message
    await update.message.reply_text(closing)

    # Clear session lock
    _fleet_session["active"] = False
    _fleet_session["visit_id"] = None
    _fleet_session["conversation_history"] = []
    _fleet_session["system_prompt"] = None

    logger.info(f"Fleet visit #{visit_id} ended. Actions: {len(executed)}")


def clear_session():
    """Clear the Fleet session lock (used for orphaned session recovery)."""
    global _fleet_session
    _fleet_session["active"] = False
    _fleet_session["visit_id"] = None
    _fleet_session["conversation_history"] = []
    _fleet_session["system_prompt"] = None


def _try_parse_json(text: str) -> dict | None:
    """Try to extract a JSON action from Fleet's response."""
    text = text.strip()

    # Try markdown code blocks
    if "```json" in text:
        try:
            json_str = text.split("```json")[1].split("```")[0].strip()
            return json.loads(json_str)
        except (json.JSONDecodeError, IndexError):
            pass
    elif "```" in text:
        try:
            candidate = text.split("```")[1].split("```")[0].strip()
            if candidate.startswith("{"):
                return json.loads(candidate)
        except (json.JSONDecodeError, IndexError):
            pass

    # Try direct parse
    try:
        result = json.loads(text)
        if isinstance(result, dict) and "action" in result:
            return result
    except json.JSONDecodeError:
        pass

    # Try finding JSON in text
    first = text.find("{")
    last = text.rfind("}")
    if first != -1 and last > first:
        try:
            result = json.loads(text[first:last + 1])
            if isinstance(result, dict) and "action" in result:
                return result
        except json.JSONDecodeError:
            pass

    return None


def _format_record_results(results: dict) -> str:
    """Format medical record search results for injection into Fleet's context."""
    docs = results.get("documents", [])
    files = results.get("files", [])

    if not docs and not files:
        return "No matching records found."

    parts = []
    if docs:
        parts.append(f"Found {len(docs)} matching documents:")
        for d in docs:
            provider = f" by {d['provider']}" if d.get("provider") else ""
            date_str = f" ({d['date']})" if d.get("date") else ""
            notes = f"\n  Notes: {d['notes']}" if d.get("notes") else ""
            parts.append(f"  - {d['name']} [{d['category']}]{date_str}{provider}{notes}")

    if files:
        parts.append(f"\nFound {len(files)} matching files:")
        for f in files:
            doc_ref = f" (linked to: {f['doc_name']})" if f.get("doc_name") else ""
            desc = f"\n  Description: {f['description']}" if f.get("description") else ""
            extracted = ""
            if f.get("extracted_data"):
                try:
                    data = json.loads(f["extracted_data"]) if isinstance(f["extracted_data"], str) else f["extracted_data"]
                    extracted = f"\n  Extracted data: {json.dumps(data, indent=2)}"
                except Exception:
                    pass
            parts.append(f"  - File #{f['id']}{doc_ref}{desc}{extracted}")

    return "\n".join(parts)
