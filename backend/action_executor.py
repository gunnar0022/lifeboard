"""
Shared action executor — validate → execute → respond loop (LM-04, LM-13d).
Each agent defines an ACTION_REGISTRY mapping action names to handler functions.
This module handles the common validation and execution flow.
"""
import re
import logging

logger = logging.getLogger(__name__)

# Map agent IDs to panel keys for WebSocket broadcasts
_AGENT_TO_PANEL = {
    "finance": "finance",
    "investing": "investing",
    "health_body": "health",
    "life_manager": "life_manager",
    "reading_creative": "reading_creative",
}

# Shopping actions get their own panel key
_SHOPPING_ACTIONS = {"shopping_add", "shopping_remove", "shopping_check", "shopping_clear_checked", "shopping_list"}

# Patterns that suggest the LLM thinks it performed an action.
# Must be affirmative claims like "I've deleted..." or "Done! Logged..."
# NOT matches for "I don't see" or "no X found" or "couldn't delete".
_ACTION_CLAIM_PATTERN = re.compile(
    r"(?:I've |I have |Done|Got it|All set|Successfully |✅|Alright,? )"
    r".*\b(deleted|removed|logged|added|created|updated|edited|recorded|saved|stored)\b",
    re.IGNORECASE,
)


async def execute_action(action_data: dict, action_registry: dict, agent_id: str = None) -> dict:
    """
    Validate and execute an action from the LLM.

    Args:
        action_data: JSON action dict from Claude (must have "action" key).
        action_registry: Agent's ACTION_REGISTRY mapping action names to
                        {"handler": async_func, "required": [...], "optional": [...]}.
        agent_id: Optional agent identifier for WebSocket broadcast.

    Returns:
        dict with "success" (bool), "result" (any), and "reply" (str).
    """
    action_name = action_data.get("action")

    if not action_name:
        return {
            "success": False,
            "result": None,
            "reply": "I couldn't understand what action to take. Could you rephrase?",
        }

    # Handle meta actions
    if action_name == "respond":
        reply = action_data.get("reply", "")
        # Detect hallucinated actions: LLM said "respond" but reply claims it did something
        if _ACTION_CLAIM_PATTERN.search(reply):
            logger.warning(
                f"LLM returned 'respond' but reply claims action was taken: {reply[:100]}. "
                f"Flagging as hallucinated — no DB operation occurred."
            )
        return {
            "success": True,
            "result": None,
            "reply": reply,
            "_hallucinated": bool(_ACTION_CLAIM_PATTERN.search(reply)),
        }

    if action_name == "clarify":
        return {
            "success": True,
            "result": None,
            "reply": action_data.get("reply", "Could you clarify?"),
            "options": action_data.get("options", []),
        }

    if action_name == "multi_action":
        return await _execute_multi_action(action_data, action_registry)

    # Look up action in registry (LM-13d)
    if action_name not in action_registry:
        logger.warning(f"Unknown action: {action_name}")
        return {
            "success": False,
            "result": None,
            "reply": f"I'm not sure how to do '{action_name}'. Could you try rephrasing?",
        }

    spec = action_registry[action_name]
    handler = spec["handler"]
    required_fields = spec.get("required", [])

    # Validate required fields
    data = action_data.get("data", {})
    missing = [f for f in required_fields if f not in data or data[f] is None]
    if missing:
        return {
            "success": False,
            "result": None,
            "reply": f"Missing required info: {', '.join(missing)}. Could you provide more details?",
        }

    # Execute
    try:
        result = await handler(data)
        reply = action_data.get("reply", "Done!")

        # Broadcast via WebSocket for live dashboard updates
        if agent_id and not spec.get("is_read"):
            try:
                from backend.ws_manager import manager
                panel = _AGENT_TO_PANEL.get(agent_id)
                if action_name in _SHOPPING_ACTIONS:
                    await manager.broadcast("shopping")
                if panel:
                    await manager.broadcast(panel)
                await manager.broadcast("home")
            except Exception:
                pass  # Non-critical

        return {
            "success": True,
            "result": result,
            "reply": reply,
        }
    except Exception as e:
        logger.error(f"Action execution error ({action_name}): {e}")
        return {
            "success": False,
            "result": None,
            "reply": f"Something went wrong while processing that. Error: {str(e)}",
        }


async def _execute_multi_action(action_data: dict, action_registry: dict) -> dict:
    """Execute multiple sub-actions (LM-19). Max 10. Partial success OK."""
    sub_actions = action_data.get("actions", [])
    # LLM sometimes nests actions inside "data" following the standard format
    if not sub_actions:
        sub_actions = action_data.get("data", {}).get("actions", [])
    if not sub_actions:
        return {"success": False, "result": None, "reply": "No actions to execute."}

    # Cap at 10 (LM-19)
    sub_actions = sub_actions[:10]

    results = []
    successes = 0
    failures = 0

    for i, sub in enumerate(sub_actions):
        result = await execute_action(sub, action_registry)
        results.append(result)
        if result["success"]:
            successes += 1
        else:
            failures += 1

    # Build combined reply
    reply = action_data.get("reply", "")
    if not reply:
        if failures == 0:
            reply = f"All {successes} actions completed successfully!"
        else:
            reply = f"{successes} succeeded, {failures} failed."
            failed_msgs = [r["reply"] for r in results if not r["success"]]
            if failed_msgs:
                reply += "\nFailed: " + "; ".join(failed_msgs)

    return {
        "success": failures == 0,
        "result": results,
        "reply": reply,
    }
