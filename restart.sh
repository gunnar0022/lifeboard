#!/bin/bash
cd "$(dirname "$0")"

echo "Restarting LifeBoard..."
bash stop.sh
sleep 1
bash start.sh
