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
