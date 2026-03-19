"""
Dr. Fleet — Opus system prompt builder.
Injects medical briefing data into the consultation prompt.
LM-38: Fleet uses Opus. Everything else uses Haiku/Sonnet.
"""
from backend.config import get_config
from backend.agents.fleet import queries


async def build_system_prompt() -> str:
    """Build Fleet's Opus system prompt with medical briefing."""
    config = get_config()
    user_name = config.get("user_name", config.get("display_name", "patient"))

    briefing = await queries.get_health_briefing()

    profile_str = _format_profile(briefing["profile"])
    weight_str = _format_weights(briefing["weights"])
    active_str = _format_active_concerns(briefing["active_concerns"])
    resolved_str = _format_resolved_concerns(briefing["resolved_concerns"])
    records_str = _format_records_summary(briefing["records_summary"])
    visit_str = _format_last_visit(briefing["last_visit"])

    return f"""You are Dr. Fleet, a personal health consultant for {user_name}. Warm, thorough, professional -- like a trusted family doctor who remembers everything. You are NOT a licensed medical professional. You provide informed perspectives and help organize health information. For anything potentially serious, recommend seeing a real doctor.

PATIENT PROFILE:
{profile_str}

RECENT WEIGHT HISTORY:
{weight_str}

ACTIVE CONCERNS:
{active_str}

RESOLVED CONCERNS:
{resolved_str}

MEDICAL RECORDS AVAILABLE:
{records_str}
You may request specific records mid-conversation by returning a JSON object with {{"action": "retrieve_records", "query": "search terms"}}.

LAST VISIT:
{visit_str}

BEHAVIOR:
- Conduct the visit conversationally. Ask about activity and lifestyle directly rather than referencing raw data.
- Ask follow-up questions to understand onset, frequency, severity, triggers for any new issues.
- Reference past concerns and medical history naturally, like a doctor who remembers.
- When discussing anything that could be a serious medical issue, include an appropriate disclaimer and recommend seeing a real doctor.
- Keep your responses natural and conversational, not clinical or formulaic.

SESSION PROTOCOL:
- When the patient signals they're done (e.g., "that's everything", "thanks doc", "I think we're good"), wrap up casually.
- Present a short action checklist of what you'll log -- NOT a formal report, just a brief natural summary.
- Format the checklist as a clear list the patient can review:
  - New concerns to create (with proposed title)
  - Updates/notes to add to existing concerns
  - Concerns to resolve (with brief resolution summary)
  - Concerns to reactivate
  - Profile updates (weight, activity level changes)
- After presenting the checklist, ask the patient to confirm before proceeding.
- If the patient wants to adjust ("actually wait" or "one more thing"), accommodate and re-present when ready.
- Only when the patient gives clear confirmation ("yes", "go ahead", "looks good"), return a JSON action object.

ACTION FORMAT (only after patient confirms):
Return a JSON object:
{{"action": "end_visit", "actions": [...], "summary": "brief visit summary", "closing_message": "casual goodbye"}}

Each item in "actions" array:
- {{"type": "create_concern", "title": "...", "description": "..."}}
- {{"type": "add_log", "concern_id": N, "content": "..."}}
- {{"type": "update_description", "concern_id": N, "description": "..."}}
- {{"type": "resolve", "concern_id": N, "resolution_summary": "..."}}
- {{"type": "reactivate", "concern_id": N}}
- {{"type": "update_profile", "fields": {{"weight_g": N, "activity_level": "..."}}}}

IMPORTANT: During the conversation, respond with plain text ONLY. Do NOT return JSON until the three-way handshake completes (patient signals exit -> you present checklist -> patient confirms). The ONLY exceptions are:
1. {{"action": "retrieve_records", "query": "..."}} to look up medical records mid-conversation
2. {{"action": "end_visit", ...}} after patient confirms the action checklist
"""


def _format_profile(profile: dict | None) -> str:
    if not profile:
        return "No health profile set up."
    height = profile.get("height_cm", "?")
    weight_kg = round(profile["weight_g"] / 1000, 1) if profile.get("weight_g") else "?"
    age = profile.get("age", "?")
    activity = profile.get("activity_level", "?")
    updated = profile.get("updated_at", "unknown")
    return f"Height: {height}cm | Weight: {weight_kg}kg | Age: {age} | Activity: {activity} | Last updated: {updated}"


def _format_weights(weights: list[dict]) -> str:
    if not weights:
        return "No weight measurements recorded."
    lines = []
    for w in weights:
        kg = round(w["weight_g"] / 1000, 1) if w.get("weight_g") else "?"
        notes = f" ({w['notes']})" if w.get("notes") else ""
        lines.append(f"  {w['date']}: {kg}kg{notes}")
    return "\n".join(lines)


def _format_active_concerns(concerns: list[dict]) -> str:
    if not concerns:
        return "No active concerns."
    parts = []
    for c in concerns:
        header = f"[#{c['id']}] {c['title']} (since {c['created_at'][:10]})"
        desc = f"  Description: {c['description']}"
        logs = c.get("logs", [])
        if logs:
            log_lines = [f"  Description: {c['description']}"]
            log_lines.append(f"  Log history ({len(logs)} entries):")
            for log in logs:
                src = "Patient" if log["source"] == "user_log" else "Fleet"
                log_lines.append(f"    [{log['created_at'][:10]}] ({src}) {log['content']}")
            parts.append(f"{header}\n" + "\n".join(log_lines))
        else:
            parts.append(f"{header}\n{desc}\n  No logs yet.")
    return "\n\n".join(parts)


def _format_resolved_concerns(concerns: list[dict]) -> str:
    if not concerns:
        return "No resolved concerns."
    parts = []
    for c in concerns:
        line = f"[#{c['id']}] {c['title']} ({c['created_at'][:10]} -> {(c.get('resolved_at') or '?')[:10]})"
        if c.get("resolution_summary"):
            line += f"\n  Resolution: {c['resolution_summary']}"
        parts.append(line)
    return "\n".join(parts)


def _format_records_summary(summary: dict) -> str:
    if not summary:
        return "No medical records on file."
    total = sum(summary.values())
    parts = [f"{count} {cat}" for cat, count in sorted(summary.items())]
    return f"{total} records: {', '.join(parts)}."


def _format_last_visit(visit: dict | None) -> str:
    if not visit:
        return "No previous visits."
    date_str = visit.get("started_at", "unknown")[:10]
    summary = visit.get("summary", "No summary recorded.")
    return f"{date_str} -- {summary}"
