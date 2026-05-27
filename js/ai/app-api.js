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

    // ----- AI idle auto-step -----
    // Perform the SINGLE next correct guided step on the current page, using
    // the applet's own knowledge of the answer. Called by the host on an idle
    // timeout (via ai.call method:"aiAutoStep") so the student visibly sees
    // the step happen. Delegates to the active page's surface.autoStep().
    //
    // Crucially this runs IN the applet against the live iframe state, so it
    // does the right thing regardless of what the server-side MCP browser
    // thinks the state is. It is also reliable where the LLM is not — the
    // model narrates "I'll select 9" without emitting a tool call; this does
    // the actual move. Emits source:'ai' so the host bridge (which only
    // relays source:'student') does not echo it back as a student turn.
    aiAutoStep() {
      return safeCall(() => {
        const page = currentPage();
        const surfaces = registry.forPage(page) || [];
        for (const s of surfaces) {
          if (typeof s.autoStep !== 'function') continue;
          const r = s.autoStep();
          if (r && r.ok !== false) {
            eventBus.emit({ type: 'action.completed', source: 'ai', page,
                            payload: { name: 'aiAutoStep', surface: s.id, result: r } });
            console.log('🔗 [AI bridge] aiAutoStep performed on', s.id, '→', r.stepAfter || r);
            return r;
          }
        }
        return { ok: false, error: { code: 'E_NO_AUTOSTEP',
                                     message: `no surface could auto-step on page ${page}` } };
      });
    },

    // ----- transcript / events -----
    subscribe(filter, cb) { return eventBus.subscribe(filter, cb); },
    transcript(opts)      { return eventBus.transcript(opts); },

    // ----- actions -----
    actions: {},   // populated lazily by _bindActions; per-name proxies live here

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

          return { ok: true, result: { to } };
        });
      }
    },

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
      // Preserve the global admin methods declared above; only re-add surface-specific ones.
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

    _invokeSemantic(name, args, scope) {
      return safeCall(() => {
        const page = currentPage();
        const actionId = 'act_' + (++AppAPI._actionSeq);
        const action = { kind: 'semantic', name, args, source: 'ai', actionId, scope };
        eventBus.emit({ type: 'action.requested', source: 'ai', page, actionId,
                        payload: { name, args, scope } });
        let result = registry.dispatch(page, action);
        // Tutor envelope merge — only for non-admin semantic actions when tutor capability is on.
        if (AppAPI._tutorCapabilityActive && scope !== 'admin') {
          const owner = registry.findOwner(page, name);
          if (owner && typeof owner.getTutorPayload === 'function') {
            try {
              const payload = owner.getTutorPayload(action, result);
              if (payload && typeof payload === 'object') {
                result = Object.assign({}, result, {
                  input: payload.input || result.input,
                  tutor: payload.tutor,
                  next:  payload.next
                });
              }
            } catch (e) {
              console.error('[AppAPI] getTutorPayload threw', e);
            }
          }
        }
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
    _actionSeq: 0,
    _tutorCapabilityActive: false
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
