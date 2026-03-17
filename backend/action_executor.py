"""
Shared action executor — validate → execute → respond loop (LM-04, LM-13d).
Each agent defines an ACTION_REGISTRY mapping action names to handler functions.
This module handles the common validation and execution flow.
"""
import logging

logger = logging.getLogger(__name__)


async def execute_action(action_data: dict, action_registry: dict) -> dict:
    """
    Validate and execute an action from the LLM.

    Args:
        action_data: JSON action dict from Claude (must have "action" key).
        action_registry: Agent's ACTION_REGISTRY mapping action names to
                        {"handler": async_func, "required": [...], "optional": [...]}.

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
        return {
            "success": True,
            "result": None,
            "reply": action_data.get("reply", ""),
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
