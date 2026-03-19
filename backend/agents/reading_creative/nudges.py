"""
Reading & Creative agent — nudge checks.
Minimal nudges for creative flow, not productivity guilt.
"""
import os
from datetime import datetime, timedelta
from pathlib import Path
from backend.agents.reading_creative.queries import CREATIVE_ROOT, get_projects


async def check_nudges() -> list[dict]:
    nudges = []
    projects = await get_projects()

    if not projects:
        return nudges

    # Check for recent ideas (last 7 days)
    week_ago = datetime.now() - timedelta(days=7)
    for p in projects:
        ideas_dir = CREATIVE_ROOT / p["slug"] / "_ideas"
        if not ideas_dir.exists():
            continue
        recent_ideas = [
            f for f in ideas_dir.iterdir()
            if f.is_file() and datetime.fromtimestamp(f.stat().st_mtime) > week_ago
        ]
        if recent_ideas:
            nudges.append({
                "text": f"{len(recent_ideas)} new idea(s) in {p['name']} this week",
                "severity": "info",
                "agent": "reading_creative",
            })

    # Check if no writing activity in 7 days (excluding _ideas)
    any_recent_writing = False
    for p in projects:
        project_dir = CREATIVE_ROOT / p["slug"]
        if not project_dir.exists():
            continue
        for root, dirs, files in os.walk(project_dir):
            if "_ideas" in Path(root).parts:
                continue
            for f in files:
                if f.endswith(".md"):
                    fpath = Path(root) / f
                    if datetime.fromtimestamp(fpath.stat().st_mtime) > week_ago:
                        any_recent_writing = True
                        break
            if any_recent_writing:
                break
        if any_recent_writing:
            break

    if projects and not any_recent_writing:
        nudges.append({
            "text": "You haven't written anything in over a week",
            "severity": "info",
            "agent": "reading_creative",
        })

    return nudges
