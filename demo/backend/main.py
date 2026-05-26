"""FastAPI backend for the interactive Math Tutor demo."""

import json
import logging
import os
import uuid
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from tutor import TutorSession

load_dotenv()


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("main")

app = FastAPI(title="Math Tutor — Interactive Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:3000")


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    client = ws.client
    logger.info(f"WebSocket connected from {client}")

    # Per-connection session — each browser tab gets its own session
    session: Optional[TutorSession] = None

    async def send(data: dict):
        await ws.send_text(json.dumps(data))

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            mtype = msg.get("type")
            logger.info(f"[WS] Received type={mtype!r}")

            if mtype == "start":
                # Create a fresh session with a unique ID every time Start is clicked
                session_id = uuid.uuid4().hex[:8]
                logger.info(f"[SESSION] Creating new session session_id={session_id!r}")
                session = TutorSession(MCP_SERVER_URL, session_id=session_id)
                try:
                    status = await session.initialize()
                    logger.info(f"[SESSION] Initialized: {status}")
                    await send({"type": "status", "content": f"Session {session_id} ready — {status}"})
                    logger.info(f"[SESSION] Starting greeting turn")
                    async for evt in session.start():
                        await send(evt)
                    logger.info(f"[SESSION] Greeting complete")
                except Exception as exc:
                    logger.error(f"[SESSION] Start failed: {exc}", exc_info=True)
                    await send({"type": "error", "content": str(exc)})

            elif mtype == "message":
                if session is None:
                    logger.warning("[WS] Message received but no session — ignoring")
                    await send({"type": "error", "content": "Session not started. Click ▶ Start Session first."})
                    continue
                content = msg.get("content", "")
                logger.info(f"[STUDENT] Chat message: {content[:120]!r}")
                try:
                    async for evt in session.student_message(content):
                        await send(evt)
                except Exception as exc:
                    logger.error(f"[STUDENT] Error processing message: {exc}", exc_info=True)
                    await send({"type": "error", "content": str(exc)})

            elif mtype == "applet_event":
                if session is None:
                    logger.warning("[WS] Applet event received but no session — ignoring")
                    continue
                event_data = msg.get("event", {})
                etype = event_data.get("type", "unknown")
                esource = event_data.get("source", "unknown")
                logger.info(f"[APPLET] Event type={etype!r} source={esource!r}")
                try:
                    async for evt in session.applet_event(event_data):
                        await send(evt)
                except Exception as exc:
                    logger.error(f"[APPLET] Error processing event: {exc}", exc_info=True)
                    await send({"type": "error", "content": str(exc)})

            elif mtype == "reset":
                logger.info(f"[SESSION] Reset requested (was session_id={session.session_id if session else None!r})")
                session = None
                await send({"type": "status", "content": "Session cleared. Click ▶ Start Session to begin again."})

            else:
                logger.warning(f"[WS] Unknown message type: {mtype!r}")

    except WebSocketDisconnect:
        logger.info(f"[WS] Client disconnected (session_id={session.session_id if session else None!r})")
    except Exception as exc:
        logger.error(f"[WS] Unexpected error: {exc}", exc_info=True)


@app.get("/api/health")
async def health():
    return {"status": "ok", "mcp_url": MCP_SERVER_URL}


# Serve frontend
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
