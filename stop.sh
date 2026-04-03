#!/bin/bash
cd "$(dirname "$0")"

echo "Stopping LifeBoard..."
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null
echo "LifeBoard stopped."
