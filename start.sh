#!/bin/bash

# LifeBoard Launcher (macOS / Linux)
cd "$(dirname "$0")"

echo ""
echo "  ========================================"
echo "   LifeBoard - Starting up..."
echo "  ========================================"
echo ""

# ── Check ports and kill anything occupying them ──
echo "[1/4] Clearing ports 8000 and 5173..."

lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null

echo "       Ports clear."
echo ""

# ── Find a Python >= 3.10 (required for type union syntax) ──
PYTHON=""
for candidate in python3.14 python3.13 python3.12 python3.11 python3.10 python3; do
    if command -v "$candidate" &>/dev/null; then
        ver=$("$candidate" -c "import sys; print(sys.version_info >= (3, 10))" 2>/dev/null)
        if [ "$ver" = "True" ]; then
            PYTHON="$candidate"
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    echo "       ERROR: Python 3.10+ is required but not found."
    echo "       Install it via: brew install python@3.12"
    exit 1
fi

echo "       Using $PYTHON ($($PYTHON --version))"

# ── Check dependencies ──
echo "[2/4] Checking dependencies..."

if ! $PYTHON -m uvicorn --version &>/dev/null; then
    echo "       ERROR: uvicorn not found."
    echo "       Run: $PYTHON -m pip install -r backend/requirements.txt"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "       Installing frontend dependencies..."
    cd frontend && npm install && cd ..
else
    echo "       Frontend deps OK."
fi

echo ""

# ── Start backend ──
echo "[3/4] Starting backend on port 8000..."
$PYTHON -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Give backend time to initialize (DB + Telegram + schedulers)
sleep 5

# ── Start frontend ──
echo "[4/4] Starting frontend on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
sleep 3

echo ""
echo "  ========================================"
echo "   LifeBoard is running!"
echo ""
echo "   Dashboard:  http://localhost:5173"
echo "   API:        http://localhost:8000"
echo ""
echo "   Press Ctrl+C to stop both servers."
echo "  ========================================"
echo ""

# Open the dashboard in the default browser
if command -v open &>/dev/null; then
    open http://localhost:5173
elif command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:5173
fi

# Wait for Ctrl+C, then clean up both processes
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
