# LifeBoard — Personal AI Agent Dashboard
## Project Spec & Claude Code Handoff Document

---

## LAYER 1 — INTENT & CONSTRAINTS

### What Is This?
A personal life management system with two surfaces: (1) a **Telegram bot** for natural conversation-style input — logging expenses, adding tasks, asking questions, sending screenshots — and (2) a **web dashboard** for visual monitoring — charts, timelines, progress bars, the big picture. Both surfaces read and write to the same database. The system runs 24/7 on a dedicated Mac Mini home server.

### Who Is It For?
A single user (Gunnar). This is a personal tool, not a SaaS product. No auth system on the dashboard (it's on the local network). The Telegram bot is secured by chat ID (only responds to one user). Optimize for one person's experience.

### Non-Negotiable Architectural Decisions

1. **Stack**: React frontend (Vite), Python backend (FastAPI), SQLite database, python-telegram-bot for the Telegram integration, Anthropic API (Claude) for agent message processing.
2. **Single database, multi-table**: One SQLite file. Each agent owns its own set of tables. Agents have write access to their own tables and read access to all tables. No cross-agent writes.
3. **Runs on a Mac Mini home server**: The entire system (backend, frontend build, Telegram bot) runs on a Mac Mini (M4, 24GB RAM, ~500GB storage) that stays on 24/7. The dashboard is served on the local network so the user can access it from any device in the house. The Telegram bot connects outbound to Telegram's API, so no port forwarding or domain needed.
4. **LLM-powered message processing**: When the user sends a natural language message to the Telegram bot, the active agent routes it to Claude (via Anthropic API) with a system prompt specific to that agent's domain. Claude extracts structured data (amounts, categories, nutritional info, task details, etc.) and returns a JSON action that the agent executes against the database. The LLM is the parser, not the database — it decides *what* to write, the agent code *does* the writing.
5. **Modular agent architecture**: Each agent is a self-contained Python module with its own routes, database models, Telegram command handlers, LLM system prompt, and business logic. Adding a new agent should require zero changes to existing agents.
6. **Two surfaces, one backend**: The dashboard is read-heavy (visualizations, charts, status). The Telegram bot is write-heavy (logging data, completing tasks, asking questions). Both hit the same FastAPI backend and the same database.
7. **Telegram is the primary input channel**: The user talks to agents by messaging the Telegram bot. The bot routes messages to the correct agent based on commands or context. The dashboard has lightweight forms as a secondary input method but the phone-first Telegram flow is the primary experience.
8. **Single-page dashboard**: The dashboard is one page with a sidebar for navigation between agent panels. No page reloads.
9. **Files stored on disk, metadata in SQLite**: Images (receipts, screenshots), PDFs (bloodwork, documents), and other files sent via Telegram are saved to an organized folder structure on disk (`data/files/{agent_id}/{YYYY-MM}/{filename}`). SQLite stores the file path, original filename, file type, timestamp, and any extracted metadata. The dashboard can display and link to these files. The Mac Mini's 500GB drive is more than sufficient.

### The Seven Agents (Full Roster)
Only the first two are built in v1. The rest are listed here so the architecture accounts for them.

| # | Agent | Domain | V1 Status |
|---|-------|--------|-----------|
| 1 | **Finance** | Budget, spending, income, recurring costs | ✅ BUILT |
| 2 | **Life Manager** | Calendar events, bills/due dates, insurance, apartment, emails/tasks | ✅ BUILT |
| 3 | Health & Body | Exercise, nutrition, sleep, medical | 🔲 Placeholder |
| 4 | Investing | Portfolio, market tracking, strategy | 🔲 Placeholder |
| 5 | Career | Skills, job market, professional development | 🔲 Placeholder |
| 6 | Projects | Active projects, milestones, task tracking | 🔲 Placeholder |
| 7 | Reading & Creative | Reading list, research notes, creative references | 🔲 Placeholder |

---

## LAYER 2 — MODULE SPECS

### 2.1 Dashboard Shell (shared infrastructure)

**Purpose**: The read-heavy visual surface. The user comes here to see charts, trends, and the big picture. It also has lightweight forms as a secondary input method, but the primary input channel is Telegram.

**Layout**:
- Left sidebar (collapsible): Home icon at the top, then agent list with icons and names. Clicking an agent loads its panel into the main content area. Active agent is highlighted. Placeholder agents are shown but grayed out with a "Coming Soon" label. Home is the default panel on load.
- Top bar: App name ("LifeBoard"), current date/time, a global notification area where any agent can surface one nudge/alert.
- Main content area: Renders the active agent's panel component, or the Home panel by default.

**Home panel**:

The default view when the dashboard loads. Answers "how does my life look right now?" in a single glance.

- **Greeting**: Time-aware, uses display name from config. "Good morning, G" / "Good afternoon, G" / "Good evening, G". Large, warm heading at the top of the panel. Shows today's date underneath.
- **Pulse strip**: A row of compact stat cards, one per active agent. Each card uses the agent's accent color as a left border or subtle background tint. Each card shows 2-3 key numbers — the most important at-a-glance metrics from that agent's data. Clicking a card navigates to that agent's panel.

  Finance pulse card example:
  - Net remaining this cycle: ¥58,000
  - Budget usage: 71%
  - Days until payday: 9

  Life Manager pulse card example:
  - Tasks due today: 2
  - Upcoming bills (7 days): 1
  - Overdue items: 0

  For placeholder agents (not yet built), the pulse card shows the agent name and icon in its accent color with "Coming soon" — keeping the visual rhythm consistent.

- **Pulse strip data**: Each agent module exposes a `get_pulse()` function that returns its 2-3 key metrics as a simple dict. The Home panel calls all active agents' pulse endpoints on load. This keeps the Home panel dumb — it just renders what the agents give it.
- **Animation**: Pulse cards stagger in on load (same 50-80ms delay pattern as other panels). Numbers count up from zero to their actual value on first render (a quick 400ms counter animation).
- **No other content**: No nudge feed, no timeline, no charts, no decorative elements. The home panel is pure signal.

**Network access**: The dashboard is served by the FastAPI backend on the Mac Mini's local IP (e.g., `http://192.168.x.x:8000`). Accessible from any device on the home network — laptop, phone browser, tablet. No external exposure.

**Notification system**:
- Each agent can register up to 1 active nudge (short text + severity: info/warning/alert).
- The top bar shows the single highest-severity nudge across all agents, with a badge count showing how many total active nudges exist.
- Clicking the notification area opens a dropdown showing all active nudges, sorted by severity (alert → warning → info).

**Design direction — "Unshackled Future"**:

The overall vibe is optimistic, lively, and forward-looking. This should feel like opening an app that's genuinely happy to see you — not sterile, not corporate, not "productivity guilt." Think bright mornings, not late-night grind sessions.

- **Theme**: Light base with vibrant accents. Warm off-white or soft cream background (`#FAFAF7` range), not clinical white. Depth comes from layered card surfaces with subtle shadows, not dark backgrounds.
- **Color palette**: Each agent gets a rich, saturated signature color — not muted pastels, not neon. Think colors that feel *confident*: a warm coral, a deep teal, a golden amber, a rich violet. The palette should feel like a garden in full bloom, not a hospital or a nightclub.
- **Typography**: A distinctive, friendly display font for headings (something with personality — Outfit, Sora, or similar geometric-but-warm sans). A clean readable body font (Nunito, DM Sans, or similar). Numbers and financial data get a slightly monospaced or tabular-number font for alignment, but not cold — something like JetBrains Mono or IBM Plex Mono.
- **Animation philosophy — everything earns its entrance**:
  - Panel transitions: Panels don't just appear. When switching agents, the current panel fades/slides out and the new one builds itself in with staggered reveals (cards arrive one by one with slight delays, ~50-80ms stagger).
  - Charts animate on load: Pie/donut charts fill in with a sweep animation. Bar charts grow upward from zero. Progress bars slide to their target value. Line charts draw themselves left to right. These animations are smooth (ease-out curves, 600-800ms duration) and only play on first load or data change, not on every render.
  - Micro-interactions: Buttons have subtle scale/color transitions on hover. Cards lift slightly on hover (translateY + shadow increase). Toggles animate smoothly. Checkboxes have a satisfying check animation.
  - Nudge notifications slide in from the top with a gentle bounce.
  - **No loading spinners** — use skeleton screens (animated placeholder shapes) when data is loading.
- **Spatial design**: Generous whitespace. Rounded corners on everything (12-16px radius on cards, 8px on buttons/inputs). Cards float above the background with soft box-shadows. The layout should breathe.
- **Accent usage**: Each agent's signature color appears in its sidebar icon, card headers, chart fills, and interactive elements. The color is used boldly but not overwhelmingly — it's the seasoning, not the main dish.
- **Empty states**: When a section has no data, show a friendly illustration or icon with encouraging text ("No expenses logged yet — add your first one!"), not a blank void.
- **Success feedback**: When the user adds a transaction or completes a task, give them a moment of delight — a brief checkmark animation, a subtle confetti particle burst, or a color flash. Small reward loops.
- **CSS approach**: Use CSS variables extensively for the theme. All agent colors, spacing scale, border radii, shadow depths, and animation durations defined as variables. Use Framer Motion (React) for orchestrated animations and page transitions. CSS transitions for simple hover/focus states.

### 2.2 Telegram Bot (shared infrastructure)

**Purpose**: The primary input channel. The user messages the bot from their phone to log data, manage tasks, and query their agents. The bot is a single Telegram bot account that routes messages to the correct agent.

**Bot identity**: One bot, named "LifeBoard" (or similar). The user talks to it in a single chat thread. The bot uses inline keyboards and command routing to direct input to the right agent.

**Security**: The bot only responds to a single Telegram chat ID (stored in `.env` as `TELEGRAM_CHAT_ID`). All other messages are silently ignored.

**Command routing**:
- `/finance` or `/f` — switches context to Finance agent
- `/life` or `/l` — switches context to Life Manager agent
- `/status` — returns a quick summary from all active agents
- `/help` — lists available commands

Once context is set, subsequent messages are routed to that agent until the user switches. Example flow:
```
User: /f
Bot: 💰 Finance active. Log a transaction, ask about your budget, or send a receipt photo.
User: spent 3500 on lunch
Bot: ✅ Logged ¥3,500 — Food & Dining. Cycle total: ¥142,000 / ¥200,000 budget.
User: how's my budget
Bot: 📊 Day 12 of cycle. ¥142,000 spent of ¥200,000 (71%). You're on pace.
User: [sends photo of a receipt]
Bot: 🧾 Got it. Looks like ¥2,180 at FamilyMart — Food & Dining. Log it? [Yes / Edit / Skip]
```

**Message processing (LLM-powered)**:
When the user sends a message, the active agent passes it to Claude (Anthropic API, Sonnet for cost efficiency) with:
- A system prompt specific to that agent's domain, defining the available actions and expected JSON output schema.
- The last few messages for conversational context (kept short — 5 messages max, not full history).
- Current relevant state (e.g., Finance agent includes current cycle budget totals so Claude can give contextual responses).

Claude returns a structured JSON action, for example:
```json
{
  "action": "log_transaction",
  "data": {
    "amount": -3500,
    "currency": "JPY",
    "category": "Food & Dining",
    "description": "lunch"
  },
  "reply": "✅ Logged ¥3,500 — Food & Dining. Cycle total: ¥142,000 / ¥200,000 budget."
}
```

The agent code validates and executes the action against the database, then sends Claude's reply text back to the user via Telegram. The LLM decides *what* to do; the agent code *does* it. Claude never has direct database access.

If Claude can't determine the intent or needs clarification, it returns an `"action": "clarify"` with suggested options that the bot renders as an inline keyboard.

**File handling (photos, PDFs, screenshots)**:
When the user sends an image or document via Telegram:
1. The bot downloads the file from Telegram's servers.
2. Saves it to `data/files/{agent_id}/{YYYY-MM}/{filename}` on disk.
3. Stores metadata in the agent's file reference table (path, type, timestamp, source context).
4. If it's an image, sends it to Claude with the message context for extraction (receipt amounts, bloodwork values, etc.). Claude returns structured data as a JSON action, same as text messages.
5. The bot confirms what was extracted and asks for confirmation before writing to the database.

**Telegram features used**:
- Inline keyboards: For category selection, confirmation, quick actions, clarification options.
- Reply markup: For yes/no confirmations ("Log ¥3,500 as Food & Dining?").
- Photo/document handling: Full download, storage, and LLM-powered extraction pipeline.
- Formatted messages: Use Telegram's MarkdownV2 for clean bot responses with bold, monospace numbers, and emoji.

**Nudge delivery**: The bot proactively sends messages when nudge conditions are met (bill due tomorrow, over budget, overdue task). This replaces push notifications — the user gets a Telegram message on their phone. Nudge checks run on two triggers: (1) a scheduled interval via APScheduler (every 6 hours), and (2) a lightweight check after each user interaction (non-blocking — run as a fire-and-forget asyncio task so it doesn't delay the message response).

### 2.3 Finance Agent

**Accent color**: Warm teal (`#0EA5A0`) — fresh, confident, associated with growth without being the cliché money-green.

**Database tables**:

```
finance_accounts
  - id: INTEGER PRIMARY KEY
  - name: TEXT (e.g., "Aki Gin", "Wise", "US Bank", "Cash Wallet", "Savings")
  - account_type: TEXT (bank, wallet, investment, cash, transfer_service)
  - currency: TEXT (JPY or USD)
  - current_balance: INTEGER (updated on each transaction, in smallest currency unit)
  - is_active: BOOLEAN
  - notes: TEXT (optional, e.g., "Main Japanese bank, salary deposited here")
  - sort_order: INTEGER (display order on dashboard)
  - created_at: TIMESTAMP

finance_transactions
  - id: INTEGER PRIMARY KEY
  - date: DATE
  - amount: INTEGER (positive = income/inflow, negative = expense/outflow, in smallest currency unit)
  - account_id: INTEGER (FK to finance_accounts, required)
  - category: TEXT (from predefined set + custom)
  - description: TEXT
  - is_recurring: BOOLEAN
  - recurring_id: INTEGER (nullable, FK to finance_recurring)
  - is_auto: BOOLEAN (was this auto-generated by an autopay recurring item?)
  - created_at: TIMESTAMP

finance_transfers
  - id: INTEGER PRIMARY KEY
  - date: DATE
  - from_account_id: INTEGER (FK to finance_accounts)
  - to_account_id: INTEGER (FK to finance_accounts)
  - from_amount: INTEGER (amount debited, in source account's currency unit)
  - to_amount: INTEGER (amount credited, in destination account's currency unit)
  - description: TEXT (e.g., "Wise transfer to US", "ATM withdrawal")
  - created_at: TIMESTAMP

finance_recurring
  - id: INTEGER PRIMARY KEY
  - name: TEXT
  - amount: INTEGER
  - account_id: INTEGER (FK to finance_accounts — which account this debits/credits)
  - category: TEXT
  - frequency: TEXT (monthly, weekly, yearly)
  - next_due: DATE
  - is_autopay: BOOLEAN (if true, auto-logs on due date; if false, nudges for manual confirmation)
  - is_active: BOOLEAN
  - created_at: TIMESTAMP

finance_budgets
  - id: INTEGER PRIMARY KEY
  - category: TEXT
  - monthly_limit: INTEGER (in primary currency unit)
  - created_at: TIMESTAMP

finance_files
  - id: INTEGER PRIMARY KEY
  - file_path: TEXT (relative path on disk)
  - original_filename: TEXT
  - mime_type: TEXT (image/jpeg, application/pdf, etc.)
  - file_size: INTEGER (bytes)
  - linked_transaction_id: INTEGER (nullable, FK to finance_transactions)
  - description: TEXT (LLM-generated summary of what the file contains)
  - extracted_data: TEXT (nullable, JSON string of any structured data pulled from the file)
  - created_at: TIMESTAMP
```

**Accounts & pools**: The foundation of the Finance agent. Every transaction belongs to an account. The user creates accounts to mirror their real money pools:
- Aki Gin (JPY, bank) — salary, rent autopay, gas autopay
- Cash Wallet (JPY, cash) — ATM withdrawals, daily spending
- Wise (USD, transfer_service) — currency bridge
- US Bank (USD, bank) — phone plan, US subscriptions
- Investment Platform (USD, investment) — brokerage, etc.

Accounts are created via Telegram ("add account Wise, USD, it's my transfer service") or via the dashboard. Each account tracks a running balance. The dashboard shows all accounts in a "money pools" overview — a visual strip of cards showing each account name, balance, and type. A toggle lets the user view totals grouped by currency (all JPY pools combined, all USD pools combined).

**Transfers vs transactions**: Moving money between accounts is a *transfer*, not a transaction. "Pulled 50k from the ATM" = transfer from Aki Gin to Cash Wallet, ¥50,000. "Moved money to Wise" = transfer from Aki Gin to Wise, with potentially different from/to amounts if currency conversion is involved. Transfers do NOT count as spending or income in budget calculations — they just move money between pools.

**Cash wallet tracking**: The Cash Wallet account works like any other account but supports a special interaction: the user can report a balance check. "I've got about 20k left in my wallet" → the system calculates the delta since the last known balance, and the user can optionally categorize where the difference went. If the user doesn't categorize, it's logged as "Uncategorized cash spending." This is the "fuzzy awareness" pattern — better to capture approximate data than nothing.

**Default categories**: Housing, Food & Dining, Transportation, Utilities, Social & Going Out, Shopping, Health, Education, Subscriptions, Income, Savings Transfer, Other. (Note: "Social & Going Out" replaces "Entertainment" as a distinct category for bars, parties, dinners with friends. User can add custom categories via Telegram.)

**Budget cycle**: 21st to 20th. The user's pay arrives on the 21st of each month, so all "monthly" calculations — budget progress, spending totals, trend charts — use the 21st-to-20th window, not calendar months. The overview strip should display "Day X of cycle" (not "day of month") and "X days until next payday." This applies everywhere: the 6-month trend chart shows 6 pay periods, budget-vs-actual resets on the 21st, etc.

**Currency display**: The dashboard defaults to showing the primary currency (JPY). A toggle switches the overview to USD or shows a combined "all pools" view. Budgets are set in the primary currency only (JPY) — USD spending is tracked but not budget-constrained in v1.

**Salary logging**: On first "got paid" message, Claude asks whether the amount is gross or net (take-home). The answer is stored in `user_config.json` as `salary_is_net: true/false`. Subsequent salary logs use the same assumption without re-asking.

**Action schema (what Claude can do)**:

These are the actions Claude can return as JSON. Each action has a name, required/optional fields, and a description the LLM system prompt uses to decide when to invoke it. The agent code has a handler function for each action that validates and executes it.

*Write actions — Accounts:*

| Action | Fields | Description |
|--------|--------|-------------|
| `add_account` | name (str, required), currency (JPY/USD, required), account_type (bank/wallet/investment/cash/transfer_service, required), initial_balance (int, default 0), notes (str, optional) | Create a new money pool. "Add my Wise account, it's got about $2,300 in it." |
| `edit_account` | account_id (int, required), plus any fields to update | Rename, update balance manually, change notes. "Actually my Wise has $2,500 now." |
| `update_balance` | account_id (int, required), new_balance (int, required), categorize_delta (dict, optional: {category: amount}) | Report a balance check, especially for cash. "I've got 20k left in my wallet, mostly spent on food and going out." If categorize_delta is provided, the difference is split into transactions. Otherwise logged as uncategorized. |
| `deactivate_account` | account_id (int, required) | Hide an account without deleting data. |

*Write actions — Transactions:*

| Action | Fields | Description |
|--------|--------|-------------|
| `log_transaction` | amount (int, required), account_id (int, required — Claude infers from context or asks), category (str), description (str), date (ISO date, default today) | Log a new income or expense. Positive = income, negative = expense. Claude infers the category and account from context ("lunch" → Food & Dining from Cash Wallet; "got paid 280000" → Income to Aki Gin). |
| `edit_transaction` | transaction_id (int, required), plus any fields to update | Modify an existing transaction. "That last one was actually 4000." |
| `delete_transaction` | transaction_id (int, required) | Remove a transaction. Always confirm via `clarify` first. |
| `log_transfer` | from_account_id (int, required), to_account_id (int, required), from_amount (int, required), to_amount (int, optional — defaults to from_amount if same currency), description (str, optional), date (ISO date, default today) | Move money between accounts. "Pulled 50k from the ATM" → transfer Aki Gin → Cash Wallet. "Moved 200000 yen to Wise, got about $1300" → transfer Aki Gin → Wise with currency conversion. |

*Write actions — Recurring & Budgets:*

| Action | Fields | Description |
|--------|--------|-------------|
| `add_recurring` | name (str), amount (int), account_id (int), category, frequency (monthly/weekly/yearly), next_due (ISO date), is_autopay (bool, required) | Add a recurring item. "Rent is 85000 from Aki Gin on the 25th, it's autopay." Autopay items auto-log on their due date. Manual items trigger a nudge. |
| `edit_recurring` | recurring_id (int, required), plus any fields to update | Modify a recurring item. |
| `deactivate_recurring` | recurring_id (int, required) | Stop tracking a recurring item. |
| `set_budget` | category (str, required), monthly_limit (int, required) | Create or update a budget cap for a category. Always in primary currency. |
| `store_file` | file_context (str), link_to_transaction_id (int, nullable) | Store a receipt photo or financial document. Bot handles download; Claude provides context. |

*Read actions:*

| Action | Fields | Description |
|--------|--------|-------------|
| `get_accounts_overview` | — | All active accounts with current balances, grouped by currency. The "where is my money?" view. |
| `get_budget_status` | — | Current cycle budget summary — total spent, total budget, per-category breakdown, percentage used, days remaining. Excludes transfers. |
| `get_spending_by_category` | num_cycles (int, default 1) | Breakdown of spending by category for current or past N cycles. |
| `get_cycle_summary` | cycle_offset (int, default 0) | Full overview of a pay cycle — income, expenses, net, top categories, transfers. |
| `get_transactions` | filters: account_id (optional), category (optional), date_from (optional), date_to (optional), search (str, optional), limit (int, default 10) | Search and list transactions. "What did I spend on social stuff this month?" |
| `get_transfers` | filters: account_id (optional), date_from (optional), date_to (optional), limit (int, default 10) | List transfers. "How much have I moved to Wise this year?" |
| `get_recurring_list` | active_only (bool, default true), autopay_only (bool, optional) | List recurring items. "What are my USD subscriptions?" (filters by account currency). |
| `compare_cycles` | cycle_a_offset (int, default 0), cycle_b_offset (int, default -1) | Compare two pay cycles. |
| `get_file` | file_id (int) or search (str) | Retrieve a stored file. |

*Meta actions (shared across all agents):*

| Action | Fields | Description |
|--------|--------|-------------|
| `respond` | — | Reply with information only. No database write. |
| `clarify` | options (list of strings, optional) | Ask for more info. Inline keyboard if options provided. |
| `multi_action` | actions (list of action objects) | Execute multiple actions in sequence. Max 10 sub-actions (raised from 5 to handle retroactive dumps like "here's what I spent this week"). |

**Panel layout (4 sections)**:

**Section A — Accounts overview** (top of panel):
- Horizontal strip of account cards, one per active account. Each shows: account name, icon by type, current balance, currency. Cards are draggable to reorder.
- A summary bar below the cards: total JPY across all JPY accounts, total USD across all USD accounts. Toggle to show one currency or both.
- "Add account" button at the end of the strip.

**Section B — Cycle overview** (below accounts):
- Cycle income vs expenses (two big numbers, with net difference). Excludes transfers.
- Current cycle spending as a percentage of total budget (progress bar).
- Days remaining until next payday (21st).

**Section C — Visualizations** (middle, 2-column grid):
- **Spending by category**: Donut/pie chart. Clickable segments filter the transaction list.
- **Cycle trend**: Bar chart showing income vs expenses for the last 6 pay cycles.
- **Budget vs Actual**: Horizontal bar chart per category showing budget limit vs current spend. Bars turn red when over budget.
- **Money flow**: Simple Sankey or flow diagram showing money moving between accounts this cycle (salary in → Aki Gin → rent, ATM → cash, transfer → Wise). Optional, nice-to-have.

**Section D — Data entry & transaction list** (bottom):
- Quick-add form: Date (defaults today), amount, account dropdown, category dropdown, description, recurring toggle.
- Transaction list: Scrollable table sorted by date descending. Columns: Date, Account, Description, Category, Amount. Color-coded (green for income, red for expense, blue for transfers). Editable inline.
- Recurring expenses manager: List of active recurring items with autopay badge, ability to add/edit/deactivate.

**Nudge logic**:
- If spending in any category exceeds 80% of budget → warning nudge.
- If total cycle spend exceeds 90% of total budget → alert nudge.
- If a manual-pay recurring item is due within 3 days → info nudge ("Internet due in 3 days — ¥12,000").
- Autopay items: auto-log the transaction on the due date, send a quiet confirmation nudge ("Rent ¥85,000 auto-logged from Aki Gin. Correct? [Yes / Edit]"). If the user says nothing, it stands.
- Nudges respect quiet hours from `user_config.json`. No nudges during configured quiet hours (e.g., 8:00-16:00 weekdays).

### 2.4 Life Manager Agent

**Accent color**: Warm coral (`#F97066`) — energetic, approachable, signals "life in motion."

**Database tables**:

```
life_events
  - id: INTEGER PRIMARY KEY
  - title: TEXT
  - date: DATE
  - time: TIME (nullable)
  - category: TEXT (appointment, deadline, reminder, social, errand)
  - description: TEXT
  - is_recurring: BOOLEAN
  - recurring_rule: TEXT (nullable — "monthly", "weekly", "yearly", or cron-like)
  - is_completed: BOOLEAN
  - completed_at: TIMESTAMP (nullable)
  - created_at: TIMESTAMP

life_bills
  - id: INTEGER PRIMARY KEY
  - name: TEXT
  - amount: INTEGER (in smallest currency unit, per LM-06)
  - due_date: DATE (the original/anchor due date, e.g., the 15th)
  - next_due: DATE (rolling due date, advances after each payment — mirrors finance_recurring pattern)
  - frequency: TEXT (monthly, quarterly, yearly, one-time)
  - category: TEXT (rent, utilities, insurance, subscription, tax, other)
  - is_autopay: BOOLEAN
  - is_paid: BOOLEAN (for current cycle — resets to false when next_due advances)
  - notes: TEXT
  - created_at: TIMESTAMP

life_tasks
  - id: INTEGER PRIMARY KEY
  - title: TEXT
  - priority: TEXT (high, medium, low)
  - due_date: DATE (nullable)
  - category: TEXT (errand, admin, home, communication, other)
  - is_completed: BOOLEAN
  - created_at: TIMESTAMP
  - completed_at: TIMESTAMP (nullable)

life_documents
  - id: INTEGER PRIMARY KEY
  - name: TEXT (e.g., "Apartment lease", "Health insurance policy")
  - category: TEXT (housing, insurance, legal, medical, financial, other)
  - expiry_date: DATE (nullable)
  - notes: TEXT
  - created_at: TIMESTAMP

life_files
  - id: INTEGER PRIMARY KEY
  - file_path: TEXT (relative path on disk)
  - original_filename: TEXT
  - mime_type: TEXT
  - file_size: INTEGER (bytes)
  - linked_document_id: INTEGER (nullable, FK to life_documents)
  - linked_bill_id: INTEGER (nullable, FK to life_bills)
  - linked_task_id: INTEGER (nullable, FK to life_tasks)
  - description: TEXT (LLM-generated summary)
  - extracted_data: TEXT (nullable, JSON string)
  - created_at: TIMESTAMP
```

**Action schema (what Claude can do)**:

*Write actions — Events:*

| Action | Fields | Description |
|--------|--------|-------------|
| `add_event` | title (str, required), date (ISO date, required), time (HH:MM, optional), category (appointment/deadline/reminder/social/errand), description (str, optional), is_recurring (bool), recurring_rule (str, optional) | Create a calendar event. "Dentist appointment next Thursday at 2pm." |
| `edit_event` | event_id (int, required), plus any fields to update | Modify an existing event. "Move the dentist to Friday." |
| `delete_event` | event_id (int, required) | Remove an event. Confirm via `clarify` first. |
| `complete_event` | event_id (int, required) | Mark an event as done. "Dentist is done." |

*Write actions — Tasks:*

| Action | Fields | Description |
|--------|--------|-------------|
| `add_task` | title (str, required), priority (high/medium/low, default medium), due_date (ISO date, optional), category (errand/admin/home/communication/other) | Create a task. "Remind me to call the landlord" or "I need to renew my visa, high priority, due April 15." |
| `edit_task` | task_id (int, required), plus any fields to update | Modify a task. "Make that visa thing high priority." |
| `complete_task` | task_id (int, required) | Mark task as done. "Done with the landlord call." Claude infers which task from context. |
| `delete_task` | task_id (int, required) | Remove a task. Confirm first. |

*Write actions — Bills:*

| Action | Fields | Description |
|--------|--------|-------------|
| `add_bill` | name (str, required), amount (int), due_date (ISO date), frequency (monthly/quarterly/yearly/one-time), category (rent/utilities/insurance/subscription/tax/other), is_autopay (bool, default false), notes (str, optional) | Register a bill to track. "I pay ¥12,000 for internet on the 15th every month." |
| `edit_bill` | bill_id (int, required), plus any fields to update | Modify bill details. |
| `mark_bill_paid` | bill_id (int, required) | Mark a bill as paid for the current cycle. "Paid rent." Claude matches by name. |
| `delete_bill` | bill_id (int, required) | Stop tracking a bill. Confirm first. |

*Write actions — Documents:*

| Action | Fields | Description |
|--------|--------|-------------|
| `add_document` | name (str, required), category (housing/insurance/legal/medical/financial/other), expiry_date (ISO date, optional), notes (str, optional) | Register a document for tracking. "My apartment lease expires March 2027, landlord is Tanaka-san, phone 090-xxxx." |
| `edit_document` | document_id (int, required), plus any fields to update | Update document info. "Actually the lease expires in April." |
| `delete_document` | document_id (int, required) | Remove a tracked document. |
| `store_file` | file_context (str), link_to_document_id (int, optional), link_to_bill_id (int, optional), link_to_task_id (int, optional) | Called when user sends a photo/PDF. "Here's a photo of my insurance card" → stores file, links to the insurance document entry, extracts any useful data (policy number, dates). |

*Read actions:*

| Action | Fields | Description |
|--------|--------|-------------|
| `get_today` | — | Everything happening today: events, tasks due, bills due. The daily briefing. |
| `get_upcoming` | days_ahead (int, default 7) | All events, tasks, and bills due in the next N days. "What's coming up this week?" |
| `get_overdue` | — | All overdue items across events, tasks, and bills. "Am I behind on anything?" |
| `get_tasks` | filters: priority (optional), category (optional), is_completed (bool, optional), search (str, optional), limit (int, default 10) | List/search tasks. "What are my high priority tasks?" or "Anything related to visa?" |
| `get_bills` | filters: is_paid (bool, optional), category (optional), upcoming_days (int, optional) | List/filter bills. "What bills are unpaid?" or "What's due this month?" |
| `get_events` | filters: date_from (optional), date_to (optional), category (optional), search (optional) | List/search events. "What appointments do I have next week?" |
| `get_documents` | filters: category (optional), expiring_within_days (int, optional), search (optional) | List/search tracked documents. "When does my lease expire?" or "Show my insurance docs." |
| `get_file` | file_id (int) or search (str) or linked_document_id (int) | Retrieve a stored file. "Show me my insurance card photo." Returns file path so the bot can send it back via Telegram. |

*Meta actions (same as Finance — shared across all agents):*

| Action | Fields | Description |
|--------|--------|-------------|
| `respond` | — | Reply with information only. No database write. |
| `clarify` | options (list of strings, optional) | Ask for more info. Renders as inline keyboard if options provided. |
| `multi_action` | actions (list of action objects) | Execute multiple actions. "Add a task to call the electrician and mark the water bill as paid." Max 10 sub-actions. |

**Panel layout (3 sections)**:

**Section A — Upcoming timeline** (top):
- A horizontal scrolling timeline showing the next 14 days.
- Each day shows dots/icons for events, bills due, and tasks due.
- Today is visually prominent. Days with overdue items are flagged red.

**Section B — Active panels** (middle, 2-column grid):
- **Bills tracker**: List of bills sorted by due date. Shows: name, amount, due date, autopay badge, paid/unpaid toggle. Overdue bills highlighted red. Monthly total at top.
- **Task board**: Simple priority-sorted task list. Checkboxes to complete. Quick-add at top. Completed tasks collapse to a "Done" section.

**Section C — Reference & entry** (bottom):
- **Quick-add bar**: Unified input — type a task, event, or bill and categorize it with a dropdown.
- **Document registry**: Collapsible list of tracked documents with expiry warnings. Stores metadata and notes (e.g., "Lease expires March 2027, landlord contact: xxx"). Documents can have attached files (photos, scans, PDFs) — click to view. File badge shows when an attachment exists.
- **Upcoming bills calendar**: Small month-view calendar with bill due dates marked.

**Cross-agent reads**:
- Life Manager reads `finance_recurring` to flag if any recurring financial commitments are also tracked as bills (deduplication hint, not enforcement).
- **Ownership rule**: Finance owns the *money* side of recurring payments — auto-logging transactions, tracking amounts, updating account balances. Life Manager owns the *calendar/admin* side — tracking due dates, paid/unpaid status for the user's awareness, and surfacing reminders. If rent exists in both systems, Finance handles the autopay transaction and Life Manager tracks whether the user has mentally "checked it off." Nudges come from whichever agent owns the relevant concern: Finance nudges about budget impact, Life Manager nudges about upcoming due dates. Neither agent writes to the other's tables.

**Nudge logic**:
- Bill due within 3 days and not marked paid → warning nudge.
- Overdue bill → alert nudge.
- Task marked high priority with due date within 2 days → warning nudge.
- Document expiring within 30 days → info nudge.

---

## LAYER 3 — LANDMINE ANNOTATIONS

### ⚠️ LM-01: No ORM Magic
Use raw SQL with Python's `sqlite3` module or `aiosqlite` for async. Do NOT introduce SQLAlchemy or any ORM. For a personal single-user SQLite app, an ORM adds complexity with zero benefit. Write clear, readable SQL.

### ⚠️ LM-02: Agent Registration Must Be Declarative
Each agent should register itself with the dashboard shell via a simple config object:
```python
AGENT_CONFIG = {
    "id": "finance",
    "name": "Finance",
    "accent_color": "#0EA5A0",
    "icon": "dollar-sign",  # Lucide icon name
    "enabled": True,
    "nudge_endpoint": "/api/finance/nudge"
}
```
The shell reads all agent configs at startup and builds the sidebar dynamically. Adding a new agent = adding a new folder with a config. No touching shell code.

### ⚠️ LM-03: Date Handling
All dates stored as ISO 8601 strings in SQLite (`YYYY-MM-DD`). All timestamps as ISO 8601 with timezone (`YYYY-MM-DDTHH:MM:SS+09:00`). The user is in JST (Japan Standard Time). Frontend displays relative dates ("3 days from now", "overdue by 2 days") alongside absolute dates.

### ⚠️ LM-04: No Premature Abstraction
Do NOT create a generic "Agent base class" or "AgentFactory" or any over-engineered abstraction layer. Each agent is just a Python module with routes and database functions. If patterns emerge after building agents 3-5, refactor then. For now, keep it stupid simple. **Exception**: a shared `action_executor.py` that handles the validate → execute → respond loop is fine — that loop is truly identical across all agents and avoids duplication. What's banned is abstract agent *classes* and inheritance hierarchies, not shared utility functions.

### ⚠️ LM-05: Frontend Libraries
Use **Recharts** for all data visualizations (pie, bar, line, progress). It's React-native and handles animated chart transitions well. Use **Framer Motion** for all page transitions, staggered reveals, and orchestrated entrance animations. Use **lucide-react** for all icons (sidebar agent icons, UI elements, status indicators). CSS transitions handle simple hover/focus states. Do NOT use D3 directly, GSAP, or any other animation library.

### ⚠️ LM-06: Transaction Amounts
Store all amounts as integers representing the smallest currency unit (yen, so ¥1 = 1). This avoids all floating-point issues. The frontend formats for display. Since the user is in Japan, the default currency is JPY with no decimal places.

### ⚠️ LM-07: Recurring Item Auto-Logging (Autopay vs Manual)
Recurring items have an `is_autopay` flag. **Autopay items** (rent, gas, subscriptions that auto-debit) auto-generate a transaction on their due date and advance `next_due` to the next cycle. A quiet confirmation nudge is sent via Telegram ("Rent ¥85,000 auto-logged from Aki Gin. Correct?"). If the user doesn't respond, it stands. **Manual-pay items** (bills you pay at the konbini, one-off recurring events) do NOT auto-generate. They surface a reminder nudge, and the user confirms when paid. This distinction is critical — do not treat all recurring items the same way.

### ⚠️ LM-08: API Route Namespacing
All API routes must be namespaced per agent:
- `/api/finance/*` — Finance agent routes
- `/api/life/*` — Life Manager routes
- `/api/nudges` — Aggregated nudge endpoint (shell-level, reads from all agents)

### ⚠️ LM-09: Error Handling in Forms
Every form submission must show inline validation errors AND a success/failure toast. Do not silently succeed or fail. The user should always know what happened.

### ⚠️ LM-10: Do Not Over-Design the Placeholder Panels
For agents 3-7, create a single reusable `PlaceholderPanel` component that shows the agent name, icon, accent color, and a "Coming Soon" message. Do not build any UI or backend logic for these agents.

### ⚠️ LM-11: Telegram Bot Library
Use `python-telegram-bot` (v20+, async). It handles polling, message parsing, inline keyboards, and scheduling natively. Do NOT use raw HTTP calls to the Telegram API. Do NOT use `aiogram` or other alternatives.

### ⚠️ LM-12: Telegram Bot Runs Inside FastAPI
The Telegram bot should start as a background task when the FastAPI app starts, NOT as a separate process. Use `python-telegram-bot`'s `Application` class with webhook mode or polling mode running in an asyncio task alongside uvicorn. One process, one database connection pool, one deployment unit.

### ⚠️ LM-12a: CORS Configuration
In production, the FastAPI backend serves the built frontend as static files from the same origin — no CORS headers needed. During development (Vite dev server on port 5173, backend on port 8000), enable permissive CORS: `allow_origins=["*"]`. Use an environment variable (e.g., `ENV=dev` vs `ENV=prod`) to toggle. Do not ship wide-open CORS in production — it's unnecessary since both surfaces are same-origin or outbound-only (Telegram).

### ⚠️ LM-13: LLM Is the Parser, Not the Database
Claude (via Anthropic API) processes user messages and returns structured JSON actions. The agent code validates the JSON, checks it against allowed actions, and executes it. Claude NEVER gets raw database access, SQL strings, or direct write capability. The flow is always: user message → Claude → JSON action → agent validation → database write. If Claude returns an action that doesn't match the agent's allowed action schema, reject it and ask the user to rephrase.

### ⚠️ LM-13a: LLM Model and Cost Control
Use `claude-sonnet-4-20250514` (Sonnet) for all agent message processing — it's fast, cheap, and more than capable for structured extraction. Do NOT use Opus for routine message parsing. Keep system prompts short and focused. Include only the current agent's action schema and minimal state context (e.g., current budget totals), not full database dumps. Cap conversation context at the last 5 messages to control token usage.

### ⚠️ LM-13b: LLM System Prompts Are Per-Agent
Each agent defines its own system prompt that tells Claude: (1) what domain this agent manages, (2) the exact JSON action schemas it can return, (3) the current state summary to reference. These prompts live in each agent's module (e.g., `finance/llm_prompt.py`). Do NOT create a generic "agent LLM handler." Each agent knows its own domain best.

### ⚠️ LM-13c: File Storage on Disk, Not in SQLite
NEVER store binary file data (images, PDFs) in SQLite. Store files on disk at `data/files/{agent_id}/{YYYY-MM}/{filename}`. Store only the metadata in SQLite: file path, original filename, MIME type, file size, timestamp, and any structured data extracted by the LLM. The dashboard serves files via a static file endpoint on FastAPI.

### ⚠️ LM-13d: Action Validation Is Non-Negotiable
Every action Claude returns MUST be validated before execution. Each agent defines an `ACTION_REGISTRY` — a dict mapping action names to their handler functions and required field schemas. When Claude returns JSON, the agent code: (1) checks the action name exists in the registry, (2) validates all required fields are present and correctly typed, (3) checks any referenced IDs actually exist in the database, (4) only then executes. If validation fails, the bot tells the user something went wrong and asks them to rephrase. NEVER skip validation, even for simple actions like `respond`.

### ⚠️ LM-13e: System Prompt Must Include State Context
The LLM system prompt for each agent is NOT static — it's a template that gets populated with current state before each API call. For Finance, this means injecting: today's date and day of week (per LM-18), current cycle day number, account list with balances, current cycle budget totals per category, recent transaction list (last 5), list of recurring items, and the user's category list (dynamically pulled per LM-20). For Life Manager: today's date, today's events/tasks/bills, overdue items, upcoming items (3 days), document count and nearest expiry. If any agent's data is empty, the prompt should note this so Claude can trigger onboarding conversation (per LM-23). Keep the injected state concise — summary numbers and short lists, not full database dumps.

### ⚠️ LM-13f: Read Actions Return Data to Claude for Formatting
When Claude returns a read action (like `get_budget_status`), the agent executes the query, then sends the raw data BACK to Claude in a follow-up API call with a formatting instruction. Claude then produces a nicely formatted Telegram response with emoji, bold numbers, and conversational framing. This two-step pattern (Claude picks action → agent fetches data → Claude formats response) is more expensive but produces dramatically better replies than templated strings. Alternatively, for simple reads, the first Claude call can include enough state context that it writes the reply directly without a second call — use judgment per action.

### ⚠️ LM-13g: File Retrieval Sends Actual Files Back
When a read action returns a file reference (like `get_file`), the bot must send the actual file back to the user via Telegram — not just the file path or metadata. Use Telegram's `send_photo` or `send_document` methods to push the file. "Show me my insurance card" should result in the photo appearing in the chat, not a text description of where the file is stored.

### ⚠️ LM-14: Telegram Context State
Store the user's active agent context (which agent they're talking to) in memory, NOT in the database. It resets on bot restart, which is fine — the user just sends `/f` or `/l` again. Do not over-engineer session management.

### ⚠️ LM-15: No Hardcoded User Values
Even though v1 is built for a single user, do NOT hardcode the user's name, currency, pay cycle day, timezone, or active agent list anywhere in the code. All of these must be read from a `user_config.json` file at startup via a `get_config()` utility function. In v1, this file can be hand-created (we'll provide a template), but the code must be ready for the setup wizard in Milestone 5. Default config values (generic fallbacks for new users, NOT the expected v1 values — Gunnar's actual config is in the Milestone 5 example): name="User", display_name="friend", timezone="UTC", primary_currency="USD", secondary_currency=null, pay_cycle_day=1, active_agents=["finance","life_manager"].

### ⚠️ LM-16: Transfers Are Not Spending
Money moving between accounts (ATM withdrawal, Wise transfer, moving to savings) is a `finance_transfers` record, NOT a transaction. Transfers are excluded from budget calculations, spending charts, and cycle income/expense summaries. They appear in the transaction list with a distinct blue color and "transfer" label but do not affect budget math. This is the single most important accounting rule in the system — if transfers leak into spending, every chart lies.

### ⚠️ LM-17: Account Balances Stay in Sync
Every `log_transaction` must update the associated account's `current_balance`. Every `log_transfer` must update BOTH accounts' balances (debit source, credit destination). This must happen atomically — use a SQLite transaction (BEGIN/COMMIT) wrapping both the insert and the balance update. If either fails, both roll back. Never let the balance drift out of sync with the transaction history.

### ⚠️ LM-18: LLM System Prompt Must Include Current Date Context
Every LLM system prompt must inject today's date, day of the week, and the current cycle day number. This is critical for resolving relative date references in retroactive dumps ("Wednesday I spent 2000 on lunch, Thursday was the bar"). Without explicit date context, Claude will misinterpret relative day names. Format: "Today is Sunday, March 22, 2026. Day 1 of current pay cycle (Mar 21 – Apr 20)."

### ⚠️ LM-19: Multi-Action Cap Is 10
The `multi_action` wrapper supports up to 10 sub-actions per message. Users will do retroactive dumps covering a full week in one message. Each sub-action gets validated independently. If one fails, the successful ones still commit (partial success) and the bot reports which ones failed.

### ⚠️ LM-20: Custom Categories Are Allowed
The default category list is a starting point, not a constraint. If the user says "log 3000 yen for karate" and karate doesn't fit any default category, Claude can either map it to the closest fit (Health or Education) or create a new custom category. Custom categories are just strings — no schema change needed, they're stored as text. The category list shown in the dashboard and in the LLM state context should be dynamically pulled from all categories that exist in the transaction table, not from a hardcoded list.

### ⚠️ LM-21: Quiet Hours for Nudges
`user_config.json` must include a `quiet_hours` field: `{"weekday": {"start": "08:00", "end": "16:00"}, "weekend": null}`. This suppresses nudges during work/school hours so they arrive in the evening when the user is home. The nudge scheduler checks quiet hours before sending any Telegram message. During quiet hours, nudges queue up and fire as a batch when quiet hours end. Dashboard nudges are unaffected — they show anytime the user opens the dashboard.

### ⚠️ LM-22: Japanese Document Extraction
The LLM system prompt must explicitly tell Claude to extract structured data from Japanese-language documents when processing images. Common Japan-specific documents include: 源泉徴収票 (tax withholding slip), 給与明細 (pay stub), 在留カード (residence card), 健康保険証 (health insurance card), 年金手帳 (pension book), 住民票 (resident registration). Claude should extract key fields (amounts, dates, ID numbers, names) into the `extracted_data` JSON field in the relevant language.

### ⚠️ LM-23: Onboarding Conversation Flow
The Telegram bot should detect when an agent's data is empty (no accounts for Finance, no documents for Life Manager) and offer a guided onboarding conversation on first interaction. Finance: "Looks like you haven't set up any accounts yet. Let's start — what's your main bank account called, and roughly how much is in it?" Life Manager: "No documents tracked yet. Want to walk through your important docs? Let's start with housing — do you have a lease?" This is a special flow that the LLM system prompt triggers when it sees empty state context. It's not a separate onboarding mode — it's just Claude being smart about empty states.

---

## MILESTONES

### Milestone 1: Foundation
**Goal**: Empty dashboard shell with sidebar, top bar, notification area, and all 7 agents listed (5 as placeholders). Backend running with SQLite database initialized. Telegram bot connects and responds to `/help`. No agent logic yet.

**Deliverables**:
- Vite + React app with sidebar navigation (Home as default)
- Home panel with time-aware greeting (reads from `user_config.json`)
- Home panel pulse strip with placeholder cards for all 7 agents
- FastAPI backend with health check endpoint, serving built frontend on `0.0.0.0`
- SQLite database created with all tables for Finance and Life Manager
- Agent registration system working (shell reads agent configs)
- `user_config.json` template with defaults, read by `get_config()` utility
- Placeholder panels rendering for all 7 agents
- "Unshackled Future" light theme applied with CSS variables, fonts loaded
- Telegram bot connects on startup, responds to `/help` with command list
- Bot security: only responds to configured chat ID
- `.env` file for bot token and chat ID

**Done when**: You can start the app on the Mac Mini, open the dashboard from another device on the network, and see the Home panel with your greeting and placeholder pulse cards. The sidebar shows all 7 agents, clicking between them works, and the Telegram bot responds to `/help`. The database file exists with the correct schema.

### Milestone 2: Finance Agent — Full Build
**Goal**: Fully functional Finance panel with accounts, transactions, transfers, budgets, recurring items, and visualizations. Telegram bot can manage accounts, log transactions, transfer between accounts, track cash, and report budget status. Autopay recurring items auto-log.

**Deliverables**:
- All Finance CRUD API endpoints (accounts, transactions, transfers, recurring, budgets)
- Dashboard: Accounts overview strip with balance cards, currency toggle
- Dashboard: Add/edit account via dashboard form
- Dashboard: Transaction quick-add form with account selector (secondary input)
- Dashboard: Recurring expenses manager with autopay badge
- Dashboard: Budget setup per category
- Dashboard: Donut chart (spending by category) with sweep animation
- Dashboard: Bar chart (pay-cycle trend, last 6 cycles) with grow animation
- Dashboard: Budget vs actual horizontal bars
- Dashboard: Cycle overview strip (income vs expenses, budget %, days to payday)
- Dashboard: Transaction list with color coding (green income, red expense, blue transfer)
- Telegram: `/f` activates Finance context
- Telegram: Account management ("add account Wise, USD", "how much is in my wallet?")
- Telegram: Log transactions with account inference ("spent 3500 on lunch" → Cash Wallet, Food & Dining)
- Telegram: Log transfers ("pulled 50k from the ATM", "moved 200k yen to Wise, got $1300")
- Telegram: Cash balance check ("I've got about 20k left, mostly food and going out")
- Telegram: "budget" or "status" → formatted cycle summary
- Telegram: Retroactive dumps with relative date resolution ("Wednesday I spent 2000 on lunch, Thursday was the bar 5000")
- Telegram: Inline keyboard for clarification (category, account) when ambiguous
- Autopay recurring items auto-log on due date with confirmation nudge
- Manual recurring items trigger reminder nudge
- Nudge logic respects quiet hours
- Onboarding flow: if no accounts exist on first `/f`, guide user through account setup
- `get_pulse()` endpoint returning total balance, cycle net remaining, budget % — wired into Home panel pulse card

**Done when**: The user can manage their full financial picture through Telegram — accounts, spending, transfers, cash, recurring items. The dashboard shows all money pools, spending patterns, and budget progress. Autopay items log themselves. Nudges respect quiet hours.

### Milestone 3: Life Manager Agent — Full Build
**Goal**: Fully functional Life Manager panel with timeline, bills, tasks, document registry, and file attachments. Telegram bot can add tasks, mark bills paid, store documents with photos, and report upcoming items.

**Deliverables**:
- All Life Manager CRUD API endpoints
- Dashboard: 14-day timeline strip with staggered entrance animation
- Dashboard: Bills tracker with paid/unpaid toggle and autopay badge
- Dashboard: Task board with priorities and completion
- Dashboard: Document registry with file attachment badges, click-to-view
- Dashboard: Quick-add bar with category selection
- Dashboard: Cross-agent read — flag matching recurring expenses from Finance
- Telegram: `/l` activates Life Manager context
- Telegram: "add task [description]" → create task with priority/date inference
- Telegram: "paid rent" or "paid [bill name]" → mark bill as paid
- Telegram: "what's due" or "upcoming" → list upcoming bills and tasks
- Telegram: "done [task]" → mark task complete
- Telegram: Photo/PDF handling → store file, link to document, extract data from Japanese documents
- Telegram: "when does my lease expire?" → search documents
- Telegram: "show me my insurance card" → send file back via Telegram
- Onboarding flow: if no documents exist on first `/l`, walk through key document categories
- Nudge logic active — both surfaces, respects quiet hours
- `get_pulse()` endpoint returning tasks due today, upcoming bills count, overdue count — wired into Home panel pulse card

**Done when**: The user can manage their daily life from Telegram — tasks, bills, events, documents with attached files. Japanese documents are extractable. The dashboard shows everything visualized. Nudges fire appropriately with quiet hours respected.

### Milestone 4: Polish & Integration
**Goal**: Cross-agent features, UX refinement, animation polish, seed data.

**Deliverables**:
- Notification dropdown showing all active nudges across both agents
- Seed data script that populates realistic sample data for demo/testing
- All panel transition animations (staggered card reveals, chart animations)
- Skeleton loading screens for all panels
- Empty states with friendly messages for all sections
- Responsive layout (should work on laptop + tablet browser on local network)
- Telegram `/status` command returns cross-agent summary
- Nudge scheduler running on interval (every 6 hours + on interaction)
- `launchd` plist or `pm2` config for persistent running on Mac Mini

**Done when**: The app feels cohesive and alive. Both agents work together through the notification system. Animations are smooth and delightful. The system stays running on the Mac Mini without babysitting.

### Milestone 5: Portability & Setup Wizard (Future)
**Goal**: Anyone can clone the repo, run a setup command, and have their own personal LifeBoard instance configured and running in under 5 minutes. No code editing required.

**Setup wizard** (`python setup.py` or `lifeboard init`):
Interactive terminal flow that walks a new user through:
1. **Welcome & name**: "What's your name?" / "What should LifeBoard call you?" (used in Telegram greetings, dashboard header)
2. **Telegram connection**: Step-by-step guide to creating a bot via BotFather, paste token, then a "Send me a message on Telegram now" prompt that captures their chat ID automatically.
3. **Currency**: "What's your primary currency?" (JPY, USD, EUR, etc.) with optional secondary currency.
4. **Pay cycle**: "What day of the month do you get paid?" (defaults to 1st if skipped)
5. **Agent selection**: Show all 7 agents with one-line descriptions, let them toggle on/off. "You can always change this later."
6. **Time zone**: Auto-detect or ask.
7. **Write config**: Generates `.env` and a `user_config.json` with all preferences. Creates the database with the selected agent tables.
8. **Test**: Sends a test Telegram message ("LifeBoard is set up! Say /help to get started.") to confirm everything works.

**User config file** (`user_config.json`):
```json
{
  "user_name": "Gunnar",
  "display_name": "G",
  "timezone": "Asia/Tokyo",
  "primary_currency": "JPY",
  "secondary_currency": "USD",
  "pay_cycle_day": 21,
  "salary_is_net": true,
  "active_agents": ["finance", "life_manager"],
  "quiet_hours": {
    "weekday": {"start": "08:00", "end": "16:00"},
    "weekend": null
  },
  "locale": "en"
}
```

**Architecture implications for v1** (things to do NOW so Milestone 5 isn't a rewrite):
- All user-specific values (name, currency, pay cycle day, timezone) must be read from config at runtime, never hardcoded. Use a `get_config()` utility that reads from `user_config.json`.
- The database schema init must be dynamic — only create tables for active agents.
- Agent registration must respect the `active_agents` list — disabled agents don't load routes or show in the sidebar.
- Telegram greetings and responses should use `display_name` from config.
- The `.env` file is the only thing that contains secrets (bot token, chat ID). Everything else is in `user_config.json` which is safe to version or back up.

**Done when**: A non-technical family member can set up their own LifeBoard by following the terminal prompts, with no manual file editing. The system works with any currency, any pay schedule, and any subset of agents.

---

## PROJECT STRUCTURE

```
lifeboard/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, startup, static file serving
│   ├── database.py             # SQLite connection, schema init
│   ├── llm_client.py           # Anthropic API wrapper (send message, get JSON action)
│   ├── action_executor.py      # Shared validate → execute → respond loop for all agents
│   ├── agents/
│   │   ├── finance/
│   │   │   ├── config.py       # AGENT_CONFIG dict
│   │   │   ├── actions.py      # ACTION_REGISTRY: action handlers + validation schemas
│   │   │   ├── routes.py       # FastAPI router (dashboard API)
│   │   │   ├── telegram.py     # Telegram command handlers
│   │   │   ├── llm_prompt.py   # System prompt template + state injection
│   │   │   ├── queries.py      # SQL queries as functions
│   │   │   └── nudges.py       # Nudge logic
│   │   ├── life_manager/
│   │   │   ├── config.py
│   │   │   ├── actions.py      # ACTION_REGISTRY: action handlers + validation schemas
│   │   │   ├── routes.py
│   │   │   ├── telegram.py
│   │   │   ├── llm_prompt.py   # System prompt template + state injection
│   │   │   ├── queries.py
│   │   │   └── nudges.py
│   │   └── registry.py         # Discovers & registers all agents
│   ├── telegram_bot/
│   │   ├── bot.py              # Bot setup, command routing, context state
│   │   ├── file_handler.py     # Download, store, and catalog Telegram files
│   │   └── scheduler.py        # Nudge check scheduler (APScheduler)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Shell/           # Sidebar, TopBar, NotificationArea
│   │   │   ├── Finance/         # All Finance panel components
│   │   │   ├── LifeManager/     # All Life Manager panel components
│   │   │   └── Shared/          # PlaceholderPanel, charts, forms
│   │   ├── hooks/               # useApi, useNudges, etc.
│   │   └── styles/
│   │       └── theme.css        # CSS variables, theme
│   ├── package.json
│   └── vite.config.js
├── data/
│   ├── lifeboard.db             # SQLite database (gitignored)
│   └── files/                   # User-uploaded files (gitignored)
│       ├── finance/             # Receipt photos, financial docs
│       └── life_manager/        # Scanned docs, insurance papers, etc.
├── scripts/
│   └── seed.py                  # Sample data generator
├── .env                         # API keys, bot token, chat ID
├── user_config.json             # User preferences (name, currency, etc.)
└── README.md                    # Setup & run instructions
```

---

## ENVIRONMENT VARIABLES (.env)

```
ANTHROPIC_API_KEY=your_anthropic_api_key
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_personal_chat_id
HOST=0.0.0.0
PORT=8000
```

---

## RUNNING THE APP (Mac Mini)

```bash
# One-time setup
cd lifeboard
pip install -r backend/requirements.txt
cd frontend && npm install && npm run build && cd ..

# Run everything (single process recommended for v1)
# The FastAPI app serves the built frontend AND runs the Telegram bot
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000

# Dashboard accessible at http://<mac-mini-ip>:8000
# Telegram bot connects automatically on startup
```

For persistent running on the Mac Mini, use a process manager like `launchd` (macOS native) or `pm2` to keep the server alive after restarts.

---

*This spec is the single source of truth. If something isn't in here, it's not in v1. If there's a conflict between "what would be cool" and "what's in the spec," the spec wins.*
