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
- **Unified document search** — all uploaded documents (photos, PDFs) searchable by text, tags, or category with inline viewing

### Health & Body

Nutrition, exercise, mood tracking, body measurements, and health concern management.

- **Meals** — logged with full macros parsed by Claude from natural descriptions
- **Exercise** — workouts with duration and calorie burn
- **Daily summaries** — automatic end-of-day aggregation with 90-day activity heatmap
- **Health concerns** — trackable issues created during Fleet visits, updated via casual Telegram messages between visits
- **Evening check-in** — scheduled Telegram prompt for mood and energy

### Finance

Accounts, spending, budgets, recurring payments, and cross-currency transfers.

- **Multi-currency** — JPY and USD accounts with live FX conversion
- **Pay-cycle budgeting** — monthly limits tracked against your actual pay cycle, not calendar months
- **Privacy blur** — per-account and totals eye toggle to hide balances from shoulder surfers
- **Cycle summaries** — historical compression keeps the database lean

### Investing

Portfolio tracking across stocks, ETFs, and crypto with multi-currency support.

- **Live prices** — daily yfinance refresh + immediate fetch on new holdings
- **Multi-currency aggregation** — USD holdings converted to JPY using cached FX rates
- **Portfolio trend** — interactive chart with crosshair hover
- **Asset allocation** — donut chart with category breakdown
- **Projection calculator** — compound interest simulator
- **USD/JPY toggle** — converts all values on the page

### Reading & Creative

A full markdown workspace with a reading log.

- **Creative workspace** — full-screen editor with file tree, multi-tab editing, live markdown preview, auto-save, project tabs, right-click context menus, drag-and-drop file organization
- **Floating snippets** — physics-based ambient text from your writing that drifts across the panel background
- **Reading log** — currently reading, to-read queue, finished books with reflections
- **Idea capture** — Telegram messages routed to project _ideas/ folders
- **Filesystem sync** — manually added folders auto-discovered on workspace load

### Dr. Fleet — Health Consultation

A headless personal health consultant that conducts clinic-style visits via Telegram, powered by **Claude Opus**.

- **Clinic visits** — multi-turn conversations with medical briefing injection
- **Session lock** — all Telegram messages bypass the router during a visit
- **Three-way handshake** — no database writes until you confirm Fleet's action checklist
- **Mid-conversation record retrieval** — Fleet can look up your medical documents during a session
- **Health concerns lifecycle** — creation, logging, resolution, reactivation, compression

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
    LifeManager/       # TimelineStrip, BillsTracker, TaskBoard, DocumentSearch
    Health/            # Heatmap, RecentDetail, WeightTrend, ConcernsTracker
    Finance/           # AccountsStrip (blur toggle), CycleOverview, BudgetDonut
    Investing/         # PortfolioTrend, AllocationChart, HoldingsTable
    ReadingCreative/   # FloatingSnippets (physics), CreativeWorkspace, ReadingLog
```

### Telegram Bot — LLM-Powered Router

The router uses **Haiku** with 8 exchanges of conversation history. It supports single-agent routing, multi-agent fan-out, explicit agent delegation, context-enriched summaries, document retrieval, Fleet session lock, and hallucination detection with auto-retry.

### Background Schedulers

| Agent | Schedule | Task |
|-------|----------|------|
| Google Calendar | Hourly | Bidirectional event sync |
| Google Calendar | Every minute | Send due reminders via Telegram |
| Finance | Monthly (24th) | Compress transactions into cycle summaries |
| Finance | Monthly (1st) | Calculate and apply account interest |
| Health & Body | Daily (configurable) | Evening check-in via Telegram |
| Health & Body | Daily (2 AM) | Compress meals/exercises into daily summary |
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

Create `.env` in the project root:

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

Visit `http://localhost:8000/api/google/auth` after starting the backend. Approve once — sync runs automatically.

---

## License

Personal project. Not currently licensed for redistribution.
