# Math Tutor AI — MCP Live Demo

A self-contained demo showing how an LLM agent (Amazon Bedrock via LangGraph) controls an interactive math applet in real-time through MCP tools.

## What the client sees

```
┌─────────────────────────────┬──────────────────────────────┐
│  Interactive Math Applet    │  AI Reasoning & MCP Actions  │
│  (live — updated by AI)     │                              │
│                             │  🤖 AI: "9 ≥ 3 so I start   │
│  [long division grid        │   with digit index 0..."     │
│   updating in real-time     │                              │
│   as AI takes each step]    │  🔧 TOOL → choose_dividend   │
│                             │  Input: { digits: [0] }      │
│                             │                              │
│  Architecture flow:         │  ✓ RESULT ← choose_dividend  │
│  Bedrock ⇄ LangGraph ⇄ MCP │  { correct: true, step: ... }│
│           ⇄ Applet          │                              │
└─────────────────────────────┴──────────────────────────────┘
```

The applet updates live because the frontend mirrors every MCP tool call into the iframe via the `bridge.js` postMessage protocol — no polling, no page refresh.

## Architecture

```
Browser (port 5000)
  ├── iframe ──postMessage──► Applet (port 8080)  ← mirror
  └── EventSource SSE ──► Demo Backend (port 5000)
                              └── LangGraph Agent
                                    └── MCP Client (SSE) ──► MCP Server (port 3001)
                                                                  └── Playwright ──► Applet (port 8080)
```

## Setup

### 1. Install Python dependencies

```powershell
cd demo\backend
pip install -r requirements.txt
```

### 2. Configure credentials

```powershell
copy .env.example .env
# Edit .env — add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
```

### 3. Start everything

```powershell
# From the repo root (mcp-math-applet-simulation\)
.\demo\start_demo.ps1
```

This opens three terminal windows:
- **Applet** at http://localhost:8080
- **MCP Server** at http://localhost:3001 (SSE mode, visible Chrome window)
- **Demo Backend** at http://localhost:5000

Then open **http://localhost:5000** and click **▶ Start Demo**.

### Manual startup (if you prefer separate terminals)

**Terminal 1 — Applet:**
```powershell
npx http-server -p 8080
```

**Terminal 2 — MCP Server (SSE mode):**
```powershell
cd mcp
$env:PORT = "3001"
$env:HEADLESS = "false"
$env:TUTOR_MODE = "true"
$env:APPLET_URL = "http://localhost:8080/index.html?ai=1"
node mcp-applet-server.js
```

**Terminal 3 — Demo Backend:**
```powershell
cd demo\backend
uvicorn main:app --port 5000 --reload
```

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | — | AWS credential |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credential |
| `BEDROCK_REGION` | `ap-south-1` | Bedrock region |
| `BEDROCK_MODEL` | `apac.amazon.nova-lite-v1:0` | Inference profile |
| `MCP_SERVER_URL` | `http://localhost:3001` | MCP server SSE base URL |

## Files

```
demo/
├── backend/
│   ├── agent.py         # LangGraph ReAct agent + MCP client
│   ├── main.py          # FastAPI SSE endpoint
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── index.html       # Split-view demo UI (single file, no build step)
├── start_demo.ps1       # Windows launcher
└── README.md
```
