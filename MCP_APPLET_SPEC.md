# MCP Applet Spec — Universal Guideline

Every new AI-tutor-compatible applet must follow this spec.  
Copy this document into `mcp/MCP_APPLET_SPEC.md` in any new applet repo.

This document is **topic-agnostic**. Examples use neutral names (`submitAnswer`, `selectOption`);  
map your applet's native actions into the same contract.

---

## Overview

An MCP-compatible applet exposes itself to the AI tutor through layered protocol shells.  
The applet's own state machine (React reducer, AppletMCP bus) **stays unchanged** — only thin adapters are added on top.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  AI Tutor Backend  (mcp_simulation_graph.py)                            │
│       ↕  HTTP SSE  (MCP tools: describe_page, domain actions, …)        │
│  mcp-applet-server.js   — Node.js, Playwright, MCP SDK                  │
│       ↕  page.evaluate  → window.AppAPI   (bypasses bridge)             │
├─────────────────────────────────────────────────────────────────────────┤
│  js/ai/app-api.js       — per-applet adapter over AppletMCP            │
│       ↕  translates bus events + attaches event.tutor dialogue           │
│  js/ai/bridge.js        — verbatim copy, zero edits                       │
│       ↕  postMessage  (ai.handshake | ai.call | ai.subscribe | …)      │
│  SimulationContent.jsx  (host FE, iframe parent)                        │
│       ↕  onStudentInteraction → MAX /chat                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Two integration paths (both valid)

| Path | Who drives the applet | Who hears events |
|---|---|---|
| **Production host** | `SimulationContent` sends `ai.call` via postMessage | Host subscribes via `ai.subscribe` → receives `ai.event` with `event.tutor` |
| **MCP server / agent** | Playwright calls `window.AppAPI` directly | MCP server does **not** auto-subscribe to `ai.event` unless you add that |

Standalone browser testing (`localhost` + DevTools) has **no host** — you must manually send handshake + subscribe (see §12).

---

## Deliverables A–F Reference (Full Applet Stack)

A production-ready MCP applet has six reusable deliverables (see `docs/applet-mcp-bridge-blueprint.md`).

| Deliverable | Scope | Reuse level | Required |
|---|---|---|---|
| **A — Bridge core** | `AppletMCP` bus + registry (`listInstances`, `getProps`, `invoke`, `subscribe`, `emit`) | Reuse verbatim | Yes |
| **B — Registration layer** | `useMcpRegistry` / `withMcp` hooks that register component instances | Reuse verbatim | Yes |
| **C — Component integration** | Per-component: methods, `getProps`, domain event emits | Author per applet | Yes |
| **D — Catalog** | `getCatalog()` metadata + valid compose examples | Author per applet | Strongly recommended |
| **E — Scratchpad/Compose** | `createElement`, `listScratchpad`, `clearScratchpad`, compose page | Light wiring | Optional |
| **F — Dialogue layer** | `public/dialogues.js` + `getDialogue()` + event→dialogue resolver | Schema reused, content per locale | Yes for tutor-guided applets |

**Fleet rule:** ship Deliverables **A–F** (or E explicitly disabled) **and** the protocol shell. Do not ship only `bridge.js` + `app-api.js`.

---

## Required Files

| File | Origin | Notes |
|---|---|---|
| `window.APP_CONFIG` in every locale entry HTML | Author once per entry | See §1 |
| `js/applet-mcp.js` | Copy from blueprint | Deliverables A+B |
| `js/applet-catalog.js` | Author per applet | Deliverable D |
| `public/dialogues.js` | Author per applet + locale | Deliverable F |
| `js/ai/bridge.js` | **Copy verbatim** from any prior applet | Zero edits |
| `js/ai/app-api.js` | Author per applet | Adapter over `AppletMCP` |
| `mcp/mcp-applet-server.js` | Author per applet | Structural copy + domain tools |
| `mcp/package.json` | Copy from prior applet | Same deps |

---

## 1. APP_CONFIG — Required in every entry HTML

Add **before** `applet-mcp.js` and AI scripts in **each** learner-facing entry file  
(e.g. `index.html`, `index-en.html`, or any locale-specific entry):

```html
<script>
  window.APP_CONFIG = {
    AI_ENABLED: /[?&]ai=1\b/.test(location.search),
    AI_ALLOWED_ORIGINS: ['*'],        // tighten in production
    appId:   'YOUR_APPLET_ID',
    version: '1.0.0',
  };
</script>
```

| Field | Used by |
|---|---|
| `AI_ALLOWED_ORIGINS` | `bridge.js` origin check on handshake / call |
| `AI_ENABLED` | Optional applet-specific flags (e.g. skip dev-only UI). **Does not** disable `bridge.js` — the listener is always installed |
| `appId`, `version` | Session metadata in `ai.handshake.ack` |

The production host loads applets with `?ai=1`. Use the same flag in local MCP testing.

---

## 2. bridge.js — Verbatim Copy

`bridge.js` is the **postMessage transport**. Copy unchanged — no applet logic.

### Inbound (host → applet)

| Message | Action |
|---|---|
| `ai.handshake` | Open session, reply `ai.handshake.ack` with schema from `describePage()` |
| `ai.call` | Route to `AppAPI[method](params)`, reply `ai.response` |
| `ai.subscribe` | `AppAPI.subscribe(filter, cb)`, fan out `ai.event` |
| `ai.unsubscribe` | Tear down subscription |

### Outbound (applet → host)

| Message | When |
|---|---|
| `ai.handshake.ack` | Handshake result |
| `ai.response` | Any `ai.call` result |
| `ai.event` | Each event matching the subscriber's `filter` |

**Session gate:** `ai.call` and `ai.subscribe` require a prior successful handshake.

---

## 3. window.AppAPI — Interface Contract

Every `app-api.js` **must** expose `window.AppAPI`:

### Core introspection

```js
AppAPI.describePage()       → PageDescription
AppAPI.snapshot()           → PageDescription & { ts: number }
AppAPI.checkSessionGoal()   → { reached: bool, questionIndex: number, totalQuestions: number }
```

### Auto-step (idle intervention)

```js
AppAPI.aiAutoStep()   → { ok: bool, stepPerformed: string, result?: any, error?: {...} }
```

Performs the **single next correct guided step** for the current state.

**Critical:** auto-steps must **not** loop back as student turns. Implement one of:

1. Emit events with `source: 'ai'` (preferred), or
2. Route auto-actions through internal APIs that suppress student event translation.

The host (`SimulationContent`) ignores `source === 'ai'` when forwarding to MAX.

### Subscription

```js
AppAPI.subscribe(filter, cb)   → unsubscribe()
AppAPI.transcript(opts)        → Event[]     // ring buffer — stub `[]` OK for v1
AppAPI._emit(event)            → void        // for bridge-internal / test hooks
```

`filter` is optional. Supported keys: `{ source, type }`.  
Omit filter or pass `{}` to receive all event types including `inactivity`.

### Actions

```js
AppAPI.actions.*     // semantic learner-facing actions (start, submitAnswer, showHint, …)
AppAPI.admin.*       // reset, navigate, setQuestionIndex, …
```

---

## 3A. Scale Contract (Fleet Boilerplate)

Use canonical names across applets; map topic-specific internals in `app-api.js`.

### Required lifecycle actions (every applet)

| Action | Purpose |
|---|---|
| `start` | Begin from intro / ready state |
| `stop` | End run safely |
| `pause` | Pause timers / input evaluation |
| `resume` | Resume after pause |
| `reset` | Return to clean initial state |
| `showHint` | Show learner-visible hint text |
| `clearHint` | Remove hint UI |

Unsupported actions **must still exist** and return:

```js
{ ok: false, error: { code: 'E_UNSUPPORTED_ACTION', message: 'pause not supported' } }
```

### Canonical action result envelope

```js
{ ok: true,  result: any }
{ ok: false, error: { code: string, message: string, details?: any } }
```

MCP `callApi` and orchestration code depend on this shape.

### Canonical vs native stage (recommended)

| Field | Purpose |
|---|---|
| `uiElementValues.stage` | Applet-native stage name (any string) |
| `uiElementValues.lifecycleStage` | Normalized: `intro \| active \| paused \| review \| completed \| stopped \| error` |

Include `lifecycleStage` when the applet has non-trivial lifecycle; omit only for trivial single-screen applets.

### Domain action aliases (additive only)

Keep applet-native names for backward compatibility. Add canonical aliases where useful:

| Canonical | Typical native names |
|---|---|
| `submit` | `submitAnswer`, `applyDigit`, `confirm` |
| `next` / `previous` | step navigation actions |
| `check` | explicit validation without advancing |

### PageDescription shape

```js
{
  page: number,
  stateBySurface: {
    '<surface-id>': {
      currentStep:     string,    // human-readable pending step
      expectedActions: string[],    // controlled vocabulary, e.g. ['submitAnswer']
      uiElementValues: { ... },     // surface snapshot (stage, targets, inputs, …)
    }
  },
  goal: { kind: string, description: string },
  semanticActions: [{ name, description, args }],
  questionIndex: number,
}
```

---

## 4. Standard Events

```
Component (Deliverable C)
  → AppletMCP bus (componentEvent)
  → app-api.js (translate to standard envelope + attach tutor block)
  → bridge.js (ai.event to host)
  → SimulationContent → MAX
```

### Event envelope

```js
{
  type:    string,
  source:  'student' | 'ai' | 'system',
  page:    number,
  payload: { name?: string, validation?: {...}, stage?: string, ... },
  tutor?:  { completion, feedback, next, learning }   // optional, see below
}
```

### Host subscription (production)

`SimulationContent` handshakes on iframe load and subscribes with:

```js
filter: {}   // all types — includes inactivity (system) and stage.changed
```

It **drops** events where `source === 'ai'` to prevent feedback loops when MAX auto-demonstrates a step.

Legacy note: subscribing only `{ source: 'student' }` **hides** `inactivity` and other system events.

### Required event types (minimum set)

| Event type | source | When | Payload (minimum) |
|---|---|---|---|
| `action.completed` | `student` | Correct learner action | `{ name, validation: { correct: true, actual } }` |
| `action.rejected` | `student` | Wrong / invalid action | `{ name, validation: { correct: false, actual } }` |
| `stage.changed` | `student` | Activity stage transition | `{ stage, prevStage }` |
| `inactivity` | `system` | Idle threshold while input expected | `{ stage, expectedAction }` |
| `activity.completed` | `student` | All session goals met | `{ score, solved, total }` |
| `bridge.handshake` | `system` | Host connected | `{ caller, capabilities }` — from `bridge.js` |

### Recommended (implement when lifecycle is supported)

| Event type | source | When |
|---|---|---|
| `lifecycle.changed` | `system` | `active` ↔ `paused` ↔ `stopped` transitions |

### Event → dialogue (`event.tutor`)

**Primary resolver: `app-api.js`** (Deliverable F wiring).

On each translated event, `app-api.js` looks up `public/dialogues.js` and attaches:

```js
event.tutor = {
  completion: string | null,   // praise / what just happened
  feedback:   string | null,   // wrong-action correction
  next:       string | null,   // what to do next
  learning:   string | null,   // optional concept line
}
```

Mapping convention (per page / locale in `dialogues.js`):

```
action.completed    →  events.<domainEvent> or actions.<actionName>
action.rejected     →  events.wrong<Action> or actions.<actionName>.error
stage.changed       →  events.entered<Stage>
inactivity          →  inactivity.<stage> ?? inactivity.default
activity.completed  →  events.activityComplete
```

The host prefers `event.tutor` text when forwarding to MAX.  
A **backend mirror** in `mcp_simulation_graph.py` is optional (useful when events arrive without `tutor` blocks).

### Event quality rules

- One semantic event per learner action (no duplicate minimal + rich emits for the same tap).
- Stable `payload.name` from a controlled vocabulary per applet.
- Always set `page` and `source`.
- No PII in payloads.
- Evolve payloads additively; do not rename keys used by live lessons.

---

## 5. sim:progress and sim:complete — Host Progress Signals

Separate from `ai.event` — these are direct `window.parent.postMessage` calls the lesson host listens for.

### sim:progress — after each meaningful correct step

```js
if (window.parent !== window) {
  window.parent.postMessage({
    type:  'sim:progress',
    step:  n,      // steps completed (1-based)
    total: M,
  }, '*');
}
```

### sim:complete — when all goals are met

```js
if (window.parent !== window) {
  window.parent.postMessage({
    type:   'sim:complete',
    solved: N,
    total:  N,
    score:  100,   // 0–100
  }, '*');
}
```

Emit from the same effects that fire AppletMCP domain events.  
The `window.parent !== window` guard keeps standalone HTTP testing safe.

---

## 6. MCP SSE Server Pattern

`mcp/mcp-applet-server.js`:

1. Launches Playwright, navigates to `APPLET_URL` (include `?ai=1`)
2. Waits for `window.AppAPI`
3. Exposes AppAPI methods as MCP tools over HTTP SSE (`PORT`) or stdio

### callApi helper (copy unchanged)

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

### Standard tools (identical fleet-wide)

| MCP tool | AppAPI path |
|---|---|
| `describe_page` | `describePage` |
| `snapshot` | `snapshot` |
| `check_session_goal` | `checkSessionGoal` |
| `ai_auto_step` | `aiAutoStep` |
| `start` | `actions.start` |
| `stop` | `actions.stop` |
| `pause` | `actions.pause` |
| `resume` | `actions.resume` |
| `reset` | `admin.reset` |
| `show_hint` | `actions.showHint` |
| `clear_hint` | `actions.clearHint` |

### Domain-specific tools (author per applet)

Add snake_case MCP tools mapped to camelCase `AppAPI.actions`:

| Pattern | Example |
|---|---|
| `submit_answer` | `actions.submitAnswer` |
| `select_option` | `actions.selectOption` |
| `apply_value` | `actions.applyValue` |
| `tap_target` | `actions.tapTarget` |

Document each tool's valid stages in the MCP `description` field (agents read this every turn).

### Optional MCP tools (platform v2)

| Tool | Purpose |
|---|---|
| `get_dialogue` | Fetch authored line by path without performing an action |
| Tutor blocks on tool **returns** | Attach `{ tutor: { next, … } }` to action tool results for agent-only paths |

### Environment variables

| Var | Default | Purpose |
|---|---|---|
| `PORT` | — | HTTP SSE port; omit for stdio |
| `APPLET_URL` | `http://localhost:8181/index.html?ai=1` | Served applet URL |
| `HEADLESS` | `false` | `true` for CI |
| `STARTUP_DELAY_MS` | `800` | Wait after `AppAPI` appears |
| `TUTOR_MODE` | `true` | Sets `AppAPI._tutorCapabilityActive` in browser |

---

## 7. Script Load Order

```
1.  libs (react, …)
2.  window.currentLanguage
3.  window.APP_CONFIG
4.  js/applet-mcp.js
5.  js/applet-catalog.js
6.  public/data.js, public/dialogues.js, …
7.  stylesheets
8.  src/components/**
9.  src/App.js, src/main.js
10. js/ai/app-api.js      ← after applet-mcp.js
11. js/ai/bridge.js       ← after app-api.js
```

If Deliverable E is enabled, include scratchpad page scripts in step 8.

---

## 8. App.js Requirements

```js
// Synchronous page index for describePage()
React.useEffect(() => { window.__appCurrentPage = page; }, [page]);

// Navigation hook for AppAPI.admin.navigate / aiAutoStep
window.appletNavigate = (p) => { setPage(Number(p)); return Number(p); };
```

Optional: welcome-page `inactivity` timer while waiting on `start` (emit via AppletMCP bus).

---

## 9. New Applet Checklist

### Required (ship blocker)

- [ ] `APP_CONFIG` + full AI script stack in **every** locale entry HTML
- [ ] Deliverables A+B: `applet-mcp.js`, component registry hooks
- [ ] Deliverable C: each interactive surface exposes methods, `getProps`, domain emits
- [ ] Deliverable F: `public/dialogues.js` for each supported locale
- [ ] `bridge.js` copied verbatim
- [ ] `app-api.js`: `describePage`, `checkSessionGoal`, `aiAutoStep`, `subscribe`, `actions.*`, `admin.*`
- [ ] Lifecycle stubs: `start`, `stop`, `pause`, `resume`, `reset`, `showHint`, `clearHint`
- [ ] Core events translated: `action.completed`, `action.rejected`, `stage.changed`, `inactivity`, `activity.completed`
- [ ] `event.tutor` attached on subscribe when `tutor` capability granted
- [ ] `aiAutoStep` does not re-fire as `source: 'student'` events
- [ ] `sim:progress` / `sim:complete` with `window.parent` guard
- [ ] `window.__appCurrentPage` + `window.appletNavigate`
- [ ] `mcp/mcp-applet-server.js` with standard + domain tools
- [ ] `mcp/package.json` deps installed; server smoke-tested

### Strongly recommended

- [ ] Deliverable D: `applet-catalog.js` with copy-paste-valid examples
- [ ] `uiElementValues.lifecycleStage` normalized in `describePage`
- [ ] `lifecycle.changed` events when pause/stop/resume are real
- [ ] Backend `_DOMAIN_KEYWORDS` entry for `derive_applet_domain` (§10)
- [ ] Lesson step configured with applet URL + MCP SSE URL in ai-tutor

### Optional (platform v2)

- [ ] Deliverable E: scratchpad compose page
- [ ] `transcript()` ring buffer (not a stub)
- [ ] `get_dialogue` MCP tool
- [ ] Tutor blocks on MCP tool return values
- [ ] Dev harness: auto-handshake when `?ai=1&debug=bridge=1` (avoids manual console snippets)
- [ ] Backend dialogue resolver mirror in Python

### Verification commands

```bash
# Serve applet
python3 -m http.server 8181

# MCP server
PORT=3001 HEADLESS=true APPLET_URL=http://localhost:8181/index.html?ai=1 node mcp/mcp-applet-server.js

# Tool smoke (requires agent client or test script)
# describe_page → start → domain action → check_session_goal
```

---

## 10. Python Backend — derive_applet_domain

For each new applet **type**, add a keyword row to `mcp_simulation_graph.py` → `_DOMAIN_KEYWORDS`.  
First label with ≥2 keyword hits in `describe_page` JSON wins.

```python
_DOMAIN_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
  ("long-division",  ("division", "divisor", "dividend", "quotient", ...)),
  ("fractions",      ("fraction", "numerator", "denominator", ...)),
  # Add one row per new applet family:
  ("YOUR-DOMAIN",    ("keyword1", "keyword2", "keyword3", ...)),
)
```

Use strings that appear in `describePage()` output (`semanticActions`, `currentStep`, `goal.description`, `uiElementValues`).  
Without a match, MAX still works but uses generic orchestration prompts.

---

## 11. Boilerplate / CI Template (Recommended)

Scaffold new applets with:

1. Entry HTML: `APP_CONFIG`, `app-api.js`, `bridge.js` prewired
2. Deliverables A+B installed; C/F placeholders
3. `app-api.js` skeleton: introspection, lifecycle stubs, event translation table, `resolveDialogue()`
4. `mcp-applet-server.js` skeleton: standard tools + `DOMAIN_TOOLS` array to fill in
5. CI scripted smoke (Playwright or MCP client):
   - `describe_page` schema valid
   - Required tools listed
   - Handshake + subscribe receives ≥1 `action.completed` and ≥1 `stage.changed`
   - `check_session_goal.reached` after completion script
   - Locale files present for each entry HTML

---

## 12. Standalone Dev Testing (No Host)

Opening the applet directly does **not** auto-connect a tutor. The bridge waits for a host.

### Quick console harness (paste after each full page reload)

**Listener:**

```js
window.addEventListener("message", (e) => {
  const d = e.data;
  if (!d || d.type !== "ai.event") return;
  console.log("[ai.event]", d.event?.type, d.event);
  console.log("[ev.tutor]", d.event?.tutor || null);
});
```

**Handshake + subscribe:**

```js
const req = (type, extra = {}) =>
  window.postMessage({ v: 1, type, requestId: `${type}-${Date.now()}`, ...extra }, "*");

window.addEventListener("message", (e) => {
  const d = e.data;
  if (!d || d.v !== 1) return;
  if (d.type === "ai.handshake.ack" && d.ok) {
    req("ai.subscribe", { filter: {} });
  }
  if (d.type === "ai.response") console.log("ai.response", d);
});

req("ai.handshake", { capabilities: ["events", "actions", "tutor", "transcript"] });
```

Save as a Chrome DevTools **Snippet** for one-click reuse.  
For MAX voice / TTS, use the full ai-tutor `SimulationContent` path instead.

### Direct AppAPI smoke (no bridge)

```js
AppAPI.describePage()
AppAPI.actions.start()
AppAPI.checkSessionGoal()
```

---

## 13. Idle / Inactivity — Two Mechanisms

Do not confuse these:

| Mechanism | Source | Purpose |
|---|---|---|
| Applet `inactivity` event | Component idle timer → `ai.event` | Authored nudge via `event.tutor.next` |
| Host `[IDLE_TIMEOUT]` | `SimulationContent` timer → `/chat` | MAX narrates an auto-demonstrated step (`aiAutoStep` / MCP tools) |

Both can coexist; tune thresholds so they do not fire back-to-back.

---

*This spec is applet-agnostic. `bridge.js` never changes. `app-api.js` and `mcp-applet-server.js` vary by topic but must follow the contracts above.*
