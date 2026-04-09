#!/bin/bash
# Garmin ingest runner — called by launchd every 2 hours
cd "$(dirname "$0")/.."
source .env 2>/dev/null

# Use the correct Python
PYTHON="/opt/homebrew/bin/python3.14"
if [ ! -f "$PYTHON" ]; then
    PYTHON="python3"
fi

export GARMIN_EMAIL GARMIN_PASSWORD TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID

$PYTHON -m backend.garmin.ingest
