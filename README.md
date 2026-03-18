# LifeBoard

**A self-hosted personal life management system powered by AI agents.**

LifeBoard combines a Telegram bot interface with a real-time web dashboard to give you a single command center for your finances, schedule, health, and investments. You talk to it through Telegram in natural language; it understands, acts, and keeps a visual dashboard updated in real time.

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
 LLM Router ──> Claude (Sonnet) ──> Structured Actions
     |                                      |
     v                                      v
 Agent Layer  ────────────────────>  FastAPI Backend
     |                                      |
     v                                      v
              SQLite (single file)
```

Every message you send to the Telegram bot flows through Claude, which parses your intent into structured JSON actions. The appropriate agent validates and executes those actions against the database. The web dashboard reads from the same database and renders everything visually — portfolio charts, budget breakdowns, health heatmaps, calendar timelines.

The LLM is the parser, not the database. Claude never stores state — it reads what it needs from the database at prompt time, decides what action to take, and hands off execution to deterministic code.

---

## Agents

LifeBoard is built around **four specialized agents**, each owning its own domain, database tables, and Telegram integration. Three more are planned as placeholders.

### Finance Agent

Tracks accounts, spending, income, budgets, recurring payments, and cross-currency transfers.

- **Accounts** — bank accounts, cash wallets, transfer services, each with their own currency and running balance
- **Transactions** — income and expenses categorized automatically by Claude (Food & Dining, Transportation, Subscriptions, etc.)
- **Budgets** — monthly per-category limits with real-time tracking against a pay-cycle-based month (not calendar month)
- **Recurring items** — autopay vs. manual distinction; autopay items auto-log, manual items trigger reminders
- **Transfers** — money movement between accounts (with FX conversion) tracked separately from spending
- **Cycle summaries** — daily compression of historical data into aggregated summaries to keep the database lean
- **Receipt scanning** — send a photo of a receipt via Telegram; Claude extracts the amount, category, and vendor

Dashboard panel: account balances grouped by currency, cycle overview with income/expense bars, budget donut chart, spending trend, transaction list with quick-add form.

### Life Manager Agent

Calendar events, bills, tasks, and document tracking — the administrative backbone of daily life.

- **Events** — appointments, deadlines, reminders, and social events with recurrence rules
- **Bills** — amounts, due dates, frequency (monthly/quarterly/yearly), autopay flag, paid/unpaid status
- **Tasks** — prioritized (high/medium/low) with due dates and categories
- **Documents** — insurance policies, leases, prescriptions, and legal docs with expiry tracking
- **File attachments** — scan and store documents via Telegram photo messages

Dashboard panel: 14-day scrollable timeline with color-coded dots, bill tracker, task board, document registry with expiry warnings.

### Health & Body Agent

Nutrition, exercise, mood tracking, body measurements, and medical record management.

- **Meals** — logged with full macros (calories, protein, carbs, fat) parsed by Claude from natural descriptions
- **Exercise** — workouts with duration and estimated calorie burn
- **Daily summaries** — automatic end-of-day aggregation of meals, exercise, mood (1-5), and energy (1-5)
- **Body measurements** — weight tracking with a 90-day heatmap visualization
- **Medical records** — checkups, vaccinations, prescriptions, lab results, imaging, dental, and vision records
- **Evening check-in** — scheduled Telegram prompt asking about your day's mood and energy

Dashboard panel: calorie/macro breakdown, exercise log, mood/energy trends, weight heatmap, medical document registry.

### Investing Agent

Portfolio tracking across stocks, ETFs, and crypto with multi-currency support.

- **Holdings** — securities tracked by symbol, asset class, currency, share count, and cost basis
- **Transactions** — buys, sells, dividends, and splits with full audit trail
- **Portfolio snapshots** — daily snapshots recording total value and asset-class breakdown (never compressed)
- **Multi-currency aggregation** — USD holdings automatically converted to JPY using cached live FX rates
- **Accounts** — brokerage, retirement, and crypto accounts linked to holdings
- **Projection calculator** — frontend compound-interest simulator with adjustable parameters

Dashboard panel: portfolio value trend chart (with crosshair hover), asset allocation donut, expandable holdings table grouped by asset class, future projection calculator. USD/JPY currency toggle converts all values on the page.

### Planned Agents

Three agents are registered as placeholders and appear in the sidebar with a "SOON" badge:

- **Career** — skills tracking, job market monitoring, professional development
- **Projects** — project management with milestones and task tracking
- **Reading & Creative** — reading lists, research notes, creative references

---

## Architecture

### Backend — FastAPI + SQLite

The backend is a single FastAPI application serving both the REST API and the built frontend.

```
backend/
  main.py              # App entry, lifespan events, nudge aggregation, SPA serving
  database.py          # Schema definitions, init_db(), WAL mode, foreign keys
  config.py            # user_config.json loader with file-change detection
  llm_client.py        # Anthropic API wrapper (Claude claude-sonnet-4-5-20250514)
  action_executor.py   # Validate-execute-respond loop for agent actions
  seed.py              # Demo data generator (--clear --config flags)
  agents/
    registry.py        # Auto-discovery of agent config.py files
    finance/           # config, actions, routes, queries, telegram, llm_prompt, nudges
    life_manager/      # config, actions, routes, queries, telegram, llm_prompt, nudges
    health_body/       # config, actions, routes, queries, telegram, llm_prompt, nudges, scheduler
    investing/         # config, actions, routes, queries, telegram, llm_prompt, nudges, scheduler
  telegram_bot/
    bot.py             # Bot lifecycle, command handlers, authorization
    router.py          # LLM-powered message classification and multi-agent dispatch
```

**Agent registration** is declarative. Each agent folder contains a `config.py` with an `AGENT_CONFIG` dict specifying its ID, name, icon, accent color, and version status. The registry auto-discovers these at startup and only mounts routers for agents listed in the user's `active_agents` config.

**Database** is a single SQLite file (`data/lifeboard.db`) with WAL journaling and foreign key enforcement. All currency amounts are stored as integers in the smallest unit (1 for JPY, 100 for USD) to avoid floating-point errors. Every query is raw SQL via `aiosqlite` — no ORM.

**Lifespan events** handle startup and shutdown of the Telegram bot, background schedulers (finance cycle compression, health evening check-ins, investing price refresh), and database initialization.

**Nudges** are proactive alerts aggregated from all agents on each API request. Each agent defines a `check_nudges()` function that returns alerts (budget exceeded), warnings (bill due in 3 days), or info items (document expiring soon). The frontend displays these as dismissible banners in the top bar.

### Frontend — React + Vite

```
frontend/src/
  App.jsx              # Panel routing, sidebar state, AnimatePresence transitions
  hooks/useApi.js      # Shared data-fetching hook (data, loading, error, refetch)
  components/
    Shell/             # Sidebar, TopBar, HomePanel, PulseCard
    Finance/           # AccountsStrip, CycleOverview, SpendingChart, BudgetDonut, ...
    LifeManager/       # Timeline, TaskBoard, BillTracker, DocumentRegistry, ...
    Health/            # CalorieBar, ExerciseLog, WeightHeatmap, MedicalRegistry, ...
    Investing/         # PortfolioTrend, AllocationChart, HoldingsTable, ProjectionCalc, ...
    Shared/            # PlaceholderPanel for upcoming agents
```

The SPA renders a sidebar with all agents, a top bar with date/time and nudge notifications, and a main content area that swaps between panels. Panels use staggered Framer Motion animations for entrance/exit. Charts are built with Recharts. Icons come from Lucide.

The **Home panel** shows a pulse card for each active agent — three key metrics fetched from each agent's `/pulse` endpoint. Clicking a card navigates to that agent's full panel.

**No state management library.** Panel-level `useState` and the `useApi` hook handle everything. The hook returns `{ data, loading, error, refetch }` where `data` starts `null` and `loading` starts `true`.

### Telegram Bot — LLM-Powered Router

The Telegram bot is the primary input surface. It runs as an async background task inside the FastAPI process.

**Message routing** uses Claude as a lightweight classifier. Every incoming message is sent to a small routing prompt that returns JSON indicating which agent(s) should handle it. This enables:

- **Single-agent routing** — "I spent 3000 yen on lunch" goes to Finance
- **Multi-agent fan-out** — "I spent 1000 on ramen for lunch" goes to both Finance (log transaction) and Health (log meal), with responses consolidated into a single reply
- **Ambiguous fallback** — if the router can't classify, it presents an inline keyboard letting you pick the agent

Each agent implements `process_message()` and `process_photo()` handlers. These build a dynamic system prompt injecting the agent's current state (account balances, recent transactions, today's meals, portfolio holdings, etc.), send it to Claude with the user's message, and execute whatever structured action Claude returns.

**Context hints** give the router a 2-minute memory window — if you just talked to Finance, a follow-up "add another one" routes back to Finance without needing explicit context.

### Background Schedulers

Three agents run background tasks:

| Agent | Schedule | Task |
|-------|----------|------|
| Finance | Monthly (24th) | Compress old transactions into cycle summaries |
| Finance | Monthly (1st) | Calculate and apply account interest |
| Health & Body | Daily (configurable) | Send evening check-in prompt via Telegram |
| Health & Body | Daily (2 AM) | Compress yesterday's meals/exercises into daily summary |
| Investing | Daily (6 PM) | Refresh holding prices via yfinance, store portfolio snapshot |

Schedulers start and stop cleanly with the FastAPI lifespan. Each uses `asyncio` background tasks with timezone-aware scheduling.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Framer Motion, Recharts, Lucide Icons |
| Backend | Python, FastAPI, uvicorn, aiosqlite |
| Database | SQLite (WAL mode, foreign keys, raw SQL) |
| AI | Anthropic Claude (claude-sonnet-4-5-20250514) via `anthropic` SDK |
| Telegram | python-telegram-bot v21 (async) |
| Market Data | yfinance, frankfurter.app (FX rates) |
| Process Manager | PM2 (production) |

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Telegram bot token (from [@BotFather](https://t.me/botfather))
- An Anthropic API key

### Installation

```bash
git clone https://github.com/gunnar0022/lifeboard.git
cd lifeboard

# Backend
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install && npm run build && cd ..
```

### Configuration

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_personal_chat_id
```

Edit `user_config.json` to set your preferences:

```json
{
  "user_name": "Your Name",
  "display_name": "You",
  "timezone": "America/New_York",
  "primary_currency": "USD",
  "secondary_currency": "JPY",
  "pay_cycle_day": 1,
  "active_agents": ["finance", "life_manager", "health_body", "investing"],
  "locale": "en"
}
```

### Seed Demo Data (Optional)

```bash
python -m backend.seed --clear --config
```

This populates the database with sample accounts, transactions, holdings, health entries, and 90 days of historical data so the dashboard has something to display immediately.

### Run

**Development** (two terminals):

```bash
# Terminal 1 — Backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend (hot reload)
cd frontend && npm run dev
```

**Production** (PM2):

```bash
# Build frontend first
cd frontend && npm run build && cd ..

# Start with PM2
pm2 start ecosystem.config.js
```

The dashboard is accessible at `http://localhost:8000`. The Telegram bot connects automatically on backend startup.

---

## Project Structure

```
lifeboard/
├── backend/
│   ├── main.py                 # FastAPI app, lifespan, nudges, SPA serving
│   ├── database.py             # SQLite schema and initialization
│   ├── config.py               # User config loader + currency symbols
│   ├── llm_client.py           # Claude API wrapper
│   ├── action_executor.py      # Action validation and execution
│   ├── seed.py                 # Demo data seeder
│   ├── agents/
│   │   ├── registry.py         # Agent auto-discovery
│   │   ├── finance/            # Budget, accounts, transactions, transfers
│   │   ├── life_manager/       # Calendar, bills, tasks, documents
│   │   ├── health_body/        # Nutrition, exercise, mood, medical
│   │   └── investing/          # Portfolio, holdings, snapshots
│   └── telegram_bot/
│       ├── bot.py              # Bot lifecycle and handlers
│       └── router.py           # LLM message classifier + multi-agent dispatch
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component + panel routing
│   │   ├── hooks/useApi.js     # Shared fetch hook
│   │   └── components/
│   │       ├── Shell/          # Sidebar, TopBar, HomePanel
│   │       ├── Finance/        # Finance panel components
│   │       ├── LifeManager/    # Life Manager panel components
│   │       ├── Health/         # Health panel components
│   │       ├── Investing/      # Investing panel components
│   │       └── Shared/         # Placeholder panel
│   └── package.json
├── data/
│   ├── lifeboard.db            # SQLite database
│   └── files/                  # Uploaded files (receipts, documents)
├── user_config.json            # User preferences
├── ecosystem.config.js         # PM2 production config
├── .env                        # API keys (not committed)
└── README.md
```

Each agent follows an identical internal structure:

```
agents/{agent_name}/
  config.py       # Agent metadata (name, icon, color, version)
  queries.py      # Raw SQL query functions
  routes.py       # FastAPI endpoints
  actions.py      # ACTION_REGISTRY mapping action names to handlers
  llm_prompt.py   # Dynamic system prompt builder (injects current state)
  telegram.py     # process_message() and process_photo() handlers
  nudges.py       # check_nudges() for proactive alerts
  scheduler.py    # Background tasks (optional, not all agents have one)
```

---

## License

Personal project. Not currently licensed for redistribution.
