# LifeBoard

**A self-hosted personal life management system powered by AI agents.**

LifeBoard combines a Telegram bot interface with a real-time web dashboard to give you a single command center for your finances, schedule, health, investments, writing, and documents. You talk to it through Telegram in natural language; it understands, acts, and keeps a visual dashboard updated in real time.

Built for a single user. No auth, no SaaS complexity — just a personal operating system for your life, running on your own hardware.

---

## How It Works

```
You (Telegram)                        You (Browser)
     |                                      |
     v                                      v
 Telegram Bot                        React Dashboard
     |                                      |
     v                                      |
 LLM Router (Haiku) ──> Agents (Sonnet) ──> Structured Actions
     |                                      |
     v                                      v
         SQLite + Google Calendar + Filesystem
```

Every message flows through a Haiku-powered router that classifies intent and dispatches to the right agent. Agents use Sonnet to parse natural language into structured JSON actions, then execute deterministically against the database. The dashboard reads from the same data and renders everything visually.

The LLM is the parser, not the database. Claude never stores state — it reads what it needs at prompt time, decides what action to take, and hands off execution to deterministic code.

---

## Agents

LifeBoard runs **six specialized agents** and a **headless consultation agent**, each owning its own domain.

### Life Manager

Calendar events synced bidirectionally with **Google Calendar**, bills, tasks, and a unified document vault.

- **Google Calendar sync** — hourly bidirectional sync. Events created via Telegram push to Google; events added on your phone pull into LifeBoard. Japanese holidays included.
- **Custom reminders** — per-event Telegram notifications with flexible timing (before or after the event, for timezone-shifted scenarios like birthdays across date lines)
- **Bills** — amounts, due dates, frequency, autopay tracking
- **Tasks** — prioritized with due dates and categories
- **Shopping list** — add/check/remove items via Telegram or dashboard, duplicate prevention, quantity tracking
- **Unified document search** — all uploaded documents (photos, PDFs) searchable by text, tags, or category with inline viewing

### Health & Body

Nutrition, exercise, mood tracking, body measurements, and health concern management.

- **Meals** — logged with full macros parsed by Claude from natural descriptions, historical data preserved indefinitely
- **Food database** — custom nutrition database for known foods with exact macros per serving; serving multipliers for accuracy; falls back to AI estimation for unknown foods
- **Exercise** — workouts with duration and calorie burn
- **Daily summaries** — automatic end-of-day aggregation with 90-day clickable activity heatmap (click any day to see individual meals and exercises)
- **Health concerns** — trackable issues created during Fleet visits, updated via casual Telegram messages between visits
- **Evening check-in** — scheduled Telegram prompt for mood and energy

### Finance

Accounts, spending, budgets, recurring payments, and cross-currency transfers.

- **Multi-currency** — JPY and USD accounts with live FX conversion
- **Pay-cycle budgeting** — monthly limits tracked against your actual pay cycle, not calendar months
- **Privacy blur** — per-account and totals eye toggle to hide balances from shoulder surfers (defaults to blurred)
- **Net worth** — combined bank accounts + investment portfolio value with currency conversion
- **Transaction history** — browsable month-by-month archive of all transactions with full persistence
- **Cycle summaries** — historical compression generates AI insights while preserving raw data

### Investing

Portfolio tracking across stocks, ETFs, and crypto with multi-currency support.

- **Live prices** — daily yfinance refresh + immediate fetch on new holdings (with history fallback)
- **Multi-currency aggregation** — USD holdings converted to JPY using cached FX rates
- **Portfolio trend** — interactive chart with crosshair hover
- **Asset allocation** — donut chart with category breakdown
- **Manual entry** — add holdings and transactions directly from the dashboard with symbol deduplication
- **Transaction editing** — inline edit and delete on transaction history with automatic cost basis recalculation
- **Projection calculator** — compound interest simulator
- **USD/JPY toggle** — converts all values on the page

### Reading & Creative

A full markdown workspace, reading log, and D&D character sheet system.

- **Creative workspace** — full-screen editor with file tree, multi-tab editing, live markdown preview, auto-save, project tabs, right-click context menus, drag-and-drop file organization
- **Floating snippets** — physics-based ambient text from your writing that drifts across the panel background
- **Reading log** — currently reading, to-read queue, finished books with reflections
- **Idea capture** — Telegram messages routed to project _ideas/ folders
- **Filesystem sync** — manually added folders auto-discovered on workspace load

#### D&D Character Sheets

A full interactive D&D 5e character sheet system with campaign management.

- **Character sheets** — view/edit toggle, autosave, full stat block with calculated modifiers, ability scores, proficiencies, saving throws
- **Combat** — class feature trackers (Rage toggle with glow, Wild Shape toggle, Cunning Action, Fighter Resources, generic fallback for all 13 classes), attack list with auto-calculated bonuses, HP bar with +/- buttons
- **Skills** — grouped by ability, proficiency/expertise cycling, live modifier calculation
- **Spellcasting** — shared spell library (28+ seeded spells), spell slot pip grid, prepared/known zones with drag-and-drop, concentration tracking with swap confirmation, Add Spell modal with search + create
- **Campaigns** — create campaigns with custom colors, campaign-first selection flow, campaign notes system with 5 note types (Characters, Places, Quests, Items, Notes), inline click-to-edit with autosave
- **Theming** — follows app's light/dark toggle. Dark mode: grimoire-at-night. Light mode: warm parchment. All colors via CSS variables
- **Class support** — Barbarian, Rogue, Fighter with full interactive UI; all 13 classes with class feature data storage and generic display
- **Rest system** — short/long rest buttons that intelligently reset HP, spell slots, class feature uses, hit dice, concentration

### Dr. Fleet — Health Consultation

A headless personal health consultant that conducts clinic-style visits via Telegram, powered by **Claude Opus**.

- **Clinic visits** — multi-turn conversations with medical briefing injection
- **Session lock** — all Telegram messages bypass the router during a visit
- **Three-way handshake** — no database writes until you confirm Fleet's action checklist
- **Mid-conversation record retrieval** — Fleet can look up your medical documents during a session
- **Health concerns lifecycle** — creation, logging, resolution, reactivation, compression

### Projects

A portfolio and project management dashboard for technical/coding projects, organized into three visual tiers.

- **Bespoke cards** — each project gets a unique, hand-crafted HTML card with its own layout, colors, and visual identity reflecting the project's personality
- **Three-tier organization** — Working On (active development), Mostly Polished (functional/presentable), Scaffolding (early stage)
- **Context buckets** — structured JSON attached to each project containing summary, tech stack, key decisions, repo paths, and notes. Retrievable via API for Claude Code work sessions
- **GitHub links** — automatic link to each project's repository
- **Claude Code workflow** — projects are added and refreshed through Claude Code, which reads the repo, compiles the context bucket, and generates the card

### System Health

A live dashboard showing the Mac Mini server's vital signs, polled every 5 seconds.

- **System identity** — hostname, macOS version, chip, uptime
- **CPU** — overall and per-core usage with color-coded cells
- **Memory** — used/available/swap with usage bar
- **Disk** — APFS container-level usage (accurate on Apple Silicon), LifeBoard DB size
- **Network** — real-time upload/download throughput rates
- **Top processes** — top 10 by CPU and by memory
- **Services** — FastAPI process status, SQLite DB size, Docker container status

### Document Classifier

A Sonnet-powered system that processes all uploaded photos and PDFs.

- **Sonnet vision** — reads text from photos of IDs, receipts, medical documents
- **PDF text extraction** — pymupdf extracts selectable text; scanned PDFs rendered as images for vision
- **Structured extraction** — pulls exact names, ID numbers, dates, amounts, addresses
- **Auto-classification** — assigns tags from a 24-tag vocabulary and categorizes as finance/health/investing/life
- **Telegram CRUD** — ask questions about documents, edit metadata, or delete via natural language

---

## Architecture

### Backend — FastAPI + SQLite

```
backend/
  main.py              # App entry, lifespan, Google OAuth, document API
  database.py          # Schema definitions, init_db()
  config.py            # user_config.json loader
  llm_client.py        # Anthropic API (Sonnet default, Haiku for routing)
  action_executor.py   # Validate-execute-respond with hallucination detection
  documents.py         # Unified document classifier + CRUD
  system_health.py     # Live system metrics (CPU, memory, disk, network, processes)
  projects.py          # Projects tab CRUD API with context buckets
  google_calendar.py   # OAuth, bidirectional sync, reminder scheduler
  seed.py              # Demo data (manual CLI, non-destructive)
  agents/
    registry.py        # Agent auto-discovery
    finance/           # Budget, accounts, transactions
    life_manager/      # Calendar, bills, tasks (Google Calendar integrated)
    health_body/       # Nutrition, exercise, mood, concerns
    investing/         # Portfolio, holdings, snapshots
    reading_creative/  # Workspace, books, idea capture
    fleet/             # Dr. Fleet consultation (Opus)
  telegram_bot/
    bot.py             # Bot lifecycle, handlers
    router.py          # LLM classifier, document agent, multi-agent dispatch
```

### Frontend — React + Vite

```
frontend/src/
  App.jsx              # Panel routing
  hooks/useApi.js      # Shared fetch hook
  styles/theme.css     # Light + dark mode themes
  components/
    Shell/             # Sidebar, TopBar (dark mode toggle), HomePanel
    Setup/             # 12-step guided setup wizard
    LifeManager/       # TimelineStrip, BillsTracker, TaskBoard, ShoppingList, DocumentSearch
    Health/            # Heatmap (clickable), RecentDetail, WeightTrend, FoodDatabase, ConcernsTracker
    Finance/           # AccountsStrip (blur toggle), CycleOverview, BudgetDonut, TransactionHistory
    Investing/         # PortfolioTrend, AllocationChart, HoldingsTable, TransactionHistory
    ReadingCreative/   # FloatingSnippets (physics), CreativeWorkspace, ReadingLog
      DnD/             # Character sheets, campaigns, spell library, campaign notes
    SystemHealth/      # Live server metrics dashboard
    Projects/          # Project cards with tiered layout and context buckets
```

### Telegram Bot — LLM-Powered Router

The router uses **Haiku** with 8 exchanges of conversation history. It supports single-agent routing, multi-agent fan-out, explicit agent delegation, context-enriched summaries, document retrieval, Fleet session lock, and hallucination detection with auto-retry.

### Background Schedulers

| Agent | Schedule | Task |
|-------|----------|------|
| Google Calendar | Hourly | Bidirectional event sync |
| Google Calendar | Every minute | Send due reminders via Telegram |
| Finance | Monthly (24th) | Generate cycle summaries with AI insights |
| Finance | Monthly (1st) | Calculate and apply account interest |
| Health & Body | Daily (configurable) | Evening check-in via Telegram |
| Health & Body | Daily (2 AM) | Aggregate meals/exercises into daily summary |
| Investing | Daily (6 PM) | Refresh prices via yfinance, store snapshot |
| Fleet | Daily (4 AM) | Compress resolved concern logs > 90 days |
| Fleet | On startup | Recover orphaned sessions |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Framer Motion, Recharts, Lucide Icons |
| Backend | Python, FastAPI, uvicorn, aiosqlite |
| Database | SQLite (WAL mode, foreign keys, raw SQL) |
| AI | Anthropic Claude — Opus (Fleet), Sonnet 4.5 (agents + classifier), Haiku 4.5 (routing) |
| Telegram | python-telegram-bot v21 (async) |
| Calendar | Google Calendar API with OAuth 2.0 |
| Market Data | yfinance, frankfurter.app (FX rates) |
| System Monitoring | psutil (CPU, memory, disk, network, processes) |
| PDF Processing | pymupdf (text extraction + image rendering) |
| Process Manager | PM2 (production) |

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Telegram bot token ([@BotFather](https://t.me/botfather))
- Anthropic API key
- Google Cloud project with Calendar API enabled

### Installation

```bash
git clone https://github.com/gunnar0022/lifeboard.git
cd lifeboard
pip install -r backend/requirements.txt
cd frontend && npm install && npm run build && cd ..
```

### Configuration

On first launch, a **12-step setup wizard** guides you through all configuration — API keys, Telegram bot, Google Calendar, health profile, finance, and more. No manual file editing needed.

Alternatively, create `.env` in the project root:

```
ANTHROPIC_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Run

```bash
# Development
uvicorn backend.main:app --host 0.0.0.0 --port 8000
cd frontend && npm run dev  # separate terminal

# Windows one-click
start.bat

# Production
cd frontend && npm run build && cd ..
pm2 start ecosystem.config.js
```

### Google Calendar

After entering Google credentials in the setup wizard and restarting, a **"Connect Google Calendar"** banner appears on the Life Manager panel. Click it to authorize via Google's consent screen. Approve once — sync runs automatically (hourly + reminders every minute).

---

## License

Personal project. Not currently licensed for redistribution.
