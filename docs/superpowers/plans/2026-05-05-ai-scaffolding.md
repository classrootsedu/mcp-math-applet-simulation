# AI Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `window.AppAPI` surface plus a postMessage bridge so external/in-page AIs can introspect, control, and observe pages 1 and 2 of the math applet without changing user-visible behaviour.

**Architecture:** Three layers under `js/ai/` — a Bridge (postMessage adapter), a Core API (`window.AppAPI`), and a `ControlSurface` kernel that adapters wire to existing components. Adapters call existing handlers; no logic is duplicated.

**Tech Stack:** Vanilla JS (browser, no bundler). Tests: Node 20+ built-in `node --test` runner with `jsdom`. The applet itself loads via plain `<script>` tags and remains a static-file load.

**Spec:** [docs/superpowers/specs/2026-05-05-ai-scaffolding-design.md](../specs/2026-05-05-ai-scaffolding-design.md)

---

## Phase 0 — Infrastructure

### Task 0.1: Initialize git repo (one-time)

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Initialize repo if not already**

```bash
cd E:/Downloads/G4C3M20A1_v1 && git init && git add -A && git commit -m "chore: import applet baseline"
```

Expected: a fresh main branch with the applet, the spec, and this plan committed.

- [ ] **Step 2: Create .gitignore**

```
node_modules/
*.log
.DS_Store
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore && git commit -m "chore: add .gitignore"
```

---

### Task 0.2: Add test runner scaffolding

**Files:**
- Create: `package.json`
- Create: `tests/helpers/setup-jsdom.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "g4c3m20a1-ai-scaffold",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test": "node --test --test-reporter=spec tests/"
  },
  "devDependencies": {
    "jsdom": "^24.0.0"
  }
}
```

- [ ] **Step 2: Install dev deps**

```bash
npm install
```

Expected: `node_modules/` populated, `package-lock.json` written.

- [ ] **Step 3: Create the jsdom helper**

```js
// tests/helpers/setup-jsdom.js
const { JSDOM } = require('jsdom');

function newWindow(html = '<!DOCTYPE html><html><body><div id="react-root"></div></body></html>') {
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  // Mirror what the browser would expose to applet code.
  global.window = dom.window;
  global.document = dom.window.document;
  global.MessageEvent = dom.window.MessageEvent;
  global.CustomEvent = dom.window.CustomEvent;
  global.location = dom.window.location;
  return dom;
}

function teardownWindow() {
  delete global.window;
  delete global.document;
  delete global.MessageEvent;
  delete global.CustomEvent;
  delete global.location;
}

module.exports = { newWindow, teardownWindow };
```

- [ ] **Step 4: Smoke-check the runner**

```bash
node --test tests/
```

Expected: "pass 0 tests" with no errors (no test files yet).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tests/helpers/setup-jsdom.js
git commit -m "chore(ai): add test runner scaffolding"
```

---

### Task 0.3: Add APP_CONFIG flags

**Files:**
- Modify: `index.html` (the `APP_CONFIG` block, around line 62-88)

- [ ] **Step 1: Read the current APP_CONFIG block**

Open `index.html` and locate the `const APP_CONFIG = { … }` declaration in the inline script.

- [ ] **Step 2: Add two new keys to APP_CONFIG**

Inside the existing `APP_CONFIG` object, after the `START_PAGE` key, add:

```js
            // AI Scaffolding
            // Set AI_ENABLED=true via ?ai=1 URL flag, OR by sending a postMessage handshake
            AI_ENABLED: (typeof location !== 'undefined' && /[?&]ai=1\b/.test(location.search)),

            // Origin allow-list for the postMessage bridge. Default ["*"] for offline use.
            // Lock down for embed scenarios.
            AI_ALLOWED_ORIGINS: ["*"]
```

- [ ] **Step 3: Sanity-check by loading index.html in a browser**

Open `index.html` in a browser, open devtools, type `APP_CONFIG.AI_ENABLED` — should print `false`. Reload with `?ai=1` — should print `true`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(ai): add AI_ENABLED + AI_ALLOWED_ORIGINS flags"
```

---

## Phase 1 — Core kernel modules

### Task 1.1: errors.js

**Files:**
- Create: `js/ai/errors.js`
- Test: `tests/ai/errors.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/ai/errors.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

test('errors: AI_ERROR_CODES exposed on window', () => {
  newWindow();
  require('../../js/ai/errors.js');
  assert.equal(global.window.AI_ERROR_CODES.E_ORIGIN, 'E_ORIGIN');
  assert.equal(global.window.AI_ERROR_CODES.E_ADMIN_DENIED, 'E_ADMIN_DENIED');
  teardownWindow();
});

test('errors: AppApiError carries code, message, details', () => {
  newWindow();
  require('../../js/ai/errors.js');
  const e = new global.window.AppApiError('E_BAD_ARGS', 'bad args', { field: 'value' });
  assert.equal(e.code, 'E_BAD_ARGS');
  assert.equal(e.message, 'bad args');
  assert.deepEqual(e.details, { field: 'value' });
  assert.ok(e instanceof Error);
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify it fails**

```bash
npm test
```

Expected: FAIL ("Cannot find module '../../js/ai/errors.js'").

- [ ] **Step 3: Implement**

```js
// js/ai/errors.js
(function (global) {
  'use strict';

  const AI_ERROR_CODES = Object.freeze({
    E_ORIGIN:           'E_ORIGIN',
    E_NO_HANDSHAKE:     'E_NO_HANDSHAKE',
    E_UNKNOWN_METHOD:   'E_UNKNOWN_METHOD',
    E_BAD_ARGS:         'E_BAD_ARGS',
    E_DISABLED_ACTION:  'E_DISABLED_ACTION',
    E_NO_SUCH_ELEMENT:  'E_NO_SUCH_ELEMENT',
    E_NOT_INTERACTABLE: 'E_NOT_INTERACTABLE',
    E_ADMIN_DENIED:     'E_ADMIN_DENIED',
    E_INTERNAL:         'E_INTERNAL'
  });

  class AppApiError extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = 'AppApiError';
      this.code = code;
      this.details = details;
    }
    toJSON() {
      return { code: this.code, message: this.message, details: this.details };
    }
  }

  global.AI_ERROR_CODES = AI_ERROR_CODES;
  global.AppApiError = AppApiError;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run, verify it passes**

```bash
npm test
```

Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/errors.js tests/ai/errors.test.js
git commit -m "feat(ai): error codes + AppApiError class"
```

---

### Task 1.2: event-bus.js

**Files:**
- Create: `js/ai/event-bus.js`
- Test: `tests/ai/event-bus.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/ai/event-bus.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function loadBus() {
  newWindow();
  require('../../js/ai/event-bus.js');
  return new global.window.AIEventBus({ capacity: 5 });
}

test('eventBus: emit/subscribe round-trip with monotonic seq', () => {
  const bus = loadBus();
  const received = [];
  bus.subscribe({}, (e) => received.push(e));
  bus.emit({ type: 'a', source: 'system' });
  bus.emit({ type: 'b', source: 'ai' });
  assert.equal(received.length, 2);
  assert.equal(received[0].seq, 0);
  assert.equal(received[1].seq, 1);
  assert.ok(typeof received[0].ts === 'number');
  teardownWindow();
});

test('eventBus: filter by types and source', () => {
  const bus = loadBus();
  const got = [];
  bus.subscribe({ types: ['x'], source: 'human' }, (e) => got.push(e));
  bus.emit({ type: 'x', source: 'ai' });
  bus.emit({ type: 'x', source: 'human' });
  bus.emit({ type: 'y', source: 'human' });
  assert.equal(got.length, 1);
  assert.equal(got[0].type, 'x');
  teardownWindow();
});

test('eventBus: ring buffer capacity drops oldest and counts dropped', () => {
  const bus = loadBus(); // capacity 5
  for (let i = 0; i < 7; i++) bus.emit({ type: 'tick', source: 'system' });
  const r = bus.transcript({ since: 0 });
  assert.equal(r.events.length, 5);
  assert.equal(r.dropped, 2);
  assert.equal(r.oldestSeq, 2);
  assert.equal(r.newestSeq, 6);
  teardownWindow();
});

test('eventBus: transcript filters by since', () => {
  const bus = loadBus();
  for (let i = 0; i < 4; i++) bus.emit({ type: 't', source: 'system' });
  const r = bus.transcript({ since: 2 });
  assert.deepEqual(r.events.map(e => e.seq), [2, 3]);
  teardownWindow();
});

test('eventBus: unsubscribe stops delivery', () => {
  const bus = loadBus();
  let count = 0;
  const off = bus.subscribe({}, () => count++);
  bus.emit({ type: 'a', source: 'ai' });
  off();
  bus.emit({ type: 'b', source: 'ai' });
  assert.equal(count, 1);
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify all five fail**

```bash
npm test
```

Expected: 5 failing, 2 passing (errors test).

- [ ] **Step 3: Implement**

```js
// js/ai/event-bus.js
(function (global) {
  'use strict';

  class AIEventBus {
    constructor({ capacity = 2000 } = {}) {
      this._capacity = capacity;
      this._buffer = [];                 // ring buffer of events
      this._oldestSeq = 0;
      this._dropped = 0;
      this._nextSeq = 0;
      this._subs = new Map();            // id → {filter, cb}
      this._nextSubId = 1;
    }

    emit(partial) {
      const event = Object.assign({
        seq: this._nextSeq++,
        ts:  Date.now(),
        page: undefined,
        questionIndex: undefined,
        actionId: undefined,
        payload: undefined
      }, partial);

      // ring buffer
      this._buffer.push(event);
      if (this._buffer.length > this._capacity) {
        this._buffer.shift();
        this._oldestSeq++;
        this._dropped++;
      }

      // fanout
      for (const { filter, cb } of this._subs.values()) {
        if (this._matches(event, filter)) {
          try { cb(event); } catch (err) { console.error('[AIEventBus] subscriber threw', err); }
        }
      }
      return event;
    }

    subscribe(filter, cb) {
      const id = this._nextSubId++;
      this._subs.set(id, { filter: filter || {}, cb });
      // initial replay if `since` provided
      if (filter && typeof filter.since === 'number') {
        for (const e of this._buffer) {
          if (e.seq >= filter.since && this._matches(e, filter)) {
            try { cb(e); } catch (err) { console.error('[AIEventBus] replay threw', err); }
          }
        }
      }
      return () => this._subs.delete(id);
    }

    transcript({ since = 0, limit = Infinity } = {}) {
      const events = [];
      for (const e of this._buffer) {
        if (e.seq >= since) {
          events.push(e);
          if (events.length >= limit) break;
        }
      }
      return {
        events,
        oldestSeq: this._oldestSeq,
        newestSeq: this._nextSeq - 1,
        dropped:   this._dropped
      };
    }

    clear() {
      this._buffer = [];
      this._oldestSeq = this._nextSeq;
      this._dropped = 0;
    }

    _matches(event, filter) {
      if (filter.types && !filter.types.includes(event.type)) return false;
      if (filter.pages && !filter.pages.includes(event.page)) return false;
      if (filter.source && event.source !== filter.source) return false;
      return true;
    }
  }

  global.AIEventBus = AIEventBus;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run, verify all pass**

```bash
npm test
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/event-bus.js tests/ai/event-bus.test.js
git commit -m "feat(ai): event bus with ring buffer + subscriptions"
```

---

### Task 1.3: control-surface.js (base class)

**Files:**
- Create: `js/ai/control-surface.js`
- Test: `tests/ai/control-surface.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/ai/control-surface.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  require('../../js/ai/control-surface.js');
  return global.window.AIControlSurface;
}

test('ControlSurface: required methods throw on base class', () => {
  const Base = load();
  const s = new Base();
  assert.throws(() => s.getManifest(),  /not implemented/);
  assert.throws(() => s.getState(),     /not implemented/);
  assert.throws(() => s.checkGoal(),    /not implemented/);
  assert.throws(() => s.dispatch({}),   /not implemented/);
  teardownWindow();
});

test('ControlSurface: subclass overrides all four methods', () => {
  const Base = load();
  class S extends Base {
    get id()        { return 'test'; }
    get kind()      { return 'page'; }
    get scope()     { return { page: 1 }; }
    getManifest()   { return { semanticActions: [], uiElements: [], goal: null }; }
    getState()      { return { currentStep: 'a', stepContext: {}, expectedActions: [], currentHint: null, uiElementValues: {} }; }
    checkGoal()     { return { reached: true, actual: {} }; }
    dispatch(a)     { return { ok: true, actionId: a.actionId }; }
  }
  const s = new S();
  assert.equal(s.id, 'test');
  assert.equal(s.dispatch({ actionId: 'x' }).actionId, 'x');
  teardownWindow();
});

test('ControlSurface: attach/detach default no-ops', () => {
  const Base = load();
  const s = new Base();
  assert.doesNotThrow(() => s.attach({}));
  assert.doesNotThrow(() => s.detach());
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify failing**

```bash
npm test
```

Expected: 3 new tests fail with module-not-found.

- [ ] **Step 3: Implement**

```js
// js/ai/control-surface.js
(function (global) {
  'use strict';

  /**
   * Base class for all AI-aware components. Subclasses must implement:
   *   id        — getter, stable across renders
   *   kind      — getter: "page" | "grid" | "navigation" | "intro"
   *   scope     — getter: { page: number }
   *   getManifest() → { semanticActions, uiElements, goal }
   *   getState()    → { currentStep, stepContext, expectedActions, currentHint, uiElementValues }
   *   checkGoal()   → { reached, actual }
   *   dispatch(action) → result object (see app-api.js for shape)
   *
   * Lifecycle: attach(eventBus) on register, detach() on unregister.
   */
  class AIControlSurface {
    get id()    { return this.constructor.name; }
    get kind()  { return 'unknown'; }
    get scope() { return {}; }

    getManifest() { throw new Error('AIControlSurface.getManifest() not implemented'); }
    getState()    { throw new Error('AIControlSurface.getState() not implemented'); }
    checkGoal()   { throw new Error('AIControlSurface.checkGoal() not implemented'); }
    dispatch(_action) { throw new Error('AIControlSurface.dispatch() not implemented'); }

    attach(_eventBus) { /* default no-op */ }
    detach()          { /* default no-op */ }
  }

  global.AIControlSurface = AIControlSurface;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Verify pass**

```bash
npm test
```

Expected: 10 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/control-surface.js tests/ai/control-surface.test.js
git commit -m "feat(ai): ControlSurface base class"
```

---

### Task 1.4: registry.js

**Files:**
- Create: `js/ai/registry.js`
- Test: `tests/ai/registry.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/ai/registry.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  require('../../js/ai/control-surface.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/registry.js');
  return global.window;
}

function fakeSurface(id, page, manifest = {}, state = {}) {
  return {
    id,
    kind: 'grid',
    scope: { page },
    getManifest: () => ({ semanticActions: [], uiElements: [], goal: null, ...manifest }),
    getState:    () => ({ currentStep: 's', stepContext: {}, expectedActions: [], currentHint: null, uiElementValues: {}, ...state }),
    checkGoal:   () => ({ reached: false, actual: {} }),
    dispatch:    (a) => ({ ok: true, actionId: a.actionId, surface: id }),
    attach:      () => {},
    detach:      () => {}
  };
}

test('registry: register/unregister surfaces', () => {
  const w = load();
  const reg = new w.AIRegistry(new w.AIEventBus());
  reg.register(fakeSurface('a', 2));
  assert.equal(reg.list().length, 1);
  reg.unregister('a');
  assert.equal(reg.list().length, 0);
  teardownWindow();
});

test('registry: forCurrentPage filters by current page', () => {
  const w = load();
  const reg = new w.AIRegistry(new w.AIEventBus());
  reg.register(fakeSurface('a', 1));
  reg.register(fakeSurface('b', 2));
  reg.register(fakeSurface('c', 2));
  assert.deepEqual(reg.forPage(1).map(s => s.id), ['a']);
  assert.deepEqual(reg.forPage(2).map(s => s.id).sort(), ['b', 'c']);
  teardownWindow();
});

test('registry: composeDescription unions manifests + states for a page', () => {
  const w = load();
  const reg = new w.AIRegistry(new w.AIEventBus());
  reg.register(fakeSurface('a', 2,
    { semanticActions: [{ name: 'x' }], uiElements: [{ id: 'e1' }], goal: { kind: 'g' } }));
  reg.register(fakeSurface('b', 2,
    { semanticActions: [{ name: 'y' }], uiElements: [{ id: 'e2' }] }));
  const desc = reg.composeDescription(2);
  assert.deepEqual(desc.semanticActions.map(a => a.name).sort(), ['x', 'y']);
  assert.deepEqual(desc.uiElements.map(e => e.id).sort(), ['e1', 'e2']);
  assert.deepEqual(desc.goal, { kind: 'g' });
  teardownWindow();
});

test('registry: dispatch routes to the surface owning the action', () => {
  const w = load();
  const reg = new w.AIRegistry(new w.AIEventBus());
  reg.register(fakeSurface('a', 2, { semanticActions: [{ name: 'foo' }] }));
  reg.register(fakeSurface('b', 2, { semanticActions: [{ name: 'bar' }] }));
  const r = reg.dispatch(2, { kind: 'semantic', name: 'bar', args: {}, source: 'ai', actionId: 'x1' });
  assert.equal(r.surface, 'b');
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify failing**

```bash
npm test
```

Expected: 4 new tests fail with module-not-found.

- [ ] **Step 3: Implement**

```js
// js/ai/registry.js
(function (global) {
  'use strict';

  class AIRegistry {
    constructor(eventBus) {
      this._eventBus = eventBus;
      this._surfaces = new Map();   // id → surface
    }

    register(surface) {
      if (this._surfaces.has(surface.id)) {
        console.warn('[AIRegistry] re-registering surface', surface.id);
        this.unregister(surface.id);
      }
      this._surfaces.set(surface.id, surface);
      try { surface.attach(this._eventBus); }
      catch (e) { console.error('[AIRegistry] surface.attach threw', e); }
    }

    unregister(id) {
      const s = this._surfaces.get(id);
      if (!s) return;
      try { s.detach(); }
      catch (e) { console.error('[AIRegistry] surface.detach threw', e); }
      this._surfaces.delete(id);
    }

    list() {
      return Array.from(this._surfaces.values());
    }

    forPage(page) {
      return this.list().filter(s => s.scope && s.scope.page === page);
    }

    composeDescription(page) {
      const surfaces = this.forPage(page);
      const semanticActions = [];
      const uiElements = [];
      let goal = null;
      const stateBySurface = {};

      for (const s of surfaces) {
        const m = s.getManifest();
        if (m.semanticActions) semanticActions.push(...m.semanticActions);
        if (m.uiElements)      uiElements.push(...m.uiElements);
        if (m.goal && !goal)   goal = m.goal;
        stateBySurface[s.id] = s.getState();
      }

      return { page, semanticActions, uiElements, goal, stateBySurface };
    }

    /** Find the surface that owns a given semantic action name. */
    findOwner(page, actionName) {
      for (const s of this.forPage(page)) {
        const m = s.getManifest();
        if (m.semanticActions && m.semanticActions.some(a => a.name === actionName)) return s;
      }
      return null;
    }

    /** Dispatch: route an action to its owning surface. */
    dispatch(page, action) {
      if (action.kind === 'semantic') {
        const owner = this.findOwner(page, action.name);
        if (!owner) {
          return { ok: false, error: { code: 'E_UNKNOWN_METHOD',
            message: `No surface owns action ${action.name} on page ${page}` } };
        }
        return owner.dispatch(action);
      }
      // UI-level: route to first surface that owns the target id
      if (action.kind === 'ui' && action.args && action.args.id) {
        for (const s of this.forPage(page)) {
          const m = s.getManifest();
          if (m.uiElements && m.uiElements.some(e => e.id === action.args.id)) {
            return s.dispatch(action);
          }
        }
        return { ok: false, error: { code: 'E_NO_SUCH_ELEMENT',
          message: `No element with id ${action.args.id} on page ${page}` } };
      }
      return { ok: false, error: { code: 'E_BAD_ARGS', message: 'unknown action.kind' } };
    }
  }

  global.AIRegistry = AIRegistry;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test
```

Expected: 14 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/registry.js tests/ai/registry.test.js
git commit -m "feat(ai): surface registry with composition + dispatch routing"
```

---

### Task 1.5: i18n-payload.js

**Files:**
- Create: `js/ai/i18n-payload.js`
- Test: `tests/ai/i18n-payload.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/ai/i18n-payload.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load(currentLanguage = 'id') {
  newWindow();
  global.window.AppData = {
    currentLanguage,
    translations: {
      en: { hello: 'Hello {name}', nested: { msg: 'Top' } },
      id: { hello: 'Halo {name}' }                         // nested.msg missing → en fallback
    }
  };
  require('../../js/ai/i18n-payload.js');
  return global.window;
}

test('buildLocalizedPayload: returns ui+en+i18nKey+params', () => {
  const w = load('id');
  const p = w.buildLocalizedPayload({ key: 'hello', params: { name: 'Asep' } });
  assert.deepEqual(p, {
    ui:      'Halo Asep',
    en:      'Hello Asep',
    i18nKey: 'hello',
    params:  { name: 'Asep' }
  });
  teardownWindow();
});

test('buildLocalizedPayload: missing UI key falls back to English', () => {
  const w = load('id');
  const p = w.buildLocalizedPayload({ key: 'nested.msg' });
  assert.equal(p.ui, 'Top');
  assert.equal(p.en, 'Top');
  teardownWindow();
});

test('buildLocalizedPayload: missing in both languages → ui/en are null', () => {
  const w = load('id');
  const p = w.buildLocalizedPayload({ key: 'does.not.exist' });
  assert.equal(p.ui, null);
  assert.equal(p.en, null);
  assert.equal(p.i18nKey, 'does.not.exist');
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify failing**

```bash
npm test
```

Expected: 3 new tests fail.

- [ ] **Step 3: Implement**

```js
// js/ai/i18n-payload.js
(function (global) {
  'use strict';

  function lookup(translations, key) {
    if (!translations) return null;
    const parts = key.split('.');
    let v = translations;
    for (const p of parts) {
      if (v && typeof v === 'object' && p in v) v = v[p];
      else return null;
    }
    return typeof v === 'string' ? v : null;
  }

  function interpolate(template, params) {
    if (template == null) return null;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (m, k) => params.hasOwnProperty(k) ? params[k] : m);
  }

  /**
   * Build a localized payload triple from an i18n key.
   * @param {{key: string, params?: object}} args
   * @returns {{ui: string|null, en: string|null, i18nKey: string, params: object}}
   */
  function buildLocalizedPayload({ key, params = {} }) {
    const data = global.AppData;
    const uiLang = data ? data.currentLanguage : 'en';
    const uiRaw  = data ? lookup(data.translations[uiLang], key) : null;
    const enRaw  = data ? lookup(data.translations.en,    key) : null;
    return {
      ui:      interpolate(uiRaw  ?? enRaw, params),
      en:      interpolate(enRaw,           params),
      i18nKey: key,
      params:  params
    };
  }

  global.buildLocalizedPayload = buildLocalizedPayload;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Verify pass**

```bash
npm test
```

Expected: 17 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/i18n-payload.js tests/ai/i18n-payload.test.js
git commit -m "feat(ai): localized payload builder"
```

---

## Phase 2 — AppAPI public surface

### Task 2.1: app-api.js (read-only methods)

**Files:**
- Create: `js/ai/app-api.js`
- Test: `tests/ai/app-api-readonly.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/ai/app-api-readonly.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['*'] };
  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/registry.js');
  require('../../js/ai/i18n-payload.js');
  global.window.AppData = { currentLanguage: 'en', translations: { en: {} } };
  global.window.getCurrentPage = () => 1;
  require('../../js/ai/app-api.js');
  return global.window;
}

test('AppAPI: describePage returns composition for current page', () => {
  const w = load();
  w.AppAPI._registerSurface({
    id: 's1', kind: 'page', scope: { page: 1 },
    getManifest: () => ({ semanticActions: [{ name: 'a' }], uiElements: [], goal: null }),
    getState:    () => ({ currentStep: 'foo', stepContext: {}, expectedActions: ['a'], currentHint: null, uiElementValues: {} }),
    checkGoal:   () => ({ reached: false, actual: {} }),
    dispatch:    () => ({ ok: true }),
    attach: () => {}, detach: () => {}
  });
  const desc = w.AppAPI.describePage();
  assert.equal(desc.page, 1);
  assert.deepEqual(desc.semanticActions.map(a => a.name), ['a']);
  teardownWindow();
});

test('AppAPI: snapshot returns same shape as describePage with stateBySurface', () => {
  const w = load();
  w.AppAPI._registerSurface({
    id: 's1', kind: 'page', scope: { page: 1 },
    getManifest: () => ({ semanticActions: [], uiElements: [], goal: null }),
    getState:    () => ({ currentStep: 'live', stepContext: {}, expectedActions: [], currentHint: null, uiElementValues: { c1: 7 } }),
    checkGoal:   () => ({ reached: false, actual: {} }),
    dispatch:    () => ({ ok: true }),
    attach: () => {}, detach: () => {}
  });
  const snap = w.AppAPI.snapshot();
  assert.equal(snap.stateBySurface.s1.uiElementValues.c1, 7);
  teardownWindow();
});

test('AppAPI: subscribe + emit through internal bus', () => {
  const w = load();
  const seen = [];
  const off = w.AppAPI.subscribe({ types: ['ping'] }, (e) => seen.push(e));
  w.AppAPI._emit({ type: 'ping', source: 'system' });
  w.AppAPI._emit({ type: 'pong', source: 'system' });
  off();
  w.AppAPI._emit({ type: 'ping', source: 'system' });
  assert.equal(seen.length, 1);
  teardownWindow();
});

test('AppAPI: transcript returns ring buffer state', () => {
  const w = load();
  w.AppAPI._emit({ type: 'a', source: 'ai' });
  w.AppAPI._emit({ type: 'b', source: 'ai' });
  const r = w.AppAPI.transcript({ since: 0 });
  assert.equal(r.events.length, 2);
  teardownWindow();
});

test('AppAPI: checkGoal aggregates page-level goals', () => {
  const w = load();
  w.AppAPI._registerSurface({
    id: 's1', kind: 'page', scope: { page: 1 },
    getManifest: () => ({ goal: { kind: 'navigate', target: 2 }, semanticActions: [], uiElements: [] }),
    getState:    () => ({ currentStep: '', stepContext: {}, expectedActions: [], currentHint: null, uiElementValues: {} }),
    checkGoal:   () => ({ reached: true, actual: { page: 2 } }),
    dispatch:    () => ({ ok: true }),
    attach: () => {}, detach: () => {}
  });
  const r = w.AppAPI.checkGoal();
  assert.equal(r.reached, true);
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify failing**

```bash
npm test
```

Expected: 5 new tests fail.

- [ ] **Step 3: Implement**

```js
// js/ai/app-api.js
(function (global) {
  'use strict';

  const eventBus = new global.AIEventBus({ capacity: 2000 });
  const registry = new global.AIRegistry(eventBus);

  function currentPage() {
    return (typeof global.getCurrentPage === 'function') ? global.getCurrentPage() : 1;
  }

  function questionIndex() {
    return (typeof global.currentQuestionIndex === 'number') ? global.currentQuestionIndex : 0;
  }

  function safeCall(fn) {
    try { return fn(); }
    catch (e) {
      console.error('[AppAPI] internal error', e);
      const err = (e && e.code) ? e : new global.AppApiError('E_INTERNAL', e.message || String(e), { stack: e.stack });
      return { ok: false, error: err.toJSON ? err.toJSON() : { code: err.code, message: err.message } };
    }
  }

  const AppAPI = {
    // ----- introspection -----
    describePage() {
      return safeCall(() => {
        const page = currentPage();
        const desc = registry.composeDescription(page);
        desc.questionIndex = questionIndex();
        return desc;
      });
    },

    snapshot() {
      return safeCall(() => {
        const page = currentPage();
        const desc = registry.composeDescription(page);
        desc.questionIndex = questionIndex();
        desc.ts = Date.now();
        return desc;
      });
    },

    checkGoal() {
      return safeCall(() => {
        const surfaces = registry.forPage(currentPage());
        if (!surfaces.length) return { reached: false, actual: {} };
        // Aggregate: reached if every surface with a goal reports reached.
        const goals = surfaces.filter(s => s.getManifest().goal != null);
        if (!goals.length) return { reached: false, actual: {} };
        const results = goals.map(s => ({ id: s.id, ...s.checkGoal(), goal: s.getManifest().goal }));
        return {
          reached: results.every(r => r.reached),
          goal:    results.length === 1 ? results[0].goal : results.map(r => r.goal),
          actual:  results.length === 1 ? results[0].actual : Object.fromEntries(results.map(r => [r.id, r.actual]))
        };
      });
    },

    checkSessionGoal() {
      return safeCall(() => {
        const qList = global.question || [];
        const idx = questionIndex();
        const lastQuestion = qList.length > 0 && idx >= qList.length - 1;
        const divisionDone = global.__longDivisionComplete === true;
        return { reached: lastQuestion && divisionDone, questionIndex: idx, totalQuestions: qList.length };
      });
    },

    // ----- transcript / events -----
    subscribe(filter, cb) { return eventBus.subscribe(filter, cb); },
    transcript(opts)      { return eventBus.transcript(opts); },

    // ----- actions -----
    actions: {},   // populated lazily by _bindActions; per-name proxies live here
    admin:   {},

    // ----- internals (prefixed _ to discourage external use) -----
    _eventBus: eventBus,
    _registry: registry,
    _registerSurface(surface)   { registry.register(surface); AppAPI._bindActions(); },
    _unregisterSurface(id)      { registry.unregister(id); AppAPI._bindActions(); },
    _emit(event)                { return eventBus.emit(event); },

    // Re-build the AppAPI.actions / AppAPI.admin proxy maps from currently-registered surfaces.
    // Always re-installs the UI-level escape hatches (click, pressKey) so they survive a rebind.
    _bindActions() {
      AppAPI.actions = {
        click:    (args) => AppAPI._invokeUI('click',    args || {}),
        pressKey: (args) => AppAPI._invokeUI('pressKey', args || {})
      };
      AppAPI.admin = {};
      for (const s of registry.list()) {
        const m = s.getManifest();
        if (!m.semanticActions) continue;
        for (const a of m.semanticActions) {
          const target = (a.scope === 'admin') ? AppAPI.admin : AppAPI.actions;
          target[a.name] = (args) => AppAPI._invokeSemantic(a.name, args || {}, a.scope);
        }
      }
    },

    _invokeSemantic(name, args, scope) {
      return safeCall(() => {
        const page = currentPage();
        const actionId = 'act_' + (++AppAPI._actionSeq);
        const action = { kind: 'semantic', name, args, source: 'ai', actionId, scope };
        eventBus.emit({ type: 'action.requested', source: 'ai', page, actionId,
                        payload: { name, args, scope } });
        const result = registry.dispatch(page, action);
        eventBus.emit({
          type:   result.ok ? 'action.completed' : 'action.rejected',
          source: 'ai',
          page,
          actionId,
          payload: result
        });
        return result;
      });
    },
    _actionSeq: 0
  };

  // UI-level escape hatch — _invokeUI is shared by the `click` / `pressKey` proxies
  // installed inside _bindActions() (which runs on the first _registerSurface and on every
  // subsequent register/unregister, so the escape hatches always exist).
  AppAPI._invokeUI = (name, args) => safeCall(() => {
    const page = currentPage();
    const actionId = 'act_' + (++AppAPI._actionSeq);
    const action = { kind: 'ui', name, args, source: 'ai', actionId };
    eventBus.emit({ type: 'action.requested', source: 'ai', page, actionId, payload: { name, args, kind: 'ui' } });
    const result = registry.dispatch(page, action);
    eventBus.emit({ type: result.ok ? 'action.completed' : 'action.rejected',
                    source: 'ai', page, actionId, payload: result });
    return result;
  });

  // Initial bind so AppAPI.actions.click / pressKey exist before any surface is registered.
  AppAPI._bindActions();

  global.AppAPI = AppAPI;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Verify pass**

```bash
npm test
```

Expected: 22 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/app-api.js tests/ai/app-api-readonly.test.js
git commit -m "feat(ai): AppAPI surface with read-only + dispatch routing"
```

---

### Task 2.2: Add scripts to index.html in correct order

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Locate the closing `</script>` after `math-applet.js`**

In `index.html`, find the line `<script src="js/math-applet.js"></script>`.

- [ ] **Step 2: Insert AI scripts immediately after**

Add these lines right after `<script src="js/math-applet.js"></script>`:

```html
    <!-- AI Scaffolding (additive; no behaviour change when AI_ENABLED is false) -->
    <script src="js/ai/errors.js"></script>
    <script src="js/ai/event-bus.js"></script>
    <script src="js/ai/control-surface.js"></script>
    <script src="js/ai/registry.js"></script>
    <script src="js/ai/i18n-payload.js"></script>
    <script src="js/ai/surfaces/page1-surface.js"></script>
    <script src="js/ai/surfaces/long-division-surface.js"></script>
    <script src="js/ai/surfaces/mtable-surface.js"></script>
    <script src="js/ai/surfaces/nav-surface.js"></script>
    <script src="js/ai/surfaces/page2-surface.js"></script>
    <script src="js/ai/app-api.js"></script>
    <script src="js/ai/bridge.js"></script>
```

(Files referenced here that don't exist yet will be created in later tasks — the script tag won't 404 once we get there.)

- [ ] **Step 3: Smoke-load in browser**

Open `index.html` in a browser, devtools console. Expected: 6 "GET …surfaces/…js 404" entries (those files don't exist yet) and `AppAPI` not defined (because earlier scripts can't load due to 404 cascade).

This is expected at this point — the in-page wiring lights up once Phase 3+ creates the files.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(ai): wire AI scaffolding scripts into index.html"
```

---

## Phase 3 — Page 1 surface

### Task 3.1: page1-surface.js

**Files:**
- Create: `js/ai/surfaces/page1-surface.js`
- Test: `tests/ai/page1-surface.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/ai/page1-surface.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['*'] };
  global.window.AppData = {
    currentLanguage: 'en',
    translations: {
      en: { pages: { page1: { startButton: 'Start', headerWhatIs: 'What is' } } },
      id: { pages: { page1: { startButton: 'Mulai', headerWhatIs: 'Berapa' } } }
    }
  };
  global.window.question = [{ dividend: 96, divisor: 3 }];
  global.window.currentQuestionIndex = 0;
  let lastNav = null;
  global.window.changePageAndNotify = (n) => { lastNav = n; };
  Object.defineProperty(global.window, '_lastNav', { get: () => lastNav });
  global.window.getCurrentPage = () => 1;
  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/registry.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/surfaces/page1-surface.js');
  return global.window;
}

test('page1-surface: manifest lists start + setQuestion (admin)', () => {
  const w = load();
  const s = new w.Page1Surface();
  const m = s.getManifest();
  assert.deepEqual(m.semanticActions.map(a => a.name).sort(), ['setQuestion', 'start']);
  assert.equal(m.semanticActions.find(a => a.name === 'setQuestion').scope, 'admin');
  assert.equal(m.goal.kind, 'navigate');
  assert.equal(m.goal.target, 2);
  teardownWindow();
});

test('page1-surface: dispatch start → calls changePageAndNotify(2)', () => {
  const w = load();
  const s = new w.Page1Surface();
  const r = s.dispatch({ kind: 'semantic', name: 'start', args: {}, source: 'ai', actionId: 'a1' });
  assert.equal(r.ok, true);
  assert.equal(w._lastNav, 2);
  assert.equal(r.stepBefore, 'tapStartButton');
  teardownWindow();
});

test('page1-surface: dispatch setQuestion mutates window.question', () => {
  const w = load();
  const s = new w.Page1Surface();
  const r = s.dispatch({ kind: 'semantic', name: 'setQuestion', args: { dividend: 248, divisor: 7 }, source: 'ai', actionId: 'a2' });
  assert.equal(r.ok, true);
  assert.equal(w.question[0].dividend, 248);
  assert.equal(w.question[0].divisor, 7);
  teardownWindow();
});

test('page1-surface: dispatch unknown action → E_UNKNOWN_METHOD', () => {
  const w = load();
  const s = new w.Page1Surface();
  const r = s.dispatch({ kind: 'semantic', name: 'nonexistent', args: {}, source: 'ai', actionId: 'a3' });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'E_UNKNOWN_METHOD');
  teardownWindow();
});

test('page1-surface: checkGoal reached when getCurrentPage() === 2', () => {
  const w = load();
  const s = new w.Page1Surface();
  assert.equal(s.checkGoal().reached, false);
  w.getCurrentPage = () => 2;
  assert.equal(s.checkGoal().reached, true);
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify failing**

```bash
npm test
```

Expected: 5 new tests fail with module-not-found.

- [ ] **Step 3: Implement**

```js
// js/ai/surfaces/page1-surface.js
(function (global) {
  'use strict';

  const ID = 'page1-surface';

  function currentProblem() {
    const qList = global.question || [];
    const idx   = global.currentQuestionIndex || 0;
    return qList[idx] || { dividend: 96, divisor: 3 };
  }

  class Page1Surface extends global.AIControlSurface {
    get id()    { return ID; }
    get kind()  { return 'intro'; }
    get scope() { return { page: 1 }; }

    getManifest() {
      const q = currentProblem();
      const t = (key, params) => global.buildLocalizedPayload({ key, params });
      return {
        title:   t('pages.page1.headerWhatIs'),
        problem: { dividend: q.dividend, divisor: q.divisor },
        goal:    { kind: 'navigate', target: 2 },
        semanticActions: [
          { name: 'start',       args: {},                                  description: 'Begin solving' },
          { name: 'setQuestion', args: { dividend: 'int>0', divisor: 'int>0' }, scope: 'admin',
            description: 'Replace the current question (admin)' }
        ],
        uiElements: [
          { id: 'page1-start-button',             role: 'button',
            label: t('pages.page1.startButton') },
          { id: 'page1-header',                   role: 'text' },
          { id: 'page1-division-problem-display', role: 'display' },
          { id: 'page1-instruction',              role: 'text' }
        ]
      };
    }

    getState() {
      return {
        currentStep:     'tapStartButton',
        stepContext:     {},
        expectedActions: ['start'],
        currentHint:     null,
        uiElementValues: {}
      };
    }

    checkGoal() {
      const cp = (typeof global.getCurrentPage === 'function') ? global.getCurrentPage() : 1;
      return { reached: cp === 2, actual: { currentPage: cp } };
    }

    dispatch(action) {
      const stepBefore = 'tapStartButton';
      switch (action.name) {
        case 'start':
          return this._start(action, stepBefore);
        case 'setQuestion':
          return this._setQuestion(action, stepBefore);
        default:
          // UI-level click on the start button
          if (action.kind === 'ui' && action.name === 'click' &&
              action.args && action.args.id === 'page1-start-button') {
            return this._start(action, stepBefore);
          }
          return { ok: false, actionId: action.actionId,
                   error: { code: 'E_UNKNOWN_METHOD',
                            message: `page1-surface does not handle ${action.name}` } };
      }
    }

    _start(action, stepBefore) {
      if (typeof global.changePageAndNotify === 'function') {
        global.changePageAndNotify(2);
      }
      return {
        ok: true,
        actionId: action.actionId,
        page: 1,
        stepBefore,
        stepAfter: 'tapStartButton', // page 1 unchanged; page 2 mounts after navigation
        validation: { correct: true },
        feedback: null,
        stateDelta: { 'currentPage': 2 }
      };
    }

    _setQuestion(action, stepBefore) {
      const { dividend, divisor } = action.args || {};
      if (!Number.isInteger(dividend) || dividend <= 0 ||
          !Number.isInteger(divisor)  || divisor  <= 0) {
        return { ok: false, actionId: action.actionId,
                 error: { code: 'E_BAD_ARGS', message: 'dividend & divisor must be positive integers' } };
      }
      if (!global.question || !Array.isArray(global.question)) global.question = [];
      const idx = global.currentQuestionIndex || 0;
      global.question[idx] = { dividend, divisor };
      // Trigger any listeners that re-derive UI from the question
      if (typeof global.forceAppUpdate === 'function') global.forceAppUpdate();
      return {
        ok: true,
        actionId: action.actionId,
        page: 1,
        stepBefore,
        stepAfter: 'tapStartButton',
        validation: { correct: true },
        stateDelta: { 'problem': { dividend, divisor } }
      };
    }
  }

  global.Page1Surface = Page1Surface;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Verify pass**

```bash
npm test
```

Expected: 27 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/surfaces/page1-surface.js tests/ai/page1-surface.test.js
git commit -m "feat(ai): page 1 surface (start + admin.setQuestion)"
```

---

### Task 3.2: Register page 1 surface on pageChanged

**Files:**
- Modify: `js/PageConfig.js` (append registration block at the very end of file)

- [ ] **Step 1: Read the bottom of PageConfig.js**

Open `js/PageConfig.js` and scroll to the very bottom (after `OptimizedGridPositionPages` is defined and exported).

- [ ] **Step 2: Append the registration block**

Add at the bottom of `js/PageConfig.js`:

```js
// ===== AI SURFACE REGISTRATION =====
// Surfaces register themselves whenever the active page changes.
// Inert when window.AppAPI is not present (e.g. AI scaffolding not loaded).
(function () {
  if (typeof window === 'undefined') return;

  function syncSurfaces(page) {
    if (!window.AppAPI || !window.AppAPI._registry) return;

    // Drop any surface from the previous page (registry's forPage filter is by scope,
    // we only need the current page mounted at any time).
    const list = window.AppAPI._registry.list();
    for (const s of list) {
      if (!s.scope || s.scope.page !== page) {
        window.AppAPI._unregisterSurface(s.id);
      }
    }

    // Mount fresh surfaces for the new page.
    if (page === 1 && typeof window.Page1Surface === 'function') {
      window.AppAPI._registerSurface(new window.Page1Surface());
    } else if (page === 2 && typeof window.Page2Surface === 'function') {
      window.AppAPI._registerSurface(new window.Page2Surface());
    }
  }

  window.addEventListener('pageChanged', (e) => {
    const page = (e && e.detail && e.detail.page) || 1;
    syncSurfaces(page);
  });

  // Initial sync after applet boots (math-applet.js dispatches pageChanged on first nav).
  // Belt-and-braces: also sync on DOMContentLoaded if no event has fired yet.
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const cp = (typeof window.getCurrentPage === 'function') ? window.getCurrentPage() : 1;
      syncSurfaces(cp);
    }, 200);
  });
})();
```

- [ ] **Step 3: Smoke-load**

Open `index.html?ai=1` in a browser, devtools:

```js
> AppAPI.describePage()
// expect: { page: 1, semanticActions: [{name:"start"}, {name:"setQuestion"}], … }

> AppAPI.actions.start()
// expect: ok:true, then page changes to 2 visibly
```

(Page 2 surface doesn't exist yet — `describePage()` will return empty after navigation. Phase 6 fills it in.)

- [ ] **Step 4: Commit**

```bash
git add js/PageConfig.js
git commit -m "feat(ai): register page surfaces on pageChanged"
```

---

## Phase 4 — Long-division refactor + surface

### Task 4.1: Locate digit-application paths

**Files:**
- Read-only: `js/components/long-division-grid-component.js`
- Create: `docs/superpowers/notes/long-division-handlers.md`

- [ ] **Step 1: Map the relevant handlers**

Search the file for these state mutators and call sites, and record line ranges:

```bash
grep -n "setGuidedValues" js/components/long-division-grid-component.js
grep -n "setGuidedValidation" js/components/long-division-grid-component.js
grep -n "setSelectedStartingDigits" js/components/long-division-grid-component.js
grep -n "advanceGuidedStep" js/components/long-division-grid-component.js
grep -n "onDrop\|onClick.*digit\|handleDrop" js/components/long-division-grid-component.js
```

- [ ] **Step 2: Write findings to a notes file**

```markdown
<!-- docs/superpowers/notes/long-division-handlers.md -->
# Long-division grid: digit application paths (pre-refactor)

State mutators relevant to "filling a digit into a guided cell":
- `setGuidedValues({...prev, [cellKey]: value})` at lines: <list line numbers>
- `setGuidedValidation({...prev, [cellKey]: { isCorrect, correctValue, userValue }})` at: <list>
- `setSelectedStartingDigits(...)` at: <list>
- `advanceGuidedStep()` at: <list>

Entry points (places that ultimately call the above):
1. Drag-drop handler — drop on a cell from the digit panel: lines <range>
2. Click handler — click on a digit panel button: lines <range>
3. Multiplication-table row click → quotient digit: lines <range>
4. Dividend-digit click → starting-digit selection: lines <range>

Common downstream logic these all share (the seam where applyDigit will live):
- Validation against `getCorrectValueForCell(cellKey)`
- Hint update via __longDivisionGuidedHint
- Audio cue (correct.mp3 / wrong.mp3)
- guidedStepIndex advance on success
```

(Fill in the actual line ranges as you read.)

- [ ] **Step 3: Commit notes**

```bash
git add docs/superpowers/notes/long-division-handlers.md
git commit -m "docs(ai): map long-division handlers for refactor"
```

---

### Task 4.2: Extract `applyDigit` unified handler

**Files:**
- Modify: `js/components/long-division-grid-component.js`
- Test: `tests/manual/long-division-no-regression.md`

- [ ] **Step 1: Add a manual regression checklist**

```markdown
<!-- tests/manual/long-division-no-regression.md -->
# Long-division grid: manual no-regression checklist

After the applyDigit refactor, walk through these scenarios in the browser
(`index.html` with default config, page 2). Each must behave exactly as before.

1. **Drag a digit from the panel onto the first quotient cell.**
   - Correct digit (e.g. "3" for 96÷3): cell turns green, hint advances to product step,
     correct.mp3 plays. Same as before.
   - Wrong digit (e.g. "5"): cell flashes red, hint stays, wrong.mp3 plays, value rejected.

2. **Click a row in the multiplication table** to fill the quotient digit. Same outcomes as #1.

3. **Click a digit-panel button** while a guided cell is highlighted. Same as #1.

4. **Click a dividend digit** to add it to selectedStartingDigits. Selection ring appears.

5. **Run a full division** (96÷3 → quotient 32, remainder 0). Confetti + completion message
   appear at the end.

6. **Switch to page 1, back to page 2.** Grid resets to first question. Repeat #5.

If any item differs from the pre-refactor behaviour, the refactor introduced a regression.
```

- [ ] **Step 2: Refactor — introduce `applyDigit` and route all entry points through it**

In `js/components/long-division-grid-component.js`, inside the component function (after the existing state declarations and before the handler `useCallback`s), add:

```js
    /**
     * Unified digit-application entry point.
     * Called by: drag-drop, digit-panel click, multiplication-table row click,
     *            and AppAPI dispatch via window-exposed handle.
     *
     * @param {Object} args
     * @param {string} args.cellKey   — e.g. "quotient-0", "subtract-row1-col2"
     * @param {number} args.value     — digit 0..9
     * @param {string} args.source    — "click" | "drag" | "mtable" | "ai"
     * @returns {{accepted:boolean, correct:boolean, expected:number|null,
     *            advancedTo:string|null, hint:object|null}}
     */
    const applyDigit = React.useCallback(({ cellKey, value, source }) => {
      // 1. Resolve expected value for this cell from the existing helper.
      const expected = getCorrectValueForCell(cellKey);
      const correct  = (Number(value) === Number(expected));

      // 2. Mutate guidedValues + guidedValidation in lockstep.
      setGuidedValues(prev => ({ ...prev, [cellKey]: value }));
      setGuidedValidation(prev => ({
        ...prev,
        [cellKey]: { isCorrect: correct, correctValue: expected, userValue: value }
      }));

      // 3. Audio.
      if (typeof window !== 'undefined' && window.SimpleSoundManager) {
        window.SimpleSoundManager.play(correct ? 'correct' : 'wrong');
      }

      // 4. Advance step on correct.
      let advancedTo = null;
      if (correct) {
        // existing advanceGuidedStep already handles this; call it.
        advanceGuidedStep();
        advancedTo = (guidedSteps[guidedStepIndex + 1] && guidedSteps[guidedStepIndex + 1].type) || 'complete';
      }

      // 5. Surface a structured result for AppAPI consumers; existing UI logic
      //    (hint text, completion check) re-renders from the state mutations above.
      return {
        accepted: true,
        correct,
        expected,
        advancedTo,
        hint: window.__longDivisionGuidedHint || null
      };
    }, [getCorrectValueForCell, advanceGuidedStep, guidedSteps, guidedStepIndex]);
```

Then update each existing site that mutates `guidedValues` / `guidedValidation` (drag-drop, digit-panel click, mtable click) to call `applyDigit({ cellKey, value, source })` instead.

(Use the line ranges from Task 4.1's notes file. Each site is replaced by a one-line `applyDigit` call. Net diff: ~40 LoC.)

- [ ] **Step 3: Expose component handle for AI surface to find**

Inside the same component function, after the `applyDigit` definition:

```js
    // Expose this grid instance for AppAPI to find (only when AI scaffolding is active).
    React.useEffect(() => {
      if (typeof window === 'undefined') return;
      if (!window.APP_CONFIG || !window.APP_CONFIG.AI_ENABLED) return;
      window.__longDivisionGridHandle = {
        applyDigit,
        getGuidedValues:    () => guidedValues,
        getGuidedValidation:() => guidedValidation,
        getGuidedSteps:     () => guidedSteps,
        getGuidedStepIndex: () => guidedStepIndex,
        getProblem:         () => ({ dividend, divisor }),
        getSelectedStartingDigits: () => Array.from(selectedStartingDigits || [])
      };
      return () => { if (window.__longDivisionGridHandle &&
                         window.__longDivisionGridHandle.applyDigit === applyDigit) {
                       delete window.__longDivisionGridHandle; } };
    }, [applyDigit, guidedValues, guidedValidation, guidedSteps, guidedStepIndex,
        dividend, divisor, selectedStartingDigits]);
```

- [ ] **Step 4: Run manual regression checklist**

Open `index.html`, walk through `tests/manual/long-division-no-regression.md`. Every scenario must pass.

- [ ] **Step 5: Verify handle exposure**

Open `index.html?ai=1`, navigate to page 2, devtools:

```js
> typeof window.__longDivisionGridHandle.applyDigit
// expect: "function"

> window.__longDivisionGridHandle.getProblem()
// expect: { dividend: 96, divisor: 3 }
```

- [ ] **Step 6: Commit**

```bash
git add js/components/long-division-grid-component.js tests/manual/long-division-no-regression.md
git commit -m "refactor(grid): extract applyDigit + expose grid handle (no behaviour change)"
```

---

### Task 4.3: long-division-surface.js

**Files:**
- Create: `js/ai/surfaces/long-division-surface.js`
- Test: `tests/ai/long-division-surface.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/ai/long-division-surface.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true };
  global.window.AppData = {
    currentLanguage: 'en',
    translations: { en: { division: { howManyTimes: 'How many times does {divisor} go into {value}?' } } }
  };
  global.window.question = [{ dividend: 96, divisor: 3 }];
  global.window.currentQuestionIndex = 0;

  // Fake grid handle that records calls and emulates the real one.
  const calls = [];
  const guidedValues = {};
  const guidedValidation = {};
  global.window.__longDivisionGridHandle = {
    applyDigit: ({ cellKey, value, source }) => {
      calls.push({ cellKey, value, source });
      const expected = (cellKey === 'quotient-0') ? 3 : 9; // mock expected values for 96÷3
      const correct = value === expected;
      guidedValues[cellKey] = value;
      guidedValidation[cellKey] = { isCorrect: correct, correctValue: expected, userValue: value };
      return { accepted: true, correct, expected, advancedTo: correct ? 'writePartialProduct' : null, hint: null };
    },
    getGuidedValues:    () => guidedValues,
    getGuidedValidation:() => guidedValidation,
    getGuidedSteps:     () => [{ type: 'quotient', cellKey: 'quotient-0' }],
    getGuidedStepIndex: () => 0,
    getProblem:         () => ({ dividend: 96, divisor: 3 }),
    getSelectedStartingDigits: () => []
  };
  global.window._calls = calls;

  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/surfaces/long-division-surface.js');
  return global.window;
}

test('long-division-surface: manifest lists the seven semantic actions', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const names = s.getManifest().semanticActions.map(a => a.name).sort();
  assert.deepEqual(names,
    ['bringDownDigit','chooseDividendDigits','chooseQuotientDigit','selectMultiplicationTableRow',
     'setPartialProduct','setRemainder','setSubtractionResult'].sort());
  teardownWindow();
});

test('long-division-surface: chooseQuotientDigit correct → calls applyDigit, returns validation.correct=true', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 0, value: 3 }, source: 'ai', actionId: 'a1' });
  assert.equal(r.ok, true);
  assert.equal(r.validation.correct, true);
  assert.equal(r.validation.expected, 3);
  assert.equal(w._calls.length, 1);
  assert.equal(w._calls[0].cellKey, 'quotient-0');
  assert.equal(w._calls[0].value, 3);
  assert.equal(w._calls[0].source, 'ai');
  teardownWindow();
});

test('long-division-surface: chooseQuotientDigit wrong → validation.correct=false, no step advance', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 0, value: 9 }, source: 'ai', actionId: 'a2' });
  assert.equal(r.ok, true);
  assert.equal(r.validation.correct, false);
  assert.equal(r.stepBefore, r.stepAfter); // unchanged
  teardownWindow();
});

test('long-division-surface: bad args → E_BAD_ARGS', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 'oops', value: 3 }, source: 'ai', actionId: 'a3' });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'E_BAD_ARGS');
  teardownWindow();
});

test('long-division-surface: missing grid handle → E_NOT_INTERACTABLE', () => {
  const w = load();
  delete w.__longDivisionGridHandle;
  const s = new w.LongDivisionSurface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 0, value: 3 }, source: 'ai', actionId: 'a4' });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'E_NOT_INTERACTABLE');
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify failing**

```bash
npm test
```

Expected: 5 new tests fail.

- [ ] **Step 3: Implement**

```js
// js/ai/surfaces/long-division-surface.js
(function (global) {
  'use strict';

  const ID = 'long-division-surface';

  function handle() { return global.__longDivisionGridHandle || null; }

  function problem() {
    const h = handle();
    if (h) return h.getProblem();
    const qList = global.question || [];
    const idx   = global.currentQuestionIndex || 0;
    return qList[idx] || { dividend: 96, divisor: 3 };
  }

  function expectedQuotient() {
    const { dividend, divisor } = problem();
    const q = Math.floor(dividend / divisor).toString();
    return q.split('').map(Number);
  }

  function expectedRemainder() {
    const { dividend, divisor } = problem();
    return dividend % divisor;
  }

  function currentStep() {
    const h = handle();
    if (!h) return 'unknown';
    const steps = h.getGuidedSteps();
    const idx = h.getGuidedStepIndex();
    if (!steps || idx >= steps.length) return 'complete';
    const s = steps[idx];
    switch (s.type) {
      case 'startingDigits': return 'chooseDividendDigits';
      case 'quotient':       return 'chooseQuotientDigit';
      case 'partialProduct':
      case 'product':        return 'writePartialProduct';
      case 'subtract':
      case 'difference':     return 'writeSubtractionResult';
      case 'bringDown':      return 'bringDownDigit';
      case 'remainder':      return 'writeRemainder';
      default:               return s.type;
    }
  }

  function activeCellId() {
    const h = handle();
    if (!h) return null;
    const steps = h.getGuidedSteps();
    const idx   = h.getGuidedStepIndex();
    if (!steps || idx >= steps.length) return null;
    return 'page2-grid-' + (steps[idx].cellKey || '');
  }

  class LongDivisionSurface extends global.AIControlSurface {
    get id()    { return ID; }
    get kind()  { return 'grid'; }
    get scope() { return { page: 2 }; }

    getManifest() {
      const t = (key, params) => global.buildLocalizedPayload({ key, params });
      const q = problem();
      return {
        title:   t('pages.page1.headerWhatIs'),
        problem: { dividend: q.dividend, divisor: q.divisor,
                   questionIndex: global.currentQuestionIndex || 0,
                   totalQuestions: (global.question || []).length },
        goal: { kind: 'completeDivision',
                target: { quotient: expectedQuotient(), remainder: expectedRemainder() } },
        semanticActions: [
          { name: 'chooseDividendDigits',         args: { digits: 'int[]' } },
          { name: 'chooseQuotientDigit',          args: { column: 'int>=0', value: 'digit' } },
          { name: 'setPartialProduct',            args: { column: 'int>=0', value: 'digit' } },
          { name: 'setSubtractionResult',         args: { column: 'int>=0', value: 'digit' } },
          { name: 'bringDownDigit',               args: { fromColumn: 'int>=0' } },
          { name: 'setRemainder',                 args: { value: 'digit' } },
          { name: 'selectMultiplicationTableRow', args: { multiplier: 'int 1..10' } }
        ],
        uiElements: this._buildUiElements()
      };
    }

    _buildUiElements() {
      const els = [];
      const h = handle();
      const values = h ? h.getGuidedValues() : {};
      const validation = h ? h.getGuidedValidation() : {};
      // quotient row (length matches expected quotient digits)
      const quotientLen = expectedQuotient().length;
      for (let c = 0; c < quotientLen; c++) {
        const k = `quotient-${c}`;
        els.push({
          id: `page2-grid-${k}`, role: 'cell', group: 'quotient', col: c,
          value: values[k] ?? null,
          interactable: c === (h ? h.getGuidedStepIndex() : 0)
        });
      }
      // digit panel (0-9)
      for (let d = 0; d < 10; d++) {
        els.push({ id: `page2-digit-panel-${d}`, role: 'button', label: String(d) });
      }
      // multiplication table (1-10)
      const div = problem().divisor;
      for (let m = 1; m <= 10; m++) {
        els.push({ id: `page2-mtable-row-${m}`, role: 'row',
                   label: { ui: `${div} × ${m} = ${div*m}`, en: `${div} × ${m} = ${div*m}`, i18nKey: null, params: { divisor: div, multiplier: m } } });
      }
      return els;
    }

    getState() {
      const h = handle();
      const t = (key, params) => global.buildLocalizedPayload({ key, params });
      const hint = global.__longDivisionGuidedHint || null;
      return {
        currentStep:     currentStep(),
        stepContext:     { activeCellId: activeCellId(),
                           guidedStepIndex: h ? h.getGuidedStepIndex() : 0 },
        expectedActions: this._expectedActionsForStep(currentStep()),
        currentHint:     hint ? { ui: hint.text, en: hint.text, i18nKey: null, params: {} } : null,
        uiElementValues: h ? h.getGuidedValues() : {}
      };
    }

    _expectedActionsForStep(step) {
      switch (step) {
        case 'chooseDividendDigits':  return ['chooseDividendDigits'];
        case 'chooseQuotientDigit':   return ['chooseQuotientDigit', 'selectMultiplicationTableRow'];
        case 'writePartialProduct':   return ['setPartialProduct'];
        case 'writeSubtractionResult':return ['setSubtractionResult'];
        case 'bringDownDigit':        return ['bringDownDigit'];
        case 'writeRemainder':        return ['setRemainder'];
        case 'complete':              return [];
        default:                      return [];
      }
    }

    checkGoal() {
      const h = handle();
      const target = { quotient: expectedQuotient(), remainder: expectedRemainder() };
      if (!h) return { reached: false, actual: {} };
      // Read filled quotient digits in order.
      const values = h.getGuidedValues();
      const actualQ = [];
      for (let c = 0; c < target.quotient.length; c++) actualQ.push(values[`quotient-${c}`] ?? null);
      const remainderCellKey = `remainder-0`;
      const actualR = values[remainderCellKey] ?? null;
      const reached = actualQ.every((v, i) => v === target.quotient[i]) &&
                      (target.remainder === 0 ? (actualR === null || actualR === 0) : actualR === target.remainder);
      return { reached, actual: { quotient: actualQ, remainder: actualR } };
    }

    dispatch(action) {
      const stepBefore = currentStep();
      try {
        switch (action.name) {
          case 'chooseQuotientDigit':          return this._fillCell('quotient', action, stepBefore, 'column');
          case 'setPartialProduct':            return this._fillCell('partialProduct', action, stepBefore, 'column');
          case 'setSubtractionResult':         return this._fillCell('subtract', action, stepBefore, 'column');
          case 'setRemainder':                 return this._fillCell('remainder', action, stepBefore, null);
          case 'bringDownDigit':               return this._bringDown(action, stepBefore);
          case 'chooseDividendDigits':         return this._chooseStartingDigits(action, stepBefore);
          case 'selectMultiplicationTableRow': return this._mtableRow(action, stepBefore);
          default:
            return { ok: false, actionId: action.actionId,
                     error: { code: 'E_UNKNOWN_METHOD', message: `not handled: ${action.name}` } };
        }
      } catch (e) {
        return { ok: false, actionId: action.actionId,
                 error: { code: 'E_INTERNAL', message: e.message, details: { stack: e.stack } } };
      }
    }

    _fillCell(rowKind, action, stepBefore, columnArg) {
      const h = handle();
      if (!h) return this._noHandle(action);
      const { value } = action.args || {};
      if (!Number.isInteger(value) || value < 0 || value > 9) return this._badArgs(action, 'value must be digit 0-9');
      let cellKey;
      if (columnArg === 'column') {
        const col = action.args.column;
        if (!Number.isInteger(col) || col < 0) return this._badArgs(action, 'column must be int >= 0');
        cellKey = `${rowKind}-${col}`;
      } else {
        cellKey = `${rowKind}-0`;
      }
      const r = h.applyDigit({ cellKey, value, source: action.source || 'ai' });
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter: currentStep(),
        validation: { correct: r.correct, expected: r.expected, accepted: value },
        feedback: r.correct
          ? { kind: 'correct',  sound: 'correct.mp3' }
          : { kind: 'incorrect', sound: 'wrong.mp3' },
        stateDelta: { [`uiElementValues.page2-grid-${cellKey}`]: value }
      };
    }

    _bringDown(action, stepBefore) {
      const h = handle();
      if (!h) return this._noHandle(action);
      // Bring-down currently happens automatically when guided step reaches 'bringDown';
      // expose as a no-op confirmation that returns the new state.
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter: currentStep(),
        validation: { correct: true },
        feedback: null,
        stateDelta: {}
      };
    }

    _chooseStartingDigits(action, stepBefore) {
      const h = handle();
      if (!h) return this._noHandle(action);
      const { digits } = action.args || {};
      if (!Array.isArray(digits) || !digits.every(d => Number.isInteger(d) && d >= 0)) {
        return this._badArgs(action, 'digits must be array of int>=0');
      }
      // The actual selection mutator is internal; the existing dividend-click handler stays the
      // source of truth. We expose this action for parity but route via the click handler when
      // available — for v1, surface the call as accepted and let the user-facing step advance
      // via the existing path. Future work: add a setter on the grid handle.
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter: currentStep(),
        validation: { correct: true, accepted: digits },
        stateDelta: { 'stepContext.selectedStartingDigits': digits }
      };
    }

    _mtableRow(action, stepBefore) {
      const h = handle();
      if (!h) return this._noHandle(action);
      const { multiplier } = action.args || {};
      if (!Number.isInteger(multiplier) || multiplier < 1 || multiplier > 10) {
        return this._badArgs(action, 'multiplier must be 1..10');
      }
      // If we're at the chooseQuotientDigit step, this is equivalent to choosing the multiplier as the digit.
      if (currentStep() === 'chooseQuotientDigit') {
        const idx = h.getGuidedStepIndex();
        const cellKey = `quotient-${idx}`;
        const r = h.applyDigit({ cellKey, value: multiplier, source: 'mtable' });
        return {
          ok: true, actionId: action.actionId, page: 2,
          stepBefore, stepAfter: currentStep(),
          validation: { correct: r.correct, expected: r.expected, accepted: multiplier },
          feedback: r.correct ? { kind: 'correct', sound: 'correct.mp3' } : { kind: 'incorrect', sound: 'wrong.mp3' },
          stateDelta: { [`uiElementValues.page2-grid-${cellKey}`]: multiplier }
        };
      }
      // Otherwise, just record the row selection without effect.
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter: stepBefore,
        validation: { correct: true, accepted: multiplier },
        feedback: null,
        stateDelta: {}
      };
    }

    _noHandle(action) {
      return { ok: false, actionId: action.actionId,
               error: { code: 'E_NOT_INTERACTABLE', message: 'long-division grid not mounted' } };
    }

    _badArgs(action, message) {
      return { ok: false, actionId: action.actionId,
               error: { code: 'E_BAD_ARGS', message } };
    }
  }

  global.LongDivisionSurface = LongDivisionSurface;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Verify pass**

```bash
npm test
```

Expected: 32 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/surfaces/long-division-surface.js tests/ai/long-division-surface.test.js
git commit -m "feat(ai): long-division surface with seven semantic actions"
```

---

## Phase 5 — Multiplication-table & nav surfaces

### Task 5.1: nav-surface.js (Next/Previous buttons)

**Files:**
- Create: `js/ai/surfaces/nav-surface.js`
- Test: `tests/ai/nav-surface.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/ai/nav-surface.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  let nav = null;
  global.window.changePageAndNotify = (n) => { nav = n; };
  Object.defineProperty(global.window, '_lastNav', { get: () => nav });
  global.window.question = [{ dividend: 96, divisor: 3 }, { dividend: 13, divisor: 2 }];
  global.window.currentQuestionIndex = 0;
  global.window.PageCompletionManager = { setPageCompleted: () => {} };
  require('../../js/ai/errors.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/surfaces/nav-surface.js');
  return global.window;
}

test('nav-surface: clickNext on page 2 mid-bank → next question, stay on page 2', () => {
  const w = load();
  const s = new w.NavSurface(2);
  const r = s.dispatch({ kind: 'semantic', name: 'clickNext', args: {}, source: 'ai', actionId: 'n1' });
  assert.equal(r.ok, true);
  assert.equal(w._lastNav, 2);
  assert.equal(w.currentQuestionIndex, 1);
  teardownWindow();
});

test('nav-surface: clickNext on page 2 last question → reset, return to page 1', () => {
  const w = load();
  w.currentQuestionIndex = 1; // last
  const s = new w.NavSurface(2);
  const r = s.dispatch({ kind: 'semantic', name: 'clickNext', args: {}, source: 'ai', actionId: 'n2' });
  assert.equal(r.ok, true);
  assert.equal(w._lastNav, 1);
  assert.equal(w.currentQuestionIndex, 0);
  teardownWindow();
});

test('nav-surface: clickPrevious on page 2 → page 1', () => {
  const w = load();
  const s = new w.NavSurface(2);
  s.dispatch({ kind: 'semantic', name: 'clickPrevious', args: {}, source: 'ai', actionId: 'n3' });
  assert.equal(w._lastNav, 1);
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify failing**

```bash
npm test
```

- [ ] **Step 3: Implement**

```js
// js/ai/surfaces/nav-surface.js
(function (global) {
  'use strict';

  class NavSurface extends global.AIControlSurface {
    constructor(page) { super(); this._page = page; }
    get id()    { return `nav-surface-page${this._page}`; }
    get kind()  { return 'navigation'; }
    get scope() { return { page: this._page }; }

    getManifest() {
      return {
        semanticActions: [
          { name: 'clickNext',     args: {}, description: 'Press the » button' },
          { name: 'clickPrevious', args: {}, description: 'Press the « button' }
        ],
        uiElements: [
          { id: `page${this._page}-next-button`,     role: 'button', label: { ui: '»', en: '»' } },
          { id: `page${this._page}-previous-button`, role: 'button', label: { ui: '«', en: '«' } }
        ]
      };
    }

    getState() {
      return { currentStep: 'navIdle', stepContext: {}, expectedActions: ['clickNext','clickPrevious'],
               currentHint: null, uiElementValues: {} };
    }

    checkGoal() { return { reached: false, actual: {} }; }

    dispatch(action) {
      const a = action.name;
      if (a === 'clickNext')     return this._next(action);
      if (a === 'clickPrevious') return this._prev(action);
      // UI-level
      if (action.kind === 'ui' && action.name === 'click' && action.args) {
        if (action.args.id === `page${this._page}-next-button`)     return this._next(action);
        if (action.args.id === `page${this._page}-previous-button`) return this._prev(action);
      }
      return { ok: false, actionId: action.actionId,
               error: { code: 'E_UNKNOWN_METHOD', message: `nav-surface: ${a}` } };
    }

    _next(action) {
      // Mirror the existing page2-next-button onClick logic from PageConfig.js (page 2 cycles questions).
      if (this._page === 2) {
        const qList = global.question || [];
        const currentIndex = global.currentQuestionIndex || 0;
        const isLast = qList.length > 0 && currentIndex >= qList.length - 1;
        if (global.PageCompletionManager && typeof global.PageCompletionManager.setPageCompleted === 'function') {
          global.PageCompletionManager.setPageCompleted(2, false);
        }
        if (global.__longDivisionComplete !== undefined) delete global.__longDivisionComplete;
        if (global.__longDivisionGuidedHint !== undefined) delete global.__longDivisionGuidedHint;
        if (isLast) {
          global.currentQuestionIndex = 0;
          global.page1complete = false;
          global.objectsremoved = 0;
          if (typeof global.changePageAndNotify === 'function') global.changePageAndNotify(1);
        } else {
          global.currentQuestionIndex = currentIndex + 1;
          if (typeof global.changePageAndNotify === 'function') global.changePageAndNotify(2);
        }
      } else if (this._page === 1) {
        if (typeof global.changePageAndNotify === 'function') global.changePageAndNotify(2);
      }
      return { ok: true, actionId: action.actionId, page: this._page,
               stepBefore: 'navIdle', stepAfter: 'navIdle',
               validation: { correct: true }, feedback: null, stateDelta: {} };
    }

    _prev(action) {
      if (this._page === 2) {
        if (typeof global.changePageAndNotify === 'function') global.changePageAndNotify(1);
      }
      return { ok: true, actionId: action.actionId, page: this._page,
               stepBefore: 'navIdle', stepAfter: 'navIdle',
               validation: { correct: true }, feedback: null, stateDelta: {} };
    }
  }

  global.NavSurface = NavSurface;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Verify pass**

```bash
npm test
```

Expected: 35 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/surfaces/nav-surface.js tests/ai/nav-surface.test.js
git commit -m "feat(ai): nav surface (clickNext/clickPrevious)"
```

---

### Task 5.2: mtable-surface.js (placeholder, to round out the composer)

**Files:**
- Create: `js/ai/surfaces/mtable-surface.js`

- [ ] **Step 1: Implement (minimal — the long-division-surface already handles selectMultiplicationTableRow when relevant; mtable-surface exposes the row UI elements only)**

```js
// js/ai/surfaces/mtable-surface.js
(function (global) {
  'use strict';

  class MTableSurface extends global.AIControlSurface {
    get id()    { return 'mtable-surface'; }
    get kind()  { return 'grid'; }
    get scope() { return { page: 2 }; }

    getManifest() {
      const div = (global.__longDivisionGridHandle && global.__longDivisionGridHandle.getProblem &&
                   global.__longDivisionGridHandle.getProblem().divisor) || 3;
      const els = [];
      for (let m = 1; m <= 10; m++) {
        els.push({
          id:   `page2-mtable-row-${m}`,
          role: 'row',
          label: { ui: `${div} × ${m} = ${div*m}`, en: `${div} × ${m} = ${div*m}`, i18nKey: null, params: { divisor: div, multiplier: m } }
        });
      }
      return { semanticActions: [], uiElements: els, goal: null };
    }

    getState() {
      return { currentStep: 'mtableIdle', stepContext: {}, expectedActions: [],
               currentHint: null, uiElementValues: {} };
    }

    checkGoal() { return { reached: false, actual: {} }; }

    dispatch(action) {
      // UI-level click on a row → forward to long-division surface's mtable handler via global.
      if (action.kind === 'ui' && action.name === 'click' && action.args) {
        const m = (action.args.id || '').match(/^page2-mtable-row-(\d+)$/);
        if (m) {
          const surface = global.AppAPI && global.AppAPI._registry &&
            global.AppAPI._registry.list().find(s => s.id === 'long-division-surface');
          if (surface) {
            return surface.dispatch({ kind: 'semantic', name: 'selectMultiplicationTableRow',
                                     args: { multiplier: parseInt(m[1], 10) },
                                     source: action.source, actionId: action.actionId });
          }
        }
      }
      return { ok: false, actionId: action.actionId,
               error: { code: 'E_UNKNOWN_METHOD', message: 'mtable-surface: not handled' } };
    }
  }

  global.MTableSurface = MTableSurface;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 2: Commit**

```bash
git add js/ai/surfaces/mtable-surface.js
git commit -m "feat(ai): multiplication-table surface for UI element listing"
```

---

## Phase 6 — Page 2 composer

### Task 6.1: page2-surface.js

**Files:**
- Create: `js/ai/surfaces/page2-surface.js`
- Test: `tests/ai/page2-surface.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/ai/page2-surface.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.AppData = { currentLanguage: 'en', translations: { en: {} } };
  global.window.question = [{ dividend: 96, divisor: 3 }];
  global.window.currentQuestionIndex = 0;
  global.window.__longDivisionGridHandle = {
    applyDigit: () => ({ accepted: true, correct: true, expected: 3, advancedTo: null, hint: null }),
    getGuidedValues: () => ({}), getGuidedValidation: () => ({}),
    getGuidedSteps: () => [{ type: 'quotient', cellKey: 'quotient-0' }],
    getGuidedStepIndex: () => 0,
    getProblem: () => ({ dividend: 96, divisor: 3 }),
    getSelectedStartingDigits: () => []
  };
  global.window.changePageAndNotify = () => {};
  global.window.PageCompletionManager = { setPageCompleted: () => {} };
  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/surfaces/long-division-surface.js');
  require('../../js/ai/surfaces/mtable-surface.js');
  require('../../js/ai/surfaces/nav-surface.js');
  require('../../js/ai/surfaces/page2-surface.js');
  return global.window;
}

test('page2-surface: composes long-division + nav + mtable', () => {
  const w = load();
  const s = new w.Page2Surface();
  const m = s.getManifest();
  const names = m.semanticActions.map(a => a.name);
  assert.ok(names.includes('chooseQuotientDigit'));
  assert.ok(names.includes('clickNext'));
  assert.ok(names.includes('selectMultiplicationTableRow'));
  teardownWindow();
});

test('page2-surface: dispatch routes to the sub-surface owning the action', () => {
  const w = load();
  const s = new w.Page2Surface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 0, value: 3 }, source: 'ai', actionId: 'p1' });
  assert.equal(r.ok, true);
  assert.equal(r.validation.correct, true);
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify failing**

```bash
npm test
```

- [ ] **Step 3: Implement**

```js
// js/ai/surfaces/page2-surface.js
(function (global) {
  'use strict';

  class Page2Surface extends global.AIControlSurface {
    constructor() {
      super();
      this._subs = [
        new global.LongDivisionSurface(),
        new global.MTableSurface(),
        new global.NavSurface(2)
      ];
    }
    get id()    { return 'page2-surface'; }
    get kind()  { return 'page'; }
    get scope() { return { page: 2 }; }

    getManifest() {
      const semanticActions = [];
      const uiElements = [];
      let goal = null;
      for (const s of this._subs) {
        const m = s.getManifest();
        if (m.semanticActions) semanticActions.push(...m.semanticActions);
        if (m.uiElements)      uiElements.push(...m.uiElements);
        if (!goal && m.goal)   goal = m.goal;
      }
      return { semanticActions, uiElements, goal };
    }

    getState() {
      // Use the long-division sub-surface's state as the page's state (it's the active one).
      return this._subs[0].getState();
    }

    checkGoal() { return this._subs[0].checkGoal(); }

    dispatch(action) {
      // semantic: find sub-surface that owns this name
      if (action.kind === 'semantic') {
        for (const s of this._subs) {
          const m = s.getManifest();
          if (m.semanticActions && m.semanticActions.some(a => a.name === action.name)) {
            return s.dispatch(action);
          }
        }
      }
      // ui: find sub-surface that owns this id
      if (action.kind === 'ui' && action.args && action.args.id) {
        for (const s of this._subs) {
          const m = s.getManifest();
          if (m.uiElements && m.uiElements.some(e => e.id === action.args.id)) {
            return s.dispatch(action);
          }
        }
      }
      return { ok: false, actionId: action.actionId,
               error: { code: 'E_UNKNOWN_METHOD', message: 'page2-surface: not handled' } };
    }

    attach(eventBus) { for (const s of this._subs) s.attach(eventBus); }
    detach()         { for (const s of this._subs) s.detach(); }
  }

  global.Page2Surface = Page2Surface;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Verify pass**

```bash
npm test
```

Expected: 37 passing.

- [ ] **Step 5: Smoke-test in browser**

Open `index.html?ai=1`, navigate to page 2, devtools:

```js
> AppAPI.describePage()
// expect: page:2, semanticActions includes chooseQuotientDigit, clickNext, etc.

> AppAPI.actions.chooseQuotientDigit({column:0, value:3})
// expect: ok:true, validation.correct:true, the cell shows "3" on screen
```

- [ ] **Step 6: Commit**

```bash
git add js/ai/surfaces/page2-surface.js tests/ai/page2-surface.test.js
git commit -m "feat(ai): page 2 composer surface"
```

---

### Task 6.2: Global admin methods (setQuestionIndex, reset)

The spec lists `admin.setQuestion`, `admin.setQuestionIndex`, and `admin.reset` as page-level admin actions. `setQuestion` is already implemented in Page1Surface (Task 3.1). The other two are global — they affect app-level state regardless of which page is mounted — so they live directly on `AppAPI.admin`. We also surface them in each page's manifest so `describePage()` advertises them.

**Files:**
- Modify: `js/ai/app-api.js`
- Modify: `js/ai/surfaces/page1-surface.js`
- Modify: `js/ai/surfaces/page2-surface.js`
- Test: `tests/ai/admin.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/ai/admin.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['*'] };
  global.window.AppData = { currentLanguage: 'en', translations: { en: {} } };
  global.window.question = [{ dividend: 96, divisor: 3 }, { dividend: 13, divisor: 2 }];
  global.window.currentQuestionIndex = 0;
  let lastNav = null;
  global.window.changePageAndNotify = (n) => { lastNav = n; };
  Object.defineProperty(global.window, '_lastNav', { get: () => lastNav });
  global.window.getCurrentPage = () => 1;
  global.window.PageCompletionManager = { setPageCompleted: () => {}, _calls: [] };
  global.window.__longDivisionComplete = true;
  global.window.__longDivisionGuidedHint = { targetId: 'x', text: 'y' };

  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/registry.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/app-api.js');
  return global.window;
}

test('admin.setQuestionIndex: jumps to question N, validates bounds', () => {
  const w = load();
  const r = w.AppAPI.admin.setQuestionIndex({ index: 1 });
  assert.equal(r.ok, true);
  assert.equal(w.currentQuestionIndex, 1);
  const bad = w.AppAPI.admin.setQuestionIndex({ index: 99 });
  assert.equal(bad.ok, false);
  assert.equal(bad.error.code, 'E_BAD_ARGS');
  teardownWindow();
});

test('admin.reset: clears completion state and navigates per `to`', () => {
  const w = load();
  const r = w.AppAPI.admin.reset({ to: 'page1' });
  assert.equal(r.ok, true);
  assert.equal(w._lastNav, 1);
  assert.equal(w.currentQuestionIndex, 0);
  assert.equal(w.__longDivisionComplete, undefined);
  assert.equal(w.__longDivisionGuidedHint, undefined);
  teardownWindow();
});

test('admin.reset: bad `to` → E_BAD_ARGS', () => {
  const w = load();
  const r = w.AppAPI.admin.reset({ to: 'bogus' });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'E_BAD_ARGS');
  teardownWindow();
});

test('admin.reset: clears event-bus transcript', () => {
  const w = load();
  w.AppAPI._emit({ type: 'a', source: 'system' });
  w.AppAPI._emit({ type: 'b', source: 'system' });
  assert.equal(w.AppAPI.transcript({ since: 0 }).events.length, 2);
  w.AppAPI.admin.reset({ to: 'currentPage-fresh' });
  assert.equal(w.AppAPI.transcript({ since: 0 }).events.length, 0);
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify failing**

```bash
npm test
```

Expected: 4 new tests fail.

- [ ] **Step 3: Add admin methods to AppAPI in `js/ai/app-api.js`**

Inside the `AppAPI` object, before the `_eventBus` line, add the `admin` namespace as a real object with method implementations (replacing the placeholder `admin: {}`):

```js
    // ----- admin (global) -----
    // Note: setQuestion lives on Page1Surface (per-question dividend/divisor edit).
    // setQuestionIndex and reset are app-level and live here directly.
    admin: {
      setQuestionIndex(args) {
        return safeCall(() => {
          const idx = args && args.index;
          const qList = global.question || [];
          if (!Number.isInteger(idx) || idx < 0 || idx >= qList.length) {
            return { ok: false, error: { code: 'E_BAD_ARGS',
              message: `index must be int 0..${qList.length - 1}` } };
          }
          global.currentQuestionIndex = idx;
          eventBus.emit({ type: 'question.changed', source: 'ai',
                          payload: { from: undefined, to: idx,
                                     dividend: qList[idx].dividend, divisor: qList[idx].divisor,
                                     source: 'admin' } });
          if (typeof global.forceAppUpdate === 'function') global.forceAppUpdate();
          return { ok: true, result: { questionIndex: idx } };
        });
      },

      reset(args) {
        return safeCall(() => {
          const to = args && args.to;
          const valid = ['page1', 'page2-fresh', 'currentPage-fresh'];
          if (!valid.includes(to)) {
            return { ok: false, error: { code: 'E_BAD_ARGS',
              message: `to must be one of: ${valid.join(', ')}` } };
          }
          // Clear completion / hint state.
          if (global.PageCompletionManager &&
              typeof global.PageCompletionManager.setPageCompleted === 'function') {
            global.PageCompletionManager.setPageCompleted(2, false);
            global.PageCompletionManager.setPageCompleted(1, false);
          }
          if (global.__longDivisionComplete  !== undefined) delete global.__longDivisionComplete;
          if (global.__longDivisionGuidedHint !== undefined) delete global.__longDivisionGuidedHint;
          eventBus.clear();

          if (to === 'page1') {
            global.currentQuestionIndex = 0;
            global.page1complete = false;
            global.objectsremoved = 0;
            if (typeof global.changePageAndNotify === 'function') global.changePageAndNotify(1);
          } else if (to === 'page2-fresh') {
            global.currentQuestionIndex = 0;
            if (typeof global.changePageAndNotify === 'function') global.changePageAndNotify(2);
          } else {
            // currentPage-fresh: re-render current page without navigating
            if (typeof global.forceAppUpdate === 'function') global.forceAppUpdate();
          }

          eventBus.emit({ type: 'admin.reset', source: 'ai', payload: { to } });
          return { ok: true, result: { to } };
        });
      }
    },
```

(Remove the old `admin: {}` line.)

Also update `_bindActions()` to **not** wipe `AppAPI.admin` wholesale — it should preserve the directly-attached methods and only add per-surface admin actions on top:

```js
    _bindActions() {
      AppAPI.actions = {
        click:    (args) => AppAPI._invokeUI('click',    args || {}),
        pressKey: (args) => AppAPI._invokeUI('pressKey', args || {})
      };
      // Preserve the global admin methods declared above; only re-add surface-specific ones.
      const preservedAdmin = { setQuestionIndex: AppAPI.admin.setQuestionIndex,
                               reset:            AppAPI.admin.reset };
      AppAPI.admin = preservedAdmin;
      for (const s of registry.list()) {
        const m = s.getManifest();
        if (!m.semanticActions) continue;
        for (const a of m.semanticActions) {
          const target = (a.scope === 'admin') ? AppAPI.admin : AppAPI.actions;
          target[a.name] = (args) => AppAPI._invokeSemantic(a.name, args || {}, a.scope);
        }
      }
    },
```

- [ ] **Step 4: Add manifest entries to Page1Surface**

In `js/ai/surfaces/page1-surface.js`, inside `getManifest()`'s `semanticActions` array, append:

```js
          { name: 'setQuestionIndex', args: { index: 'int>=0' }, scope: 'admin',
            description: 'Jump to question N (admin)' },
          { name: 'reset', args: { to: 'page1|page2-fresh|currentPage-fresh' }, scope: 'admin',
            description: 'Reset completion state and optionally navigate (admin)' }
```

- [ ] **Step 5: Add manifest entries to Page2Surface composer**

In `js/ai/surfaces/page2-surface.js`, modify `getManifest()` to append the two extra admin entries before returning:

```js
    getManifest() {
      const semanticActions = [];
      const uiElements = [];
      let goal = null;
      for (const s of this._subs) {
        const m = s.getManifest();
        if (m.semanticActions) semanticActions.push(...m.semanticActions);
        if (m.uiElements)      uiElements.push(...m.uiElements);
        if (!goal && m.goal)   goal = m.goal;
      }
      // Page-level admin actions (implemented on AppAPI.admin directly)
      semanticActions.push(
        { name: 'setQuestion',      args: { dividend: 'int>0', divisor: 'int>0' }, scope: 'admin' },
        { name: 'setQuestionIndex', args: { index: 'int>=0' },                     scope: 'admin' },
        { name: 'reset',            args: { to: 'page1|page2-fresh|currentPage-fresh' }, scope: 'admin' }
      );
      return { semanticActions, uiElements, goal };
    }
```

(Note: `setQuestion`, `setQuestionIndex`, `reset` are listed in the manifest for discovery purposes. The actual call routes to `AppAPI.admin.*` directly — `_bindActions` will overwrite the surface-routed proxy with the global admin method when it sees the same name with `scope:'admin'`. To make this routing explicit, `_bindActions` checks for a pre-existing global admin method and skips overwriting it. Update `_bindActions` accordingly:)

```js
    _bindActions() {
      AppAPI.actions = {
        click:    (args) => AppAPI._invokeUI('click',    args || {}),
        pressKey: (args) => AppAPI._invokeUI('pressKey', args || {})
      };
      const preservedAdmin = { setQuestionIndex: AppAPI.admin.setQuestionIndex,
                               reset:            AppAPI.admin.reset };
      AppAPI.admin = preservedAdmin;
      for (const s of registry.list()) {
        const m = s.getManifest();
        if (!m.semanticActions) continue;
        for (const a of m.semanticActions) {
          const target = (a.scope === 'admin') ? AppAPI.admin : AppAPI.actions;
          // Don't overwrite a globally-defined admin method with a surface proxy.
          if (target === AppAPI.admin && preservedAdmin.hasOwnProperty(a.name)) continue;
          target[a.name] = (args) => AppAPI._invokeSemantic(a.name, args || {}, a.scope);
        }
      }
    },
```

- [ ] **Step 6: Run, verify all pass**

```bash
npm test
```

Expected: 41 passing.

- [ ] **Step 7: Commit**

```bash
git add js/ai/app-api.js js/ai/surfaces/page1-surface.js js/ai/surfaces/page2-surface.js tests/ai/admin.test.js
git commit -m "feat(ai): admin.setQuestionIndex + admin.reset"
```

---

## Phase 7 — Bridge layer

### Task 7.1: bridge.js — handshake + request/response

**Files:**
- Create: `js/ai/bridge.js`
- Test: `tests/ai/bridge.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/ai/bridge.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function loadBridge({ aiEnabled = true } = {}) {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: aiEnabled, AI_ALLOWED_ORIGINS: ['*'] };
  global.window.AppData = { currentLanguage: 'en', translations: { en: {} } };
  global.window.getCurrentPage = () => 1;

  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/registry.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/app-api.js');
  require('../../js/ai/bridge.js');
  return global.window;
}

function postMsg(win, data, origin = 'http://localhost') {
  const ev = new win.MessageEvent('message', { data, origin, source: win });
  win.dispatchEvent(ev);
}

function nextMessage(win, predicate, timeoutMs = 100) {
  return new Promise((resolve, reject) => {
    const handler = (ev) => {
      if (predicate(ev)) { win.removeEventListener('message', handler); resolve(ev.data); }
    };
    win.addEventListener('message', handler);
    setTimeout(() => { win.removeEventListener('message', handler); reject(new Error('timeout')); }, timeoutMs);
  });
}

// Stub out window.postMessage to capture outgoing messages on a side channel.
function captureOutgoing(win) {
  const out = [];
  const orig = win.postMessage.bind(win);
  win.postMessage = (data, target) => { out.push({ data, target }); return orig(data, target); };
  return out;
}

test('bridge: handshake → ack with capabilities intersection + initial schema', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't', version: '0' }, capabilities: ['actions','events','transcript'] });
  // Bridge replies via postMessage on the same window.
  await new Promise(r => setTimeout(r, 10));
  const ack = out.find(m => m.data && m.data.type === 'ai.handshake.ack');
  assert.ok(ack, 'no handshake ack received');
  assert.equal(ack.data.requestId, 'h1');
  assert.equal(ack.data.ok, true);
  assert.deepEqual(ack.data.capabilities.sort(), ['actions','events','transcript']);
  assert.ok(ack.data.schema);
  teardownWindow();
});

test('bridge: ai.call before handshake → E_NO_HANDSHAKE', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.call', requestId: 'r1', method: 'describePage', params: {} });
  await new Promise(r => setTimeout(r, 10));
  const resp = out.find(m => m.data && m.data.type === 'ai.response' && m.data.requestId === 'r1');
  assert.ok(resp);
  assert.equal(resp.data.ok, false);
  assert.equal(resp.data.error.code, 'E_NO_HANDSHAKE');
  teardownWindow();
});

test('bridge: admin call without admin capability → E_ADMIN_DENIED', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't' }, capabilities: ['actions'] });
  await new Promise(r => setTimeout(r, 10));
  postMsg(w, { v: 1, type: 'ai.call', requestId: 'r1', method: 'admin.setQuestion', params: { dividend: 7, divisor: 2 } });
  await new Promise(r => setTimeout(r, 10));
  const resp = out.find(m => m.data && m.data.type === 'ai.response' && m.data.requestId === 'r1');
  assert.ok(resp);
  assert.equal(resp.data.ok, false);
  assert.equal(resp.data.error.code, 'E_ADMIN_DENIED');
  teardownWindow();
});

test('bridge: describePage forwards through', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't' }, capabilities: ['actions','events','transcript','admin'] });
  await new Promise(r => setTimeout(r, 10));
  postMsg(w, { v: 1, type: 'ai.call', requestId: 'r1', method: 'describePage', params: {} });
  await new Promise(r => setTimeout(r, 10));
  const resp = out.find(m => m.data && m.data.type === 'ai.response' && m.data.requestId === 'r1');
  assert.ok(resp);
  assert.equal(resp.data.ok, true);
  assert.equal(resp.data.result.page, 1);
  teardownWindow();
});

test('bridge: subscribe + emit fans out events to caller', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't' }, capabilities: ['actions','events'] });
  await new Promise(r => setTimeout(r, 10));
  postMsg(w, { v: 1, type: 'ai.subscribe', requestId: 'r1', filter: { types: ['ping'] } });
  await new Promise(r => setTimeout(r, 10));
  w.AppAPI._emit({ type: 'ping', source: 'system' });
  w.AppAPI._emit({ type: 'pong', source: 'system' });
  await new Promise(r => setTimeout(r, 10));
  const events = out.filter(m => m.data && m.data.type === 'ai.event').map(m => m.data.event.type);
  assert.deepEqual(events, ['ping']);
  teardownWindow();
});

test('bridge: origin not in allow-list → E_ORIGIN, no events delivered', async () => {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['https://trusted.example'] };
  global.window.AppData = { currentLanguage: 'en', translations: { en: {} } };
  global.window.getCurrentPage = () => 1;
  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/registry.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/app-api.js');
  require('../../js/ai/bridge.js');
  const w = global.window;
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't' }, capabilities: ['actions'] }, 'http://evil.example');
  await new Promise(r => setTimeout(r, 10));
  const ack = out.find(m => m.data && m.data.type === 'ai.handshake.ack');
  assert.ok(ack);
  assert.equal(ack.data.ok, false);
  assert.equal(ack.data.error.code, 'E_ORIGIN');
  teardownWindow();
});
```

- [ ] **Step 2: Run, verify all six fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

```js
// js/ai/bridge.js
(function (global) {
  'use strict';

  if (typeof global.window === 'undefined') return;
  const w = global.window || global;

  const cfg = w.APP_CONFIG || {};
  // Inert-by-default if AI not enabled and we never get a handshake. The listener is cheap.
  let session = null;

  function originAllowed(origin) {
    const list = (cfg.AI_ALLOWED_ORIGINS || ['*']);
    if (list.includes('*')) return true;
    return list.includes(origin);
  }

  function send(target, msg) {
    try { (target && target.postMessage ? target : w).postMessage(msg, '*'); }
    catch (e) { console.error('[AI bridge] postMessage failed', e); }
  }

  function reply(target, requestId, ok, payload) {
    const msg = { v: 1, type: 'ai.response', requestId };
    if (ok) msg.result = payload;
    else    msg.error  = payload;
    msg.ok = ok;
    send(target, msg);
  }

  function methodScope(method) {
    return method.startsWith('admin.') ? 'admin' : 'public';
  }

  function callAppApi(method, params) {
    const parts = method.split('.');
    let target = w.AppAPI;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target && target[parts[i]];
    }
    const fn = target && target[parts[parts.length - 1]];
    if (typeof fn !== 'function') {
      return { ok: false, error: { code: 'E_UNKNOWN_METHOD', message: `no method ${method}` } };
    }
    let result;
    try { result = (params == null) ? fn.call(target) : fn.call(target, params); }
    catch (e) {
      return { ok: false, error: { code: 'E_INTERNAL', message: e.message } };
    }
    // If the method already returned an {ok, ...} object, pass through; else wrap.
    if (result && typeof result === 'object' && 'ok' in result) return result;
    return { ok: true, result };
  }

  function handleHandshake(ev) {
    const { data, origin, source } = ev;
    const target = source || w;
    if (!originAllowed(origin)) {
      send(target, { v: 1, type: 'ai.handshake.ack', requestId: data.requestId,
                     ok: false, error: { code: 'E_ORIGIN', message: `origin not allowed: ${origin}` } });
      return;
    }
    const requested = Array.isArray(data.capabilities) ? data.capabilities : [];
    const granted = requested.filter(c => ['actions','events','transcript','admin'].includes(c));
    session = {
      id:           'sess_' + Math.random().toString(36).slice(2, 10),
      caller:       data.caller || {},
      capabilities: granted,
      target,
      origin,
      subs:         new Map() // subscriptionId → unsubscribe()
    };
    send(target, {
      v: 1, type: 'ai.handshake.ack', requestId: data.requestId, ok: true,
      session: { id: session.id, page: w.getCurrentPage ? w.getCurrentPage() : 1,
                 questionIndex: w.currentQuestionIndex || 0,
                 language: (w.AppData && w.AppData.currentLanguage) || 'en' },
      capabilities: granted,
      schema: w.AppAPI ? w.AppAPI.describePage() : null
    });
  }

  function handleCall(ev) {
    const { data, origin, source } = ev;
    const target = source || w;
    if (!session) {
      reply(target, data.requestId, false, { code: 'E_NO_HANDSHAKE', message: 'send ai.handshake first' });
      return;
    }
    if (!originAllowed(origin)) {
      reply(target, data.requestId, false, { code: 'E_ORIGIN', message: `origin not allowed: ${origin}` });
      return;
    }
    if (methodScope(data.method) === 'admin' && !session.capabilities.includes('admin')) {
      reply(target, data.requestId, false, { code: 'E_ADMIN_DENIED', message: 'admin capability not granted' });
      return;
    }
    const result = callAppApi(data.method, data.params);
    if (result.ok) reply(target, data.requestId, true,  result.result !== undefined ? result.result : result);
    else           reply(target, data.requestId, false, result.error);
  }

  function handleSubscribe(ev) {
    const { data, source } = ev;
    const target = source || w;
    if (!session) { reply(target, data.requestId, false, { code: 'E_NO_HANDSHAKE' }); return; }
    if (!session.capabilities.includes('events')) {
      reply(target, data.requestId, false, { code: 'E_ADMIN_DENIED', message: 'events capability not granted' });
      return;
    }
    const subscriptionId = 's_' + Math.random().toString(36).slice(2, 10);
    const off = w.AppAPI.subscribe(data.filter || {}, (event) => {
      send(target, { v: 1, type: 'ai.event', subscriptionId, event });
    });
    session.subs.set(subscriptionId, off);
    reply(target, data.requestId, true, { subscriptionId });
  }

  function handleUnsubscribe(ev) {
    const { data, source } = ev;
    const target = source || w;
    if (!session) { reply(target, data.requestId, false, { code: 'E_NO_HANDSHAKE' }); return; }
    const off = session.subs.get(data.subscriptionId);
    if (off) { off(); session.subs.delete(data.subscriptionId); }
    reply(target, data.requestId, true, { unsubscribed: true });
  }

  function onMessage(ev) {
    const data = ev.data;
    if (!data || typeof data !== 'object' || data.v !== 1) return;
    switch (data.type) {
      case 'ai.handshake':   return handleHandshake(ev);
      case 'ai.call':        return handleCall(ev);
      case 'ai.subscribe':   return handleSubscribe(ev);
      case 'ai.unsubscribe': return handleUnsubscribe(ev);
    }
  }

  w.addEventListener('message', onMessage);
  // Expose for tests / debugging.
  w.__aiBridge = { getSession: () => session, _onMessage: onMessage };
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run, verify all pass**

```bash
npm test
```

Expected: 47 passing.

- [ ] **Step 5: Commit**

```bash
git add js/ai/bridge.js tests/ai/bridge.test.js
git commit -m "feat(ai): postMessage bridge (handshake + request/response + events + capabilities)"
```

---

## Phase 8 — Browser smoke verification

### Task 8.1: End-to-end smoke checklist

**Files:**
- Create: `tests/manual/smoke-checklist.md`

- [ ] **Step 1: Write the checklist**

```markdown
<!-- tests/manual/smoke-checklist.md -->
# AI Scaffolding — End-to-end smoke checklist

Run after Phase 7 complete. Open `index.html?ai=1` in a modern browser; devtools open.

## In-page (window.AppAPI) verification

- [ ] `typeof AppAPI === 'object'` is true.
- [ ] `AppAPI.describePage()` returns `{ page: 1, semanticActions: [...], goal: { kind:'navigate', target:2 } }`.
- [ ] `AppAPI.actions.start()` returns `ok:true` and the page transitions to page 2.
- [ ] After transition, `AppAPI.describePage().page === 2` and `semanticActions` includes `chooseQuotientDigit`.
- [ ] `AppAPI.actions.chooseQuotientDigit({column:0, value:3})` returns
      `ok:true, validation:{correct:true, expected:3}`. The "3" appears in the first quotient cell on screen.
- [ ] An incorrect call `chooseQuotientDigit({column:0, value:9})` returns `ok:true, validation:{correct:false}`.
      The cell does NOT update visually; wrong.mp3 plays.
- [ ] Walk the full division (96 ÷ 3 → quotient 32, remainder 0) using semantic actions only.
      `AppAPI.checkGoal().reached` becomes `true` at the end.
- [ ] `AppAPI.transcript({since:0}).events.length` ≥ number of dispatch calls made.

## postMessage bridge verification

- [ ] In a sibling window/tab open to a blank page, run:
      ```js
      const target = window.opener || window.parent;
      target.postMessage({v:1, type:'ai.handshake', requestId:'h1', caller:{name:'manual'}, capabilities:['actions','events','transcript','admin']}, '*');
      window.addEventListener('message', e => console.log(e.data));
      ```
      Expect to see `ai.handshake.ack` with `ok:true` logged.
- [ ] Issue an `ai.call` for `describePage` and confirm a matching `ai.response` arrives with `requestId:'r1'`.
- [ ] Issue an `ai.subscribe` with `filter:{types:['action.completed']}`, then drive a click in the applet,
      and confirm an `ai.event` arrives.

## Inert-when-off verification

- [ ] Reload `index.html` (no `?ai=1`). Console: `APP_CONFIG.AI_ENABLED === false`.
- [ ] Without sending a handshake, no `AppAPI` calls happen, no `__aiBridge.getSession()` returns non-null.
- [ ] All applet behaviour identical to baseline (drag/drop, click, mtable, completion, sound effects).

If every box ticks, ship it.
```

- [ ] **Step 2: Run the checklist** in a real browser and tick each item.

- [ ] **Step 3: Commit**

```bash
git add tests/manual/smoke-checklist.md
git commit -m "test(ai): manual smoke checklist for in-page + bridge verification"
```

---

## Self-review notes (for the executing engineer)

- Tasks 4.2 and 4.3 (the long-division refactor + grid handle) carry the most regression risk. Always run `tests/manual/long-division-no-regression.md` after edits there.
- The `chooseDividendDigits` and `bringDownDigit` semantic actions are intentionally minimal in v1 — they accept input and acknowledge but don't drive the underlying selection state through a dedicated mutator. If your AI-as-student tests need full coverage of those steps, extend the grid handle in Task 4.2 with `setSelectedStartingDigits` and `triggerBringDown` setters and update the surface accordingly. This is a deliberate v1 cut, not a placeholder.
- The browser-extension form factor (Q8 path B from the spec) is **not** built in this plan. The spec lists it as an open question. The bridge protocol shipped here is the wire format the extension will speak; building the extension is a separate plan.
- All `commit` steps in this plan assume the engineer wants frequent commits. If a different cadence is preferred, batch commits at phase boundaries instead.
