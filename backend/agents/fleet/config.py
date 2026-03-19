"""
Dr. Fleet — headless consultation agent.
NOT registered in the sidebar or dashboard agent list.
Exists purely as a Telegram session-based agent.
"""

AGENT_CONFIG = {
    "id": "fleet",
    "name": "Dr. Fleet",
    "accent_color": "#7C5CFC",
    "icon": "stethoscope",
    "enabled": True,
    "description": "Personal health consultation agent",
    "v1": True,
    "headless": True,  # No sidebar, no dashboard panel
}
