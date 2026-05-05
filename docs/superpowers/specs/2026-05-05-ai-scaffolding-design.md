# AI Scaffolding for Math Learning Applet — Design

Date: 2026-05-05
Status: Approved (brainstorming)
Scope: Page 1 (division intro) + Page 2 (long-division guided) of `G4C3M20A1_v1`

## 1. Goals & non-goals

### Goals
- Expose every meaningful interaction on pages 1 and 2 to a programmatic caller (in-page or external) via one consistent API: `window.AppAPI`.
- Caller can answer three things at any time: *what is this page about*, *what can I do*, *what just happened*.
- Support all four use cases from a single surface:
  - **AI as student** — drives the UI to a correct answer.
  - **AI as tutor / co-pilot** — observes a human child, intervenes with hints/encouragement.
  - **AI as automated QA** — exercises every UI path to find regressions.
  - **AI as authoring helper** — verifies a new question (e.g. 248 ÷ 7) renders and behaves correctly end-to-end.
- Zero observable change to the applet when no caller is connected — no UI drift, no extra animations, no console noise beyond what already exists.
- Provide a `ControlSurface` kernel so the addition / subtraction / multiplication grids (and any future component) can opt in later without re-architecture.

### Non-goals (v1)
- No deterministic replay of past sessions.
- No backend, no localhost server, no file I/O — preserves "completely offline".
- No new visual elements, keyboard shortcuts, or sounds.
- No coverage of currently-unused grid components (multiplication / addition / subtraction). They get the kernel contract, not implementations.
- No security/auth model beyond an origin allow-list (offline scaffolding, not a multi-tenant service).

## 2. Architecture

Three layers, each thin and replaceable.

```
┌───────────────────────────────────────────────────────────────┐
│  External caller                                              │
│  ┌─────────────────┐   ┌─────────────────┐  ┌──────────────┐  │
│  │ Parent window   │   │ Browser ext.    │  │ Playwright   │  │
│  │ (iframe host)   │   │ (content script)│  │ harness      │  │
│  └────────┬────────┘   └────────┬────────┘  └──────┬───────┘  │
└───────────┼─────────────────────┼──────────────────┼──────────┘
            │   postMessage envelope (shared wire format)
            ▼                     ▼                  ▼
┌───────────────────────────────────────────────────────────────┐
│  Bridge layer  — js/ai/bridge.js                              │
│  • postMessage listener (origin allow-list)                   │
│  • handshake protocol                                         │
│  • request/response correlation by requestId                  │
│  • forwards events from EventBus to all connected callers     │
│  • mirror of every AppAPI method, JSON-only                   │
└───────────────────────────┬───────────────────────────────────┘
                            │  in-page function calls
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  Core API  — js/ai/app-api.js   (window.AppAPI)               │
│  ┌──────────────┬─────────────┬─────────────┬──────────────┐  │
│  │ describe-    │ snapshot    │ actions     │ admin        │  │
│  │ Page()       │ /transcript │ (semantic + │ (setQuestion │  │
│  │ checkGoal()  │ /subscribe  │  UI-level)  │  reset)      │  │
│  └──────┬───────┴──────┬──────┴──────┬──────┴──────┬───────┘  │
│         │  one EventBus, one Registry of ControlSurfaces      │
└─────────┼──────────────┼─────────────┼─────────────┼──────────┘
          │              │             │             │
          ▼              ▼             ▼             ▼
┌───────────────────────────────────────────────────────────────┐
│  ControlSurface kernel  — js/ai/control-surface.js            │
│  Contract every AI-aware component implements:                │
│   • getManifest()  → semantic actions + UI elements + goal    │
│   • dispatch(action) → routes to existing internal handlers   │
│   • getState() / getCurrentStep() / checkGoal()               │
│   • emits events via shared EventBus                          │
└───────────────────────────┬───────────────────────────────────┘
                            │  thin adapters, no logic duplicated
                            ▼
┌───────────────────────────────────────────────────────────────┐
│  Existing applet  (untouched behaviourally)                   │
│  AppStateProvider · LongDivisionGrid · Page1Header · buttons  │
│  PageCompletionManager · window.question · i18n               │
└───────────────────────────────────────────────────────────────┘
```

### Invariants

- **No logic duplication.** `actions.setQuotientDigit({column:0,value:3})` resolves to the same internal call path the click handler in `long-division-grid-component.js` already uses. If a behaviour can't be reached through an existing handler, the fix is to factor that handler — never to write a parallel implementation.
- **Existing globals untouched.** `window.changePageAndNotify`, `window.currentQuestionIndex`, `window.PageCompletionManager`, `window.__longDivisionComplete`, `window.__longDivisionGuidedHint` keep their current shape and behaviour. The Core API reads/writes them but does not deprecate them. Page 2's existing Next-button cycling logic ([PageConfig.js:482](../../js/PageConfig.js)) keeps working without modification.
- **Layers run independently.** A Playwright harness can ignore the bridge and call `window.AppAPI` directly via `page.evaluate`. The bridge runs without the harness if any postMessage caller is present.
- **All AI code lives under `js/ai/`.** Removing that directory and removing two `<script>` tags from `index.html` reverts the applet to its current state.

## 3. Page contracts

### Page 1 — Division intro

```js
AppAPI.describePage()
// {
//   page: 1,
//   title: { ui:"Berapa 96 ÷ 3?", en:"What is 96 ÷ 3?", i18nKey:"pages.page1.headerWhatIs" },
//   problem: { dividend: 96, divisor: 3 },
//   currentStep: "tapStartButton",
//   expectedActions: ["start", "navigateNext"],
//   goal: { kind: "navigate", target: 2 },
//   semanticActions: [
//     { name:"start",       args:{},                                   description:"Begin solving" },
//     { name:"setQuestion", args:{ dividend:"int>0", divisor:"int>0" }, scope:"admin" }
//   ],
//   uiElements: [
//     { id:"page1-start-button",            role:"button",
//       label:{ ui:"Mulai", en:"Start", i18nKey:"pages.page1.startButton" } },
//     { id:"page1-header",                  role:"text"    },
//     { id:"page1-division-problem-display",role:"display" },
//     { id:"page1-instruction",             role:"text"    }
//   ]
// }
```

`actions.start()` invokes the existing `window.changePageAndNotify(2)`. UI-level `click({id:"page1-start-button"})` reaches the same place.

### Page 2 — Long division guided mode

The state machine already exists implicitly inside `LongDivisionGrid` (it controls `__longDivisionGuidedHint`). The kernel surfaces it explicitly:

```
chooseDividendDigits → chooseQuotientDigit → writePartialProduct
  → writeSubtractionResult → (bringDownDigit → chooseQuotientDigit … loop)
  → writeRemainder → complete
```

```js
AppAPI.describePage()
// {
//   page: 2,
//   title: { ui:"Berapa 96 ÷ 3?", en:"What is 96 ÷ 3?", i18nKey:"pages.page1.headerWhatIs" },
//   problem: { dividend: 96, divisor: 3, questionIndex: 0, totalQuestions: 5 },
//   currentStep: "chooseQuotientDigit",
//   stepContext: { column: 0, activeCellId: "page2-grid-quot-0" },
//   expectedActions: ["chooseQuotientDigit", "selectMultiplicationTableRow"],
//   currentHint: {
//     ui:"Berapa kali 3 masuk ke 9?",
//     en:"How many times does 3 go into 9?",
//     i18nKey:"division.howManyTimes",
//     params:{ divisor:3, value:9 }
//   },
//   goal: {
//     kind: "completeDivision",
//     target: { quotient: [3, 2], remainder: 0 }
//   },
//   semanticActions: [
//     { name:"chooseDividendDigits",         args:{ digits:"int[]" } },
//     { name:"chooseQuotientDigit",          args:{ column:"int>=0", value:"digit" } },
//     { name:"setPartialProduct",            args:{ column:"int>=0", value:"digit" } },
//     { name:"setSubtractionResult",         args:{ column:"int>=0", value:"digit" } },
//     { name:"bringDownDigit",               args:{ fromColumn:"int>=0" } },
//     { name:"setRemainder",                 args:{ value:"digit" } },
//     { name:"selectMultiplicationTableRow", args:{ multiplier:"int 1..10" } },
//     { name:"clickNext",                    args:{} },
//     { name:"clickPrevious",                args:{} },
//     // admin
//     { name:"setQuestion",      args:{ dividend:"int>0", divisor:"int>0" }, scope:"admin" },
//     { name:"setQuestionIndex", args:{ index:"int>=0" },                    scope:"admin" },
//     { name:"reset",            args:{ to:"page1|page2-fresh|currentPage-fresh" }, scope:"admin" }
//   ],
//   uiElements: [
//     { id:"page2-grid-quot-0", role:"cell", group:"quotient", col:0, value:null,
//       interactable:true,  expected:true /* admin scope: expected:3 */ },
//     { id:"page2-grid-quot-1", role:"cell", group:"quotient", col:1, value:null, interactable:false },
//     // partial-product, subtraction, dividend rows: same shape
//     { id:"page2-digit-panel-0", role:"button", label:"0" },  // …through 9
//     { id:"page2-mtable-row-1",  role:"row",   label:{ui:"3 × 1 = 3", en:"3 × 1 = 3"} }, // …through 10
//     { id:"page2-next-button",     role:"button", label:{ui:"»", en:"»"} },
//     { id:"page2-previous-button", role:"button", label:{ui:"«", en:"«"} }
//   ]
// }
```

A typical action call:

```js
AppAPI.actions.chooseQuotientDigit({ column: 0, value: 3 })
// {
//   ok: true,
//   actionId: "act_42",
//   page: 2,
//   stepBefore: "chooseQuotientDigit",
//   stepAfter:  "writePartialProduct",
//   validation: { correct: true, expected: 3, accepted: 3 },
//   feedback: {
//     kind: "correct",
//     message: { ui:"Bagus! 3 × 3 = 9", en:"Great! 3 × 3 = 9",
//                i18nKey:"division.stepDescriptionDivide",
//                params:{ value:9, divisor:3, quotient:3 } },
//     sound: "correct.mp3"
//   },
//   stateDelta: {
//     "uiElements.page2-grid-quot-0.value": 3,
//     "stepContext.activeCellId": "page2-partprod-col-0",
//     "currentHint": { i18nKey:"division.hintProduct", params:{quotient:3, divisor:3} }
//   }
// }
```

A wrong move returns `validation:{correct:false,…}`, `feedback.kind:"incorrect"`, `stepAfter` unchanged, fires `wrong.mp3`. No state mutates.

### Goal checking

```js
AppAPI.checkGoal()
// { reached: true,
//   goal:   { kind:"completeDivision", target:{ quotient:[3,2], remainder:0 } },
//   actual: { quotient:[3,2], remainder:0, durationMs:41200, mistakes:1 } }

AppAPI.checkSessionGoal()
// Reached once questionIndex hits last and the division is complete.
```

### Admin scope

`admin.setQuestion`, `admin.setQuestionIndex`, `admin.reset({to})`, plus the read-only `checkGoal`, `snapshot`, `transcript`, `describePage` (always available regardless of scope). Admin methods require an explicit `"admin"` capability granted in the handshake; otherwise return `E_ADMIN_DENIED`.

## 4. Events, subscription, transcript

### Event envelope

```js
{
  seq:        137,                  // monotonic, per-session
  ts:         1746435000123,        // epoch ms
  source:     "ai" | "human" | "system",
  page:       2,
  questionIndex: 0,
  type:       "action.completed",
  actionId:   "act_42",             // present when correlatable to an action
  payload:    { /* event-specific */ }
}
```

### Event types

**Lifecycle (per AI-initiated action):**
- `action.requested` — emitted before validation (carries args)
- `action.completed` — emitted with the same `result` object the call returned
- `action.rejected` — invalid args / disabled action / wrong step (no state mutation)

**Domain (fired by both AI- and human-driven changes):**
- `step.advanced` — `{from, to, stepContext}`
- `hint.changed` — `{i18nKey, params, ui, en}` (mirrors `__longDivisionGuidedHint`)
- `cell.changed` — `{id, before, after}` — ground-truth event QA wants
- `feedback.shown` / `feedback.cleared`
- `goal.reached` — `{goal, actual}` (page-level)
- `sessionGoal.reached` — last question completed
- `page.changed` — `{from, to}` (also fires the existing `pageChanged` window event)
- `question.changed` — `{from, to, dividend, divisor, source:"next-button"|"admin"}`
- `mtable.rowSelected` — `{multiplier, product}`
- `digitpanel.pressed` — `{digit}`
- `audio.played` — `{file}` — correct.mp3 / wrong.mp3 / click.mp3 / swoosh.mp3 / confetti.mp3

**Bridge layer only:**
- `bridge.handshake` — `{caller, capabilities}`
- `bridge.disconnected`

### Subscription

```js
// In-page
const off = AppAPI.subscribe(filter, callback);
// filter: { types?:[...], pages?:[...], source?:"ai"|"human"|"system", since?:seq }

// External — postMessage
{ type:"subscribe", requestId:"r1", filter:{ types:["step.advanced","goal.reached"] } }
// → { type:"response", requestId:"r1", ok:true, subscriptionId:"s1" }
// then: { type:"event", subscriptionId:"s1", event:{...} } per match
```

Filtering happens in the bus before crossing the postMessage boundary.

### Transcript ring buffer

```js
AppAPI.transcript({ since: 0, limit: 1000 })
// { events:[...], oldestSeq:0, newestSeq:412, dropped:0 }
```

- Capacity: 2,000 events (~400 KB at ~200 B/event).
- Drops oldest when full; `dropped` counter informs the caller.
- `since` is a sequence number, not a timestamp — survives reset/handshake.
- Cleared on `admin.reset({to:'page1'})`. Not persisted across page reload.

### Sourcing rule

A connected AI sees both its own and a human's moves, distinguished by `source`. Tutor use case subscribes with `{source:"human"}`. Student use case typically subscribes with no filter to also catch animation completions and asynchronous hint changes.

## 5. Bridge envelope (postMessage protocol)

One wire format used by the iframe-host caller and the browser-extension content script. Every message maps 1:1 to an `AppAPI` call or event.

### Handshake

```js
// Caller → applet
{
  v: 1, type: "ai.handshake", requestId: "h1",
  caller:       { name: "claude-code-extension", version: "0.1.0" },
  capabilities: ["actions", "events", "transcript", "admin"]
}

// Applet → caller
{
  v: 1, type: "ai.handshake.ack", requestId: "h1",
  ok: true,
  session:      { id:"sess_a91f", page:1, questionIndex:0, language:"id" },
  capabilities: ["actions", "events", "transcript", "admin"],   // intersection
  schema:       AppAPI.describePage()
}
```

If `?ai=1` was set but no caller speaks, the listener stays quiet. If a caller speaks and `?ai=1` is absent, the handshake gate accepts.

Origin allow-list lives in `APP_CONFIG.AI_ALLOWED_ORIGINS`. Default `["*"]` for offline use; documented as the place to lock down for embed scenarios. Failing origin check returns `{ok:false, error:{code:"E_ORIGIN"}}` and emits no events to that caller.

`admin` capability requires explicit grant in the handshake `capabilities` array; otherwise `admin.*` calls return `E_ADMIN_DENIED`.

### Request / response

```js
// Caller → applet
{ v:1, type:"ai.call", requestId:"r17",
  method:"actions.chooseQuotientDigit", params:{ column:0, value:3 } }

// Applet → caller (success)
{ v:1, type:"ai.response", requestId:"r17",
  ok:true, result:{ /* same rich object actions.chooseQuotientDigit returns */ } }

// Applet → caller (error)
{ v:1, type:"ai.response", requestId:"r17",
  ok:false, error:{ code:"E_DISABLED_ACTION", message:"Not valid in step writePartialProduct",
                    details:{ currentStep:"writePartialProduct",
                              expected:["setPartialProduct","selectMultiplicationTableRow"] } } }
```

Method names are dotted paths into `AppAPI` — `actions.x`, `admin.x`, `snapshot`, `describePage`, `checkGoal`, `transcript`, `subscribe`, `unsubscribe`. Nothing outside that set is reachable.

### Events over the wire

```js
{ v:1, type:"ai.event", subscriptionId:"s1", event:{ /* envelope from §4 */ } }
```

Backpressure: events are queued, never coalesced. If a caller's MessagePort saturates, the applet drops oldest and bumps `dropped` on the next `transcript()` response.

### Error codes (`js/ai/errors.js`)

| code | meaning |
|---|---|
| `E_ORIGIN`             | postMessage origin not in allow-list |
| `E_NO_HANDSHAKE`       | `ai.call` arrived before `ai.handshake` |
| `E_UNKNOWN_METHOD`     | method path not exposed |
| `E_BAD_ARGS`           | args fail schema validation |
| `E_DISABLED_ACTION`    | action not in `expectedActions` for current step |
| `E_NO_SUCH_ELEMENT`    | UI-level call references missing id |
| `E_NOT_INTERACTABLE`   | element exists but is hidden / disabled |
| `E_ADMIN_DENIED`       | admin scope not granted in handshake capabilities |
| `E_INTERNAL`           | uncaught exception inside dispatch (stack in `details` when `AI_ENABLED`) |

### Browser extension

- Content script injects on `index.html` URL pattern, sends handshake from the top frame, uses `window.postMessage` with `targetOrigin: location.origin`.
- Background page bridges content-script ↔ Native Messaging host (or MCP-stdio process), preserving `requestId`s end-to-end.
- Same envelope on both hops — extension is a transparent forwarder.

## 6. `ControlSurface` kernel contract

Every AI-aware component implements one interface. Adapters wire existing components to this contract — no logic is reimplemented, only exposed.

### Interface

```js
// js/ai/control-surface.js
class ControlSurface {
  // Identity — stable across renders
  get id() {}            // e.g. "page2-long-division-grid"
  get kind() {}          // "page" | "grid" | "navigation" | "intro"
  get scope() {}         // { page: 2 }

  // Static description — same shape regardless of state
  getManifest() {
    return {
      semanticActions: [ /* { name, args, description, scope?, enabledIn:[steps] } */ ],
      uiElements:      [ /* { id, role, group?, … } — values filled by getState() */ ],
      goal:            { kind, target },
    };
  }

  // Live state
  getState() {
    return {
      currentStep:     "chooseQuotientDigit",
      stepContext:     { column: 0, activeCellId: "page2-grid-quot-0" },
      expectedActions: ["chooseQuotientDigit","selectMultiplicationTableRow"],
      currentHint:     { i18nKey, params, ui, en },
      uiElementValues: { "page2-grid-quot-0": null, /* sparse: only changed/relevant cells */ },
    };
  }

  checkGoal() { return { reached: false, actual: { quotient:[3,null], remainder:null } }; }

  // Single execution path — both semantic and UI-level land here
  dispatch(action) {
    // action: { kind:"semantic"|"ui", name, args, source:"ai"|"human"|"system", actionId }
    // returns: same shape AppAPI returns
  }

  // Lifecycle — registry calls these
  attach(eventBus) {}
  detach() {}
}
```

### Adapter example

```js
// js/ai/surfaces/long-division-surface.js
class LongDivisionSurface extends ControlSurface {
  constructor(gridInstance, problem) {
    super();
    this.grid    = gridInstance;
    this.problem = problem;
  }

  getManifest() { /* hardcoded list per §3 */ }

  getState() {
    // Reads window.__longDivisionGuidedHint and internal grid cell state via the existing
    // ref/handle pattern. No new state stores invented.
  }

  dispatch(action) {
    switch (action.name) {
      case "chooseQuotientDigit": {
        const { column, value } = action.args;
        // Calls the SAME internal handler the click-on-cell + key-press-on-digit-panel chain calls.
        const internal = this.grid.applyDigit({ row:"quotient", column, value, source: action.source });
        return this._packageResult(internal, action);
      }
      case "selectMultiplicationTableRow": { /* … */ }
      // …
    }
  }
}
```

`dispatch` *must* call existing handlers. If a handler doesn't exist for a behaviour we want to expose, extract it from the click path first as a refactor — never duplicate.

### Registry

```js
// js/ai/registry.js
const surfaces = new Map();
window.AppAPI._registerSurface = (surface) => {
  surfaces.set(surface.id, surface);
  surface.attach(eventBus);
};
window.AppAPI._unregisterSurface = (id) => { /* … */ };
```

Page wiring lives in two adapter files:
- `js/ai/surfaces/page1-surface.js` — intro + start button
- `js/ai/surfaces/page2-surface.js` — composes `LongDivisionSurface`, the next/previous buttons, and the multiplication-table component into one page surface.

`describePage()` is the union of all currently-mounted surfaces' manifests + states for the current page.

### Why this shape

- **Single dispatch entry-point per surface** is what makes events trustworthy: every state change has exactly one place that fires `cell.changed`, `step.advanced`, etc. — so a human click and an AI semantic call produce the same event sequence.
- **Manifest is static; state is live** — the schema is cacheable (the AI's prompt can include the manifest verbatim) while staying truthful about what's currently legal.
- **Surfaces compose** — page 2 is one surface that owns three sub-surfaces. The registry sees only the top-level page surface; sub-surfaces are an internal organisation choice.
- **Future grids opt in by implementing this class** — that's the kernel payoff. Adding `MultiplicationGrid` support is a self-contained change that doesn't touch any other file.

## 7. File layout, boot order, error handling, testing

### New files (all under `js/ai/`)

```
js/ai/
├── app-api.js              ~250 LoC  Public window.AppAPI surface
├── event-bus.js            ~80  LoC  In-process pub/sub + ring buffer
├── control-surface.js      ~60  LoC  Base class + JSDoc contract
├── registry.js             ~50  LoC  Surface registry + describePage() composition
├── errors.js               ~30  LoC  Error code constants + AppApiError class
├── i18n-payload.js         ~40  LoC  buildLocalizedPayload({key, params}) → {ui, en, i18nKey, params}
├── bridge.js               ~200 LoC  postMessage adapter
└── surfaces/
    ├── page1-surface.js          ~120 LoC
    ├── page2-surface.js          ~80  LoC  composer
    ├── long-division-surface.js  ~350 LoC
    ├── nav-surface.js            ~80  LoC  Next/Previous buttons across pages
    └── mtable-surface.js         ~100 LoC  multiplication table sub-surface
```

Total: ~1,440 LoC of new code, all under one removable directory.

### Modified existing files

| File | Change | Lines touched |
|---|---|---|
| `index.html` | Add `APP_CONFIG.AI_ENABLED` (URL-flag detection) and `APP_CONFIG.AI_ALLOWED_ORIGINS`; add 8 new `<script>` tags after `math-applet.js` | ~15 |
| `js/components/long-division-grid-component.js` | Extract a single `applyDigit({row,column,value,source})` from the click + keypress paths; expose component instance via existing ref pattern. No behaviour change. | ~40 |
| `js/PageConfig.js` | After page 1/2 element arrays are built, register their surfaces with the registry. | ~15 |

No edits to `math-applet.js`, no edits to any other component, no CSS edits.

### Boot order

```
index.html loads (existing order preserved):
  1. anime.min.js
  2. react / react-dom
  3. data.js, constants.js
  4. APP_CONFIG block — extended with:
       AI_ENABLED:         (location.search.includes('ai=1'))
       AI_ALLOWED_ORIGINS: ["*"]
  5. existing component scripts (unchanged)
  6. math-applet.js (unchanged)
─────────────── new: AI scaffolding ────────────────
  7. js/ai/errors.js
  8. js/ai/event-bus.js
  9. js/ai/control-surface.js
 10. js/ai/registry.js
 11. js/ai/i18n-payload.js
 12. js/ai/surfaces/*.js
 13. js/ai/app-api.js          // assigns window.AppAPI
 14. js/ai/bridge.js           // installs handshake listener IF AI_ENABLED || handshake received
```

None of the new modules execute side effects at parse time except `bridge.js`, which gates itself on `APP_CONFIG.AI_ENABLED || awaiting-handshake`.

### Surface lifecycle

Surfaces are registered on `pageChanged` (the existing window event). When the user lands on page 2, `page2-surface.js`'s factory runs, finds the mounted `LongDivisionGrid` via its component handle, and registers a `LongDivisionSurface`. On leaving page 2, `_unregisterSurface` is called and the surface's `detach()` releases internal callbacks. `AppAPI.describePage()` always reflects the current page only.

### Error handling

- All public `AppAPI` methods are wrapped in a single `safeCall` that catches, logs, and returns `{ok:false, error:{code, message}}` — never throws over the postMessage boundary.
- Internal handler crashes are caught and reported as `E_INTERNAL` with the original stack in `details` (only when `AI_ENABLED`).
- Bridge layer sanitises before sending: `error.details.stack` stripped if origin allow-list is `"*"`.
- A failed `dispatch` never partially mutates state — surfaces inherit the existing handlers' atomicity ("the click handler runs to completion or doesn't fire").

### Testing strategy

| Layer | Method | Coverage |
|---|---|---|
| **Surfaces** | Plain Node unit tests with a stub `eventBus` and stub component handles | Manifest correctness, dispatch routing, validation, goal-checking |
| **Core API** | jsdom + the real React app, no bridge | `describePage()` shape, action sequencing, transcript ordering, event correlation |
| **Bridge** | jsdom + a fake parent window posting messages | Handshake, capability gating, error codes, event fanout, backpressure |

Browser-extension scenario (Q8 path B): a Playwright-driven smoke test loads the applet with the extension, confirms the handshake completes, and walks 96÷3 to completion. Not a full eval suite — enough to catch regressions in the wire format.

No infrastructure to set up: jsdom + a simple `package.json` test script. The applet remains a static-file load; tests run alongside.

## 8. Open questions for the implementation phase

These were intentionally deferred from brainstorming and need to be settled when writing the implementation plan:

1. **Browser-extension form factor** — separate package? Lives where in the repo? MV3 manifest details?
2. **Native messaging vs MCP-stdio** for the extension's outer hop — depends on which AI runtime is the primary target.
3. **`applyDigit` refactor inside `long-division-grid-component.js`** — exact factoring of the click + keypress paths into one entrypoint without changing observable behaviour. Needs a reading pass.
4. **Test runner** — jsdom is the obvious choice; pin to a specific runner (`vitest`, `node --test`, `jest`?) when we lay out `package.json`.
5. **Versioning of the wire envelope** — `v:1` placeholder; when do we bump?
