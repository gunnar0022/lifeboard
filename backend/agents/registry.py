"""
Agent registry — discovers and registers all agents at startup.
Each agent folder must contain a config.py with an AGENT_CONFIG dict.
"""
from importlib import import_module
from pathlib import Path
from backend.config import get_config

AGENTS_DIR = Path(__file__).parent

# All known agents including placeholders
ALL_AGENTS = [
    {"id": "finance", "module": "backend.agents.finance"},
    {"id": "life_manager", "module": "backend.agents.life_manager"},
    {"id": "health_body", "module": "backend.agents.health_body"},
    {"id": "investing", "module": "backend.agents.investing"},
    {"id": "reading_creative", "module": "backend.agents.reading_creative"},
    # Placeholder agents (no module yet)
    {
        "id": "career",
        "name": "Career",
        "accent_color": "#3B82F6",
        "icon": "briefcase",
        "enabled": False,
        "description": "Skills, job market, professional development",
        "v1": False,
    },
    {
        "id": "projects",
        "name": "Projects",
        "accent_color": "#EC4899",
        "icon": "folder-kanban",
        "enabled": False,
        "description": "Active projects, milestones, task tracking",
        "v1": False,
    },
]


def discover_agents() -> list[dict]:
    """Return configs for all agents (active + placeholder)."""
    config = get_config()
    active_ids = config.get("active_agents", [])
    result = []

    for agent_def in ALL_AGENTS:
        if "module" in agent_def:
            # Real agent with a Python module
            try:
                mod = import_module(f"{agent_def['module']}.config")
                agent_config = dict(mod.AGENT_CONFIG)
                agent_config["enabled"] = agent_def["id"] in active_ids
                result.append(agent_config)
            except (ImportError, AttributeError):
                pass
        else:
            # Placeholder agent
            result.append(dict(agent_def))

    return result


def get_agent_routers():
    """Return FastAPI routers for all active real agents."""
    config = get_config()
    active_ids = config.get("active_agents", [])
    routers = []

    for agent_def in ALL_AGENTS:
        if "module" in agent_def and agent_def["id"] in active_ids:
            try:
                mod = import_module(f"{agent_def['module']}.routes")
                routers.append(mod.router)
            except (ImportError, AttributeError):
                pass

    return routers
