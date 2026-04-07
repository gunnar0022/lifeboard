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

## Dashboard Navigation

The dashboard uses a two-level navigation system:

- **Sidebar** (left) — primary navigation between major sections
- **Sub-tab bar** (top) — secondary navigation within each section

| Sidebar | Sub-tabs | Description |
|---------|----------|-------------|
| **Organizer** | Calendar · Tasks & Bills · Documents | Schedule, to-dos, document vault |
| **Health & Fitness** | Health · Fitness | Nutrition, exercise, mood, weight |
| **Money** | Finance · Investing | Accounts, budgets, portfolio |
| **Creative** | Workspace · Reading · D&D | Writing, books, character sheets |
| **Projects** | — | Technical project portfolio |
| **System** | Health | Server monitoring |

Sub-tabs can be individually toggled on/off in Settings. Disabling a parent hides the entire sidebar item.

---

## Features by Section

### Organizer

Calendar, tasks, bills, shopping, and document management — split across three sub-tabs.

- **Google Calendar sync** — hourly bidirectional sync with Japanese holidays
- **Weather strip** — 7-day forecast with clickable today detail (Open-Meteo, configurable location)
- **Inline event creation** — add events directly from the Calendar tab
- **Bills** — inline add form, due date tracking, autopay badges
- **Tasks** — inline add, priority levels, due dates
- **Shopping list** — add/check/remove with duplicate prevention
- **Document vault** — all uploaded files searchable by text, tags, or category

### Health & Fitness

Nutrition and exercise tracking split into Health and Fitness sub-tabs.

- **Meals** — logged via Telegram with AI-estimated macros, or manually from the dashboard
- **Food database** — custom foods with exact macros; serving multipliers; AI fallback for unknown foods
- **Manual meal entry** — multi-item cart from food database, or freeform macro input
- **Activity heatmap** — 90-day clickable grid with 30-block RGB color ramp (Red→Yellow→Green→Cyan→Blue). Exercise intensity modulates brightness (none=dim, light=medium, heavy=vivid)
- **Exercise tagging** — light/heavy classification via Telegram agent
- **Meal deletion** — delete from heatmap detail modal or recent activity section
- **Weight trend** — line chart with direction indicator
- **Health concerns** — created during Fleet visits, updated via casual Telegram messages
- **Evening check-in** — scheduled Telegram prompt for mood and energy

### Money

Finance and Investing under one sidebar item with independent sub-tabs.

#### Finance
- **Multi-currency** — JPY and USD accounts with live FX conversion (daily from frankfurter.app, cached in DB)
- **Pay-cycle budgeting** — monthly limits tracked against actual pay cycle
- **Budget management** — add, edit, delete budgets directly from dashboard
- **Privacy blur** — per-account and totals eye toggle (defaults to blurred)
- **Net worth** — combined bank accounts + investment portfolio with currency conversion
- **Transaction drill-down** — click any account card or category to see filtered transaction history with month navigation
- **Transfer mode** — quick-add form supports account-to-account transfers
- **Transaction history** — browsable month-by-month archive with full persistence
- **Cycle summaries** — historical compression generates AI insights while preserving raw data

#### Investing
- **Live prices** — three daily yfinance checks (5am, noon, 6pm) with averaged daily snapshots
- **FX fallback** — if live rate API fails, uses cached exchange rate instead of 1:1
- **Portfolio trend** — interactive chart with crosshair hover
- **Asset allocation** — donut chart with category breakdown
- **Manual entry** — add holdings and transactions from dashboard with symbol deduplication
- **Transaction editing** — inline edit/delete with automatic cost basis recalculation
- **Projection calculator** — compound interest simulator
- **USD/JPY toggle** — converts all values on the page

### Creative

Writing workspace, reading log, and D&D — each on its own sub-tab.

- **Creative workspace** — full-screen editor with file tree, multi-tab editing, live markdown preview, auto-save, project tabs, drag-and-drop file organization
- **Floating snippets** — physics-based ambient text from your writing
- **Reading log** — currently reading, to-read queue, finished books with reflections
- **D&D character sheets** — full 5e character management with campaigns, spell library, combat tracking

### Projects

Technical project portfolio with bespoke visual cards and context buckets.

- **Bespoke cards** — each project gets a unique hand-crafted HTML card reflecting the project's personality
- **Three-tier organization** — Working On, Mostly Polished, Scaffolding
- **Drag-and-drop** — move projects between tiers by dragging
- **Project notes** — clickable dropdown with auto-saving textarea; Telegram agent appends timestamped notes
- **Context buckets** — structured JSON with summary, tech stack, key decisions, repo paths (retrievable via API for Claude Code sessions)
- **GitHub links** — automatic link to each project's repository

### System

Server monitoring and diagnostics.

- **System identity** — hostname, macOS version, chip, uptime
- **CPU/Memory/Disk** — live gauges with APFS-accurate disk usage on Apple Silicon
- **Network** — real-time upload/download throughput
- **Top processes** — by CPU and by memory
- **Services** — FastAPI status, SQLite DB size, Docker container status

### Dr. Fleet — Health Consultation

A headless personal health consultant powered by **Claude Opus**, conducted via Telegram.

- **Clinic visits** — multi-turn conversations with medical briefing injection
- **Session lock** — all messages bypass the router during a visit
- **Health concerns lifecycle** — creation, logging, resolution, reactivation, compression

### Morning Briefing

Automated daily Telegram message at 7:00 AM with weather, calendar, alerts, and yesterday's health snapshot. Gracefully degrades if any data source fails.

---

## Architecture

### Backend — FastAPI + SQLite

```
backend/
  main.py              # App entry, lifespan, Google OAuth, document API
  database.py          # Schema definitions, init_db()
  config.py            # user_config.json loader, timezone-aware get_today()/get_now()
  llm_client.py        # Anthropic API (Sonnet default, Haiku for routing)
  action_executor.py   # Validate-execute-respond with hallucination detection
  documents.py         # Unified document classifier + CRUD
  system_health.py     # Live system metrics + weather API
  projects.py          # Projects tab CRUD API with context buckets and notes
  schedulers.py        # System schedulers (FX rates, weather, morning briefing)
  google_calendar.py   # OAuth, bidirectional sync, reminder scheduler
  agents/
    registry.py        # Agent auto-discovery
    finance/           # Budget, accounts, transactions
    life_manager/      # Calendar, bills, tasks (Google Calendar integrated)
    health_body/       # Nutrition, exercise, mood, concerns, food database
    investing/         # Portfolio, holdings, snapshots (3x daily price refresh)
    reading_creative/  # Workspace, books, project notes
    fleet/             # Dr. Fleet consultation (Opus)
  telegram_bot/
    bot.py             # Bot lifecycle, handlers
    router.py          # LLM classifier, document agent, multi-agent dispatch
```

### Frontend — React + Vite

```
frontend/src/
  App.jsx              # Two-level panel routing (sidebar + sub-tabs)
  config/navigation.js # NAV_CONFIG — single source of truth for tab structure
  hooks/useApi.js      # Shared fetch hook with WebSocket auto-refresh
  styles/theme.css     # Light + dark mode themes
  components/
    Shell/             # Sidebar, TopBar, SubTabBar, HomePanel
    Setup/             # 12-step guided setup wizard
    Settings/          # Hierarchical panel toggles, timezone, theme
    Organizer/         # Calendar, Tasks & Bills, Documents, WeatherStrip
    HealthFitness/     # Health tab, Fitness tab (split from old Health panel)
    Health/            # Heatmap, RecentDetail, WeightTrend, FoodDatabase, MealEntry, ConcernsTracker
    Finance/           # AccountsStrip, CycleOverview, BudgetBars, TransactionFilter, TransactionHistory
    Investing/         # PortfolioTrend, AllocationChart, HoldingsTable, TransactionHistory
    Creative/          # WorkspaceTab, Reading, D&D (split from old ReadingCreative panel)
    ReadingCreative/   # CreativeWorkspace, FloatingSnippets, ReadingLog
      DnD/             # Character sheets, campaigns, spell library
    SystemHealth/      # Live server metrics dashboard
    Projects/          # Project cards with tiered layout, notes, drag-and-drop
```

### Background Schedulers

| Scheduler | Schedule | Task |
|-----------|----------|------|
| FX Rate | Daily (6:00 AM) | Pull JPY/USD rate from frankfurter.app |
| Weather (daily) | Daily (6:00 AM) | Refresh 7-day forecast from Open-Meteo |
| Weather (hourly) | Every hour | Refresh today's hourly forecast |
| Morning Briefing | Daily (7:00 AM) | Compose and send Telegram summary |
| Google Calendar | Hourly | Bidirectional event sync |
| Google Calendar | Every minute | Send due reminders via Telegram |
| Finance | Monthly (24th) | Generate cycle summaries with AI insights |
| Finance | Monthly (1st) | Calculate and apply account interest |
| Health & Body | Daily (configurable) | Evening check-in via Telegram |
| Health & Body | Daily (3 AM) | Aggregate meals/exercises into daily summary |
| Investing | 3x daily (5 AM, noon, 6 PM) | Refresh prices via yfinance, store averaged snapshot |
| Fleet | Daily (4 AM) | Compress resolved concern logs > 90 days |

All schedulers use the user's configured timezone via `get_today()` / `get_now()` from `config.py`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Framer Motion, Recharts, Lucide Icons |
| Backend | Python, FastAPI, uvicorn, aiosqlite |
| Database | SQLite (WAL mode, raw SQL, no ORM) |
| AI | Anthropic Claude — Opus (Fleet), Sonnet 4.5 (agents + classifier), Haiku 4.5 (routing) |
| Telegram | python-telegram-bot v21 (async) |
| Calendar | Google Calendar API with OAuth 2.0 |
| Market Data | yfinance, frankfurter.app (FX rates) |
| Weather | Open-Meteo (free, no API key) |
| System Monitoring | psutil |
| PDF Processing | pymupdf |
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

# Production
cd frontend && npm run build && cd ..
pm2 start ecosystem.config.js
```

### Google Calendar

After entering Google credentials in the setup wizard and restarting, a **"Connect Google Calendar"** banner appears on the Organizer > Calendar tab. Click it to authorize via Google's consent screen. Approve once — sync runs automatically.

---

## License

Personal project. Not currently licensed for redistribution.
