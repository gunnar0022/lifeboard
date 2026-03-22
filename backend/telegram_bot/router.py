"""
Telegram message router — LLM-powered classification and multi-agent fan-out (LM-27).
Every inbound message passes through the router to determine which agent(s) handle it.
The router is a lightweight classification call, NOT a conversation (LM-27).
"""
import asyncio
import json
import logging
import time

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup

from backend import llm_client

logger = logging.getLogger(__name__)

# Valid agent IDs (fleet is session-based, not in this set)
VALID_AGENTS = {"finance", "life_manager", "health_body", "investing", "reading_creative", "documents"}
FLEET_AGENT = "fleet"
DOCUMENTS_AGENT = "documents"

# Emoji prefixes for multi-agent consolidated replies
AGENT_EMOJI = {
    "finance": "\U0001f4b0",       # money bag
    "life_manager": "\U0001f4cb",   # clipboard
    "health_body": "\U0001f4aa",    # flexed biceps
    "investing": "\U0001f4c8",     # chart increasing
    "reading_creative": "\U0001fab6",  # feather
    "documents": "\U0001f4c4",     # page facing up
}

AGENT_LABELS = {
    "finance": "Finance",
    "life_manager": "Life Manager",
    "health_body": "Health & Body",
    "investing": "Investing",
    "reading_creative": "Reading & Creative",
    "documents": "Documents",
}

# --- In-memory state (resets on restart, fine per LM-14) ---

# LM-31: Recent context buffer
_recent_context: dict | None = None  # {"agent": str, "timestamp": float}

# Router conversation history — compact summaries of recent routing decisions.
# Stores abbreviated user message + which agent handled it, not full content.
_router_history: list[dict] = []
_ROUTER_HISTORY_MAX = 16  # 8 exchanges

# LM-30: Reply-to tracking — bot message_id -> source agent
_reply_source_map: dict[int, str] = {}
_REPLY_MAP_MAX = 50

# Fallback: pending messages awaiting agent selection via keyboard
_pending_fallback: dict[int, dict] = {}

# --- Router system prompt (LM-27: under 300 tokens) ---

_ROUTER_PROMPT = """\
You route messages to LifeBoard agents. Return JSON only.

Agents:
- finance: money, spending, transactions, budget, accounts, salary, receipts, payments, transfers, recurring payments, income, interest
- life_manager: tasks, events, calendar, documents, bills-as-tracking, deadlines, reminders, scheduling, appointments, errands (NOT workouts or exercise — those go to health_body)
- health_body: food, meals, exercise, workouts, sports, gym, weight, mood, energy, medical, calories, nutrition, sleep, health checkups, health concern updates (e.g. "back pain was better today"). Any physical activity (volleyball, running, etc.) goes here, not life_manager
- investing: stocks, portfolio, investments, shares, dividends, crypto, bonds, ETFs, market, buy/sell shares, brokerage
- reading_creative: creative ideas, worldbuilding, story ideas, writing, books, reading list, finished reading, book recommendations
- documents: looking up info from uploaded documents/PDFs, "what's my ID number", "what does my contract say", finding details in stored files. Use when the user asks about information that would be IN a document they've uploaded.
- fleet: ONLY for explicit requests to see a doctor, talk to Fleet, start a medical consultation/clinic visit

Rules:
- If the user names a specific agent ("tell health...", "log this in finance", "keep this in life manager"), ALWAYS route to that agent. The user's explicit choice overrides content-based routing.
- Most messages go to ONE agent based on content
- Multi-agent only when message explicitly covers 2+ domains (e.g. "spent 1000 on ramen" = finance + health)
- For ambiguous follow-ups, use conversation history to determine intent and agent
- If genuinely unclear, return empty routes
- "fleet" is special: only use for explicit doctor/Fleet visit requests, NOT for casual health updates
- You have agency to choose the best agent when the user doesn't specify — but when they do specify, respect it

For the "message" field: write a brief, context-aware summary that the receiving agent can act on. Strip out the routing instruction ("tell health...", "log in finance...") and just pass the actual content. Include relevant details from conversation history for follow-ups.

Return: {"routes": [{"agent": "agent_id", "message": "context-enriched instruction for the agent"}]}"""


# --- Core routing functions ---

async def route_message(text: str, reply_to_agent: str | None = None) -> list[dict]:
    """
    Classify a message and determine which agent(s) should handle it.

    Returns list of {"agent": str, "message": str} dicts, or empty list for fallback.
    """
    # Build prompt with context signals
    prompt = _ROUTER_PROMPT

    context_lines = []
    if reply_to_agent and reply_to_agent != "multi":
        context_lines.append(
            f"Context: User is replying to a message from {reply_to_agent}."
        )
    if _recent_context:
        elapsed = time.time() - _recent_context["timestamp"]
        if elapsed < 120:  # 2-minute window (LM-31)
            context_lines.append(
                f"Context: Last message was handled by {_recent_context['agent']} {int(elapsed)}s ago."
            )

    if context_lines:
        prompt = prompt + "\n\n" + "\n".join(context_lines)

    try:
        result = await llm_client.process_message(
            system_prompt=prompt,
            user_message=text,
            max_tokens=200,
            model=llm_client.MODEL_FAST,
            conversation_history=_router_history,
            max_history=16,
        )

        # Parse routes from response
        routes = result.get("routes", [])
        if not isinstance(routes, list):
            return []

        # Validate agent IDs and deduplicate (one route per agent max)
        all_valid = VALID_AGENTS | {FLEET_AGENT}
        valid_routes = []
        seen_agents = set()
        for route in routes:
            if (
                isinstance(route, dict)
                and route.get("agent") in all_valid
                and route.get("message")
                and route["agent"] not in seen_agents
            ):
                valid_routes.append(route)
                seen_agents.add(route["agent"])

        # Record exchange in router history — full user text so the router
        # can write context-aware summaries for follow-up messages
        _router_history.append({"role": "user", "content": text})
        routed_to = ", ".join(r["agent"] for r in valid_routes) if valid_routes else "none"
        _router_history.append({"role": "assistant", "content": f'{{"routes": [{routed_to}]}}'})
        if len(_router_history) > _ROUTER_HISTORY_MAX:
            _router_history[:] = _router_history[-_ROUTER_HISTORY_MAX:]

        return valid_routes

    except Exception as e:
        logger.error(f"Router LLM call failed: {e}")
        return []


async def dispatch_text(update: Update, text: str):
    """
    Main entry point for text messages. Routes through LLM and dispatches.
    LM-37: Fleet session lock — when active, ALL messages bypass router.
    """
    # LM-37: Check Fleet session lock first
    from backend.agents.fleet.telegram import is_session_active, handle_message as fleet_handle
    if is_session_active():
        await fleet_handle(update, text)
        return

    # LM-30: Check if this is a reply to a bot message
    reply_to_agent = _get_reply_to_agent(update)

    # Route through LLM
    routes = await route_message(text, reply_to_agent=reply_to_agent)

    if not routes:
        # Fallback: show agent picker keyboard
        await _send_fallback_keyboard(update, text)
        return

    if len(routes) == 1:
        route = routes[0]
        agent_id = route["agent"]
        routed_text = route["message"]

        # Fleet session start request
        if agent_id == FLEET_AGENT:
            from backend.agents.fleet.telegram import start_session
            await start_session(update)
            return

        # Document retrieval request
        if agent_id == DOCUMENTS_AGENT:
            await _handle_document_query(update, routed_text)
            return

        # Single agent — dispatch directly, agent sends its own reply
        handler = _get_agent_handler(agent_id, "process_message")
        if not handler:
            await update.message.reply_text("Something went wrong routing that message.")
            return

        reply_text = await handler(update, routed_text)

        # Track context
        _update_recent_context(agent_id)

    else:
        # Multi-agent fan-out (LM-29: parallel with asyncio.gather)
        await _dispatch_multi_agent(update, routes)


async def dispatch_photo(update: Update, caption: str | None):
    """
    Entry point for photo messages. All photos go through the unified document classifier.
    """
    from backend.agents.fleet.telegram import is_session_active
    if is_session_active():
        await update.message.reply_text(
            "I can't process photos during a Fleet visit. "
            "End the visit first, then send the photo."
        )
        return

    await _classify_and_store_file(update, caption, source="photo")


async def dispatch_document(update: Update, caption: str | None):
    """
    Entry point for document uploads (PDFs, etc). All docs go through the unified classifier.
    """
    from backend.agents.fleet.telegram import is_session_active
    if is_session_active():
        await update.message.reply_text(
            "I can't process documents during a Fleet visit. "
            "End the visit first, then send the document."
        )
        return

    await _classify_and_store_file(update, caption, source="document")


async def _classify_and_store_file(update: Update, caption: str | None, source: str):
    """
    Unified file handler: saves file to disk, runs Haiku classifier, stores in
    unified documents table. Works for both photos and document uploads.
    """
    from pathlib import Path
    from datetime import datetime
    from backend.documents import classify_document, store_document

    now = datetime.now()

    # Download the file
    if source == "photo":
        photo = update.message.photo[-1]
        tg_file = await photo.get_file()
        file_data = await tg_file.download_as_bytearray()
        original_filename = f"photo_{now.strftime('%Y%m%d_%H%M%S')}.jpg"
        mime_type = "image/jpeg"
    else:
        doc = update.message.document
        tg_file = await doc.get_file()
        file_data = await tg_file.download_as_bytearray()
        original_filename = doc.file_name or f"document_{now.strftime('%Y%m%d_%H%M%S')}.pdf"
        mime_type = doc.mime_type or "application/octet-stream"

    # Save to disk in a general documents folder
    file_dir = Path(__file__).parent.parent.parent / "data" / "files" / "documents" / now.strftime("%Y-%m")
    file_dir.mkdir(parents=True, exist_ok=True)

    stem = Path(original_filename).stem
    ext = Path(original_filename).suffix or (".jpg" if source == "photo" else ".pdf")
    filename = f"{stem}_{now.strftime('%Y%m%d_%H%M%S')}{ext}"
    file_path = file_dir / filename

    with open(file_path, "wb") as f:
        f.write(file_data)

    rel_path = f"documents/{now.strftime('%Y-%m')}/{filename}"
    logger.info(f"File saved: {file_path} ({len(file_data)} bytes)")

    # Classify using Haiku
    await update.message.reply_text("Classifying your document...")

    classification = await classify_document(
        file_path=rel_path,
        original_filename=original_filename,
        mime_type=mime_type,
        file_size=len(file_data),
        user_caption=caption or "",
        image_data=bytes(file_data) if mime_type.startswith("image/") else None,
    )

    # Store in unified documents table
    doc_record = await store_document(
        title=classification["title"],
        summary=classification["summary"],
        tags=classification["tags"],
        category=classification["category"],
        file_path=rel_path,
        original_filename=original_filename,
        mime_type=mime_type,
        file_size=len(file_data),
        date=classification.get("date"),
        provider=classification.get("provider"),
    )

    # Build response
    tags_str = ", ".join(classification["tags"])
    cat_emoji = {"finance": "\U0001f4b0", "health": "\U0001f4aa", "investing": "\U0001f4c8", "life": "\U0001f4cb"}.get(classification["category"], "\U0001f4c4")

    reply = (
        f"{cat_emoji} *{classification['title']}*\n"
        f"Category: {classification['category']} | Tags: {tags_str}\n\n"
        f"{classification['summary']}"
    )

    try:
        await update.message.reply_text(reply, parse_mode="Markdown")
    except Exception:
        await update.message.reply_text(reply)

    _update_recent_context("life_manager")


async def handle_router_fallback(query, data: str):
    """
    Handle callbacks from the router's fallback keyboard.
    data format: "router:{agent_id}" or "router_photo:{agent_id}"
    """
    if data.startswith("router_photo:"):
        agent_id = data[len("router_photo:"):]
        if agent_id in VALID_AGENTS:
            _update_recent_context(agent_id)
            await query.edit_message_text(
                f"Got it — send the photo again and I'll route it to {AGENT_LABELS.get(agent_id, agent_id)}."
            )
        return

    if data.startswith("router:"):
        agent_id = data[len("router:"):]
        if agent_id not in VALID_AGENTS:
            return

        # Look up the pending message
        msg_id = query.message.message_id
        pending = _pending_fallback.pop(msg_id, None)

        if not pending or not pending.get("text"):
            await query.edit_message_text("Sorry, I lost track of that message. Please resend it.")
            return

        original_text = pending["text"]

        # Create a FakeUpdate so the agent can reply via edit_message_text
        class FakeMessage:
            def __init__(self, q, text):
                self.text = text
                self._query = q
            async def reply_text(self, text, **kwargs):
                await self._query.edit_message_text(text, **kwargs)

        class FakeUpdate:
            def __init__(self, q, text):
                self.message = FakeMessage(q, text)

        # Documents agent uses its own handler
        if agent_id == DOCUMENTS_AGENT:
            fake = FakeUpdate(query, original_text)
            await _handle_document_query(fake, original_text)
            return

        handler = _get_agent_handler(agent_id, "process_message")
        if handler:
            fake = FakeUpdate(query, original_text)
            await handler(fake, original_text)
            _update_recent_context(agent_id)


# --- Multi-agent dispatch (LM-29) ---

async def _dispatch_multi_agent(update: Update, routes: list[dict]):
    """
    Fan out to multiple agents in parallel, collect responses, send consolidated reply.
    """
    async def _call_agent(route: dict) -> tuple[str, str]:
        agent_id = route["agent"]
        routed_text = route["message"]
        handler = _get_agent_handler(agent_id, "process_message")
        if not handler:
            return agent_id, "Failed to process."
        try:
            reply = await handler(update, routed_text, send_reply=False)
            return agent_id, reply
        except Exception as e:
            logger.error(f"Multi-agent dispatch error ({agent_id}): {e}")
            return agent_id, "Something went wrong processing that."

    # LM-29: parallel fan-out
    results = await asyncio.gather(*[_call_agent(r) for r in routes])

    # Build consolidated reply with emoji prefixes
    parts = []
    for agent_id, reply in results:
        emoji = AGENT_EMOJI.get(agent_id, "")
        parts.append(f"{emoji} {reply}")

    consolidated = "\n\n".join(parts)

    sent_msg = await update.message.reply_text(consolidated)

    # Track context — use "multi" for multi-agent replies
    _update_recent_context(routes[0]["agent"])
    _track_reply(sent_msg.message_id, "multi")


# --- Document retrieval ---

async def _handle_document_query(update: Update, query_text: str):
    """Search documents and use Haiku to extract the answer from summaries."""
    from backend.documents import search_documents
    from backend import llm_client

    # Fetch all documents — the collection is small enough to send all
    # summaries to Haiku. Keyword search often fails because the router
    # sends a full sentence, not keywords.
    docs = await search_documents(limit=50)

    if not docs:
        await update.message.reply_text(
            "No documents stored yet. Upload a document via photo or PDF first."
        )
        _update_recent_context("documents")
        return

    # Build context from document summaries
    doc_context = "\n\n".join(
        f"[{d['title']}] (tags: {', '.join(d.get('tags', []))})\n{d.get('summary', 'No summary')}"
        for d in docs
    )

    # Ask Haiku to answer the user's question from the document summaries
    try:
        result = await llm_client.process_message(
            system_prompt=(
                "You are a document lookup assistant. The user is asking about information "
                "from their stored documents. Below are summaries of matching documents. "
                "Answer the user's question directly from these summaries. If the information "
                "isn't in any summary, say so and suggest they check the original document. "
                "Be concise and direct. Return JSON: {\"action\": \"respond\", \"reply\": \"your answer\"}"
            ),
            user_message=f"Question: {query_text}\n\nDocuments found:\n{doc_context}",
            max_tokens=500,
            model=llm_client.MODEL_FAST,
        )
        reply = result.get("reply", "I found some documents but couldn't extract the answer.")
    except Exception as e:
        logger.error(f"Document query failed: {e}")
        reply = "Something went wrong looking that up."

    await update.message.reply_text(reply)
    _update_recent_context("documents")


# --- Fallback keyboards ---

async def _send_fallback_keyboard(update: Update, text: str):
    """Send an inline keyboard asking the user which agent should handle the message."""
    buttons = [
        [
            InlineKeyboardButton(
                f"{AGENT_EMOJI['finance']} Finance",
                callback_data="router:finance",
            ),
            InlineKeyboardButton(
                f"{AGENT_EMOJI['life_manager']} Life Manager",
                callback_data="router:life_manager",
            ),
        ],
        [
            InlineKeyboardButton(
                f"{AGENT_EMOJI['health_body']} Health",
                callback_data="router:health_body",
            ),
            InlineKeyboardButton(
                f"{AGENT_EMOJI['investing']} Investing",
                callback_data="router:investing",
            ),
        ],
        [
            InlineKeyboardButton(
                f"{AGENT_EMOJI['reading_creative']} Creative",
                callback_data="router:reading_creative",
            ),
            InlineKeyboardButton(
                f"{AGENT_EMOJI['documents']} Documents",
                callback_data="router:documents",
            ),
        ],
    ]
    keyboard = InlineKeyboardMarkup(buttons)
    sent = await update.message.reply_text(
        "I'm not sure which agent should handle that. Which one?",
        reply_markup=keyboard,
    )

    # Store the original text so we can dispatch after selection
    _pending_fallback[sent.message_id] = {"text": text}

    # Clean old entries (keep last 20)
    if len(_pending_fallback) > 20:
        oldest_keys = sorted(_pending_fallback.keys())[:-20]
        for k in oldest_keys:
            _pending_fallback.pop(k, None)


# --- Helper functions ---

def _get_agent_handler(agent_id: str, method: str):
    """Dynamically import and return an agent's handler function."""
    try:
        if agent_id == "finance":
            from backend.agents.finance.telegram import process_message, process_photo
            return process_message if method == "process_message" else process_photo
        elif agent_id == "life_manager":
            from backend.agents.life_manager.telegram import process_message, process_photo
            return process_message if method == "process_message" else process_photo
        elif agent_id == "health_body":
            from backend.agents.health_body.telegram import process_message, process_photo
            return process_message if method == "process_message" else process_photo
        elif agent_id == "investing":
            from backend.agents.investing.telegram import process_message, process_photo
            return process_message if method == "process_message" else process_photo
        elif agent_id == "reading_creative":
            from backend.agents.reading_creative.telegram import process_message, process_photo
            return process_message if method == "process_message" else process_photo
    except ImportError as e:
        logger.error(f"Failed to import {agent_id} handler: {e}")
    return None


def _update_recent_context(agent: str):
    """Update the recent context buffer (LM-31)."""
    global _recent_context
    _recent_context = {"agent": agent, "timestamp": time.time()}


def _track_reply(message_id: int, agent: str):
    """Track which agent generated a bot reply (LM-30)."""
    _reply_source_map[message_id] = agent
    # Cap size
    if len(_reply_source_map) > _REPLY_MAP_MAX:
        oldest_keys = sorted(_reply_source_map.keys())[: len(_reply_source_map) - _REPLY_MAP_MAX]
        for k in oldest_keys:
            _reply_source_map.pop(k, None)


def _get_reply_to_agent(update: Update) -> str | None:
    """Check if the message is a reply to a tracked bot message (LM-30)."""
    try:
        reply_msg = update.message.reply_to_message
        if reply_msg and reply_msg.message_id in _reply_source_map:
            return _reply_source_map[reply_msg.message_id]
    except AttributeError:
        pass
    return None
