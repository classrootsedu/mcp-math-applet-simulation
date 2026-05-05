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
      // Page-level admin actions. setQuestion is page-1-only (mid-flow replacement
      // on page 2 is intentionally unsupported — navigate back to page 1 to change
      // the dividend/divisor). setQuestionIndex and reset are global and available here.
      semanticActions.push(
        { name: 'setQuestionIndex', args: { index: 'int>=0' },                     scope: 'admin' },
        { name: 'reset',            args: { to: 'page1|page2-fresh|currentPage-fresh' }, scope: 'admin' }
      );
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
