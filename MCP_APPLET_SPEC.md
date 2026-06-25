# MCP Applet Spec — Universal Guideline

Every new AI-tutor-compatible applet must follow this spec.  
Copy this document into `mcp/MCP_APPLET_SPEC.md` in any new applet repo.

---

## Overview

An MCP-compatible applet exposes itself to the AI tutor via protocol layers:

```
┌────────────────────────────────────────────────────────────┐
│  AI Tutor Backend  (mcp_simulation_graph.py)               │
│       ↕  HTTP SSE                                          │
│  mcp-applet-server.js   — Node.js, Playwright, MCP SDK     │
│       ↕  page.evaluate  → window.AppAPI                    │
│  js/ai/app-api.js       — thin adapter, applet-specific    │
│       ↕  postMessage                                       │
│  js/ai/bridge.js        — verbatim copy, zero edits        │
│       ↕  postMessage                                       │
│  SimulationContent.jsx  (host FE, iframe parent)           │
└────────────────────────────────────────────────────────────┘
```

The applet's own state machine (React reducer, AppletMCP bus) **stays unchanged**.  
The four layers above sit on top as a thin production protocol shell.

---

## Deliverables A–F Reference (Full Applet Stack)

This spec is not only about the bridge/protocol shell. A production-ready MCP applet
has six reusable deliverables from `docs/applet-mcp-bridge-blueprint.md`.

| Deliverable | Scope | Reuse level | Required |
|---|---|---|---|
| **A — Bridge core** | `AppletMCP` core bus + registry (`listInstances`, `getProps`, `invoke`, `subscribe`, `emit`) | Reuse verbatim | Yes |
| **B — Registration layer** | `useMcpRegistry` / `withMcp` hooks that register component instances | Reuse verbatim | Yes |
| **C — Component integration** | Per-component integration: methods, `getProps`, event emits, overrides | Author per applet | Yes |
| **D — Catalog** | `getCatalog()` metadata + examples for agent composition | Author per applet | Strongly recommended |
| **E — Scratchpad/Compose** | `createElement`, `listScratchpad`, `clearScratchpad`, compose page | Light per-applet wiring | Optional (recommended for tooling) |
| **F — Dialogue layer** | `public/dialogues.js` + `getDialogue()` reader + event-to-dialogue mapping | Schema reused, content authored per locale | Yes for tutor-guided applets |

### Deliverables vs protocol shell

- Deliverables **A–F** power in-applet control, composition, and dialogue content.
- The **protocol shell** (`APP_CONFIG`, `app-api.js`, `bridge.js`, `mcp-applet-server.js`) exposes those capabilities to host/backend.
- Fleet consistency requires both parts. Do not ship only bridge files.

---

## Required Files

| File | Origin | Notes |
|---|---|---|
| `window.APP_CONFIG` block in `index.html` | Author once | 5 lines |
| `js/applet-mcp.js` | Copy from blueprint | Deliverables A+B core/hook layer |
| `js/applet-catalog.js` | Author per-applet | Deliverable D catalog metadata |
| `public/dialogues.js` | Author per-applet + locale | Deliverable F dialogue content |
| `js/ai/bridge.js` | **Copy verbatim** from any prior applet | Zero edits — transport-agnostic |
| `js/ai/app-api.js` | Author per-applet | Adapter over `window.AppletMCP` |
| `mcp/mcp-applet-server.js` | Author per-applet | Structural copy, new tool names |
| `mcp/package.json` | Copy from prior applet | Same deps |

---

## 1. APP_CONFIG — Required in index.html

Add this block **before any AI scripts** load:

```html
<script>
  window.APP_CONFIG = {
    AI_ENABLED: /[?&]ai=1\b/.test(location.search),
    AI_ALLOWED_ORIGINS: ['*'],        // tighten in production
    appId:   'YOUR_APPLET_ID',        // e.g. 'G8C6M2A3'
    version: '1.0.0',
  };
</script>
```

`bridge.js` reads `APP_CONFIG.AI_ALLOWED_ORIGINS` for origin validation.  
`AI_ENABLED` gates any AI-only initialisation; the host always loads the applet with `?ai=1`.

---

## 2. bridge.js — Verbatim Copy

`bridge.js` handles the postMessage protocol. **Copy it unchanged** — it is 100% applet-agnostic.  
It only calls `window.AppAPI[method](params)` and forwards events. No applet-specific logic lives here.

### Messages it handles (inbound from host)

| Message type | What it does |
|---|---|
| `ai.handshake` | Opens a session, replies `ai.handshake.ack` with schema |
| `ai.call` | Routes to `window.AppAPI[method](params)`, replies `ai.response` |
| `ai.subscribe` | Calls `AppAPI.subscribe(filter, cb)`, fans events as `ai.event` |
| `ai.unsubscribe` | Tears down a subscription |

### Messages it sends (outbound to host)

| Message type | Trigger |
|---|---|
| `ai.handshake.ack` | Response to handshake |
| `ai.response` | Response to any `ai.call` |
| `ai.event` | Each subscribed AppAPI event |

---

## 3. window.AppAPI — Interface Contract

Every applet's `app-api.js` **must** expose `window.AppAPI` with these methods:

### Core introspection

```js
AppAPI.describePage()       → PageDescription
AppAPI.snapshot()           → PageDescription & { ts: number }
AppAPI.checkSessionGoal()   → { reached: bool, questionIndex: number, totalQuestions: number }
```

### Auto-step (idle intervention)

```js
AppAPI.aiAutoStep()   → { ok: bool, stepPerformed: string, result: any }
```

Reads the current state, performs the **single next correct guided step**, and returns what was done.  
Must emit `source: 'ai'` on the event bus so `bridge.js` does **not** echo it as a student turn.

### Subscription (event streaming)

```js
AppAPI.subscribe(filter, cb)   → unsubscribe()
AppAPI.transcript(opts)        → Event[]
AppAPI._emit(event)            → void
```

### Actions

```js
AppAPI.actions.*     // semantic actions: start, plotPoint, reveal, reset, showHint, etc.
AppAPI.admin.*       // admin actions: reset, navigate
```

---

## 3A. Scale Contract (Boilerplate for 1000+ Applets)

When you maintain many applets across chapters, avoid per-applet naming drift.
Use this canonical contract and map topic-specific internals into it.

### Required common lifecycle actions (topic-agnostic)

Expose these in `AppAPI.actions` for **every** applet:

| Action | Purpose | Return shape |
|---|---|---|
| `start` | Begin activity/session from intro/ready state | `{ ok, result? \| error? }` |
| `stop` | Stop current run safely (no state corruption) | `{ ok, result? \| error? }` |
| `pause` | Temporarily pause timers/animations/input evaluation | `{ ok, result? \| error? }` |
| `resume` | Continue after pause | `{ ok, result? \| error? }` |
| `reset` | Reset to clean initial state | `{ ok, result? \| error? }` |
| `showHint` | Render learner-visible hint text | `{ ok, result? \| error? }` |
| `clearHint` | Remove hint UI | `{ ok, result? \| error? }` |

If an applet does not support a lifecycle action natively, still expose it and return:

```js
{ ok: false, error: { code: 'E_UNSUPPORTED_ACTION', message: 'pause not supported' } }
```

This keeps orchestration code stable across all applets.

### Canonical state stages (normalize per applet)

Standardize applet-specific state into these stages where possible:

`intro | active | paused | review | completed | stopped | error`

Topic-specific stages (for example `plot`, `join`, `extend`) are allowed, but include:
- canonical stage in `uiElementValues.lifecycleStage`
- native stage in `uiElementValues.stage`

### Canonical action result envelope

All `AppAPI.actions.*` and `AppAPI.admin.*` methods should return one of:

```js
{ ok: true, result: any }
{ ok: false, error: { code: string, message: string, details?: any } }
```

`callApi` and MCP tools depend on this stability.

### Backward-compatible aliases

You may keep applet-native names (`plotPoint`, `tapLine`, `submitAnswer`) but expose canonical aliases too:
- `submit` for answer submission
- `next` / `previous` for step navigation
- `check` for explicit validation

Do not remove existing names used by older lessons; add aliases instead.

### PageDescription shape

```js
{
  page: number,
  stateBySurface: {
    '<surface-id>': {
      currentStep:     string,         // human-readable stage name
      expectedActions: string[],       // what the student should do next
      uiElementValues: { ... }         // surface-specific state snapshot
    }
  },
  goal: { kind: string, description: string },
  semanticActions: [{ name: string, args: { [key]: type } }],
  questionIndex: number,
}
```

---

## 4. Standard Events — Every Applet Must Emit

Events flow from the applet's internal bus (AppletMCP) **through** `app-api.js` (translated) into the
`bridge.js` → host (`SimulationContent.jsx`) → backend pipeline.

### Event envelope

```js
{
  type:    string,          // see taxonomy below
  source:  'student' | 'ai' | 'system',
  page:    number,
  payload: { ... }          // event-specific
}
```

`bridge.js` filters by `source` — the host subscribes with `{ source: 'student' }`,  
so AI-initiated events (`source: 'ai'`) are NOT forwarded to the backend. This prevents feedback loops.

### Required event types

| Event type | source | When to emit | Payload |
|---|---|---|---|
| `action.completed` | `student` | Any correct student action | `{ name, validation: { correct: true, actual: {...} } }` |
| `action.rejected` | `student` | Any wrong/invalid student action | `{ name, validation: { correct: false, actual: {...} } }` |
| `stage.changed` | `student` | Activity stage transition | `{ stage: string, prevStage: string }` |
| `lifecycle.changed` | `system` | Lifecycle state changed (`active/paused/stopped/...`) | `{ state: string, prevState: string }` |
| `inactivity` | `system` | Idle threshold exceeded | `{ stage, expectedAction }` |
| `activity.completed` | `student` | All goals reached | `{ score, solved, total }` |
| `bridge.handshake` | `system` | AI tutor connected | `{ caller, capabilities }` — emitted by bridge.js |

### Event → Dialogue mapping

Each event triggers a dialogue lookup in the backend. The key convention is:

```
inactivity          →  dialogue.inactivity.<stage>   (or default)
action.rejected     →  dialogue.error.<actionName>
stage.changed       →  dialogue.stage.<stage>
activity.completed  →  dialogue.complete
```

The backend (`mcp_simulation_graph.py`) handles dialogue selection — the applet just emits raw events.

### Event quality rules (for fleet reliability)

- Emit one semantic event per learner action (avoid duplicate minimal + rich events).
- Include stable `payload.name` values from a controlled vocabulary.
- Always include `page` and `source`.
- Never emit PII in payloads.
- Prefer additive payload evolution; do not rename/remove existing keys.

---

## 5. sim:progress and sim:complete — Progress Reporting

The host (`SimulationContent.jsx`) listens for these `window.parent.postMessage` calls
to track progress and mark the lesson step as done.

### sim:progress — emit on each correct step

```js
if (window.parent !== window) {
  window.parent.postMessage({
    type:  'sim:progress',
    step:  n,      // steps completed so far (1-based)
    total: M,      // total steps in session
  }, '*');
}
```

### sim:complete — emit when all goals are met

```js
if (window.parent !== window) {
  window.parent.postMessage({
    type:   'sim:complete',
    solved: N,     // number of goals solved
    total:  N,     // total goals
    score:  100,   // score 0–100
  }, '*');
}
```

**Where to add these:** In the same `useEffect` that fires AppletMCP domain events.  
Always guard with `window.parent !== window` so standalone testing doesn't throw.

---

## 6. MCP SSE Server Pattern

`mcp/mcp-applet-server.js` is a Node.js server that:
1. Launches Playwright (headless), navigates to `APPLET_URL?ai=1`
2. Waits for `window.AppAPI` to exist
3. Exposes AppAPI methods as MCP tools over HTTP SSE (`PORT` env var)

### callApi helper — always the same

```js
async function callApi(path, args = {}) {
  const p = await ensureBrowser();
  return p.evaluate(({ path, args }) => {
    const parts = path.split('.');
    let target = window.AppAPI;
    for (let i = 0; i < parts.length - 1; i++) target = target && target[parts[i]];
    const fn = target && target[parts[parts.length - 1]];
    if (typeof fn !== 'function') return { ok: false, error: { code: 'E_UNKNOWN_METHOD' } };
    try {
      const r = fn.call(target, args);
      if (r && typeof r === 'object' && 'ok' in r) return r;
      return { ok: true, result: r };
    } catch (e) { return { ok: false, error: { code: 'E_INTERNAL', message: e.message } }; }
  }, { path, args });
}
```

### Standard tools every server must expose

| Tool name | AppAPI path | Args |
|---|---|---|
| `describe_page` | `describePage` | — |
| `snapshot` | `snapshot` | — |
| `check_session_goal` | `checkSessionGoal` | — |
| `ai_auto_step` | `aiAutoStep` | — |
| `start` | `actions.start` | — |
| `stop` | `actions.stop` | — |
| `pause` | `actions.pause` | — |
| `resume` | `actions.resume` | — |
| `reset` | `admin.reset` | — |

Then add **domain-specific action tools** (e.g. `plot_point`, `start`, `reveal`, `tap_line`).

### Naming convention for domain tools

Use snake_case MCP names and map to camelCase AppAPI actions:
- `submit_answer` → `actions.submitAnswer`
- `select_option` → `actions.selectOption`
- `manipulate_object` → `actions.manipulateObject`

Keep generic tool names (`start`, `stop`, `pause`, `resume`, `reset`) identical across all applets.

### Environment variables

| Var | Default | Purpose |
|---|---|---|
| `PORT` | — | HTTP SSE port (omit for stdio) |
| `APPLET_URL` | `http://localhost:8080/index.html?ai=1` | Applet URL |
| `HEADLESS` | `false` | `true` for CI/production |
| `STARTUP_DELAY_MS` | `500` | Extra wait after AppAPI appears |

---

## 7. Script Load Order

```
1. libs (react, anime, katex, etc.)

2. <script> window.currentLanguage = "..." </script>
3. <script> window.APP_CONFIG = { AI_ENABLED: ..., AI_ALLOWED_ORIGINS: [...] } </script>  ← NEW

4. js/applet-mcp.js              ← offline AppletMCP bridge
5. js/applet-catalog.js

6. public/data.js, public/dialogues.js, etc.

7. [stylesheets]

8. src/components/**             ← all component scripts
9. src/App.js
10. src/main.js

11. js/ai/app-api.js             ← NEW — must be AFTER applet-mcp.js
12. js/ai/bridge.js              ← NEW — must be AFTER app-api.js
```

If Deliverable E is enabled, also include the scratchpad page/component scripts in the same app script group.

---

## 8. App.js Requirements

```js
// Track current page so AppAPI.describePage() can read it.
React.useEffect(() => { window.__appCurrentPage = page; }, [page]);

// Expose navigation hook for AppletMCP.navigate().
window.appletNavigate = (p) => { setPage(Number(p)); return Number(p); };
```

---

## 9. New Applet Checklist

- [ ] `window.APP_CONFIG` block in `index.html` (and `index-en.html`)
- [ ] Deliverable A+B present: `js/applet-mcp.js` installed and component registry hooks working
- [ ] Deliverable C complete for each interactive component (`getProps`, methods, event emits)
- [ ] Deliverable D present: `js/applet-catalog.js` with valid examples
- [ ] Deliverable F present: `public/dialogues.js` for all required locales
- [ ] `js/ai/bridge.js` copied verbatim from prior applet
- [ ] `js/ai/app-api.js` authored: `describePage`, `checkSessionGoal`, `aiAutoStep`, `subscribe`, `actions.*`
- [ ] Common lifecycle actions implemented: `start`, `stop`, `pause`, `resume`, `reset`
- [ ] All activity state changes emit events via AppletMCP bus (translated by app-api.js)
- [ ] Event taxonomy includes: `action.completed`, `action.rejected`, `stage.changed`, `lifecycle.changed`, `inactivity`, `activity.completed`
- [ ] `sim:progress` postMessage on each correct step
- [ ] `sim:complete` postMessage when all goals are met  
- [ ] `window.__appCurrentPage` updated on page state change in `App.js`
- [ ] All action methods exposed via `AppAPI.actions.*`
- [ ] `mcp/mcp-applet-server.js` with domain-specific tools
- [ ] `mcp/package.json` with npm deps installed
- [ ] Script load order is correct in `index.html`
- [ ] Server tested: `PORT=3001 HEADLESS=true APPLET_URL=http://localhost:8XXX/index.html?ai=1 node mcp/mcp-applet-server.js`

### Optional checklist (recommended for platform tooling)

- [ ] Deliverable E enabled: scratchpad compose APIs (`createElement`, `listScratchpad`, `clearScratchpad`)
- [ ] `transcript` is implemented (ring buffer), not a stub
- [ ] `getDialogue(path, lang)` and `getCatalog(mode, name)` both available through `AppletMCP`

---

## 10. Python Backend — derive_applet_domain

Add a domain keyword entry to `mcp_simulation_graph.py` → `_DOMAIN_KEYWORDS` for every new applet type:

```python
# Example for graph/linear-equations applet:
("linear-graphs", ("plot", "plotPoint", "equation", "linear", "ordered pair", "graph", "coordinate")),
```

Without this, MAX falls back to generic guidance text — correct but not domain-specific.

---

## 11. Boilerplate Generation Template (Recommended)

For large-scale applet fleets, scaffold new applets from a template with:

1. `index.html` AI blocks (`APP_CONFIG`, `app-api.js`, `bridge.js`) prewired
2. Deliverables A+B prewired (`applet-mcp.js`, registration hooks)
3. Deliverable D/F placeholders prewired (`applet-catalog.js`, `public/dialogues.js`)
4. `app-api.js` skeleton with:
   - required introspection methods
   - required lifecycle actions (`start/stop/pause/resume/reset`)
   - event translation stubs
5. `mcp-applet-server.js` skeleton with standard tools predeclared
6. CI check that validates:
   - required tools present
   - required events emitted at least once in scripted smoke run
   - `describe_page` schema shape
   - Deliverables A–F files present (or E explicitly disabled)
   - locale dialogue coverage for required languages

This prevents one-off protocol drift between chapter teams.

---

*This spec is applet-agnostic. `bridge.js` never changes. `app-api.js` and `mcp-applet-server.js` change tool names and state shapes but follow the same structural patterns.*
