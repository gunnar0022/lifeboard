"""WebSocket connection manager for live dashboard updates."""
import json
import logging
from datetime import datetime, timezone
from fastapi import WebSocket

logger = logging.getLogger("lifeboard")


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected ({len(self.active_connections)} active)")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected ({len(self.active_connections)} active)")

    async def broadcast(self, panel: str):
        """Notify all connected clients that a panel's data has changed."""
        if not self.active_connections:
            return
        message = json.dumps({
            "event": "data_changed",
            "panel": panel,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        disconnected = []
        for conn in self.active_connections:
            try:
                await conn.send_text(message)
            except Exception:
                disconnected.append(conn)
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)


manager = ConnectionManager()
