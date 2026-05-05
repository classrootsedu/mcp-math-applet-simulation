// js/ai/surfaces/nav-surface.js
(function (global) {
  'use strict';

  class NavSurface extends global.AIControlSurface {
    constructor(page) { super(); this._page = page; this._eventBus = null; }
    get id()    { return `nav-surface-page${this._page}`; }
    get kind()  { return 'navigation'; }
    get scope() { return { page: this._page }; }

    attach(eventBus) { this._eventBus = eventBus; }
    detach()         { this._eventBus = null; }

    _emitPageChanged(from, to) {
      if (this._eventBus && typeof this._eventBus.emit === 'function') {
        this._eventBus.emit({ type: 'page.changed', source: 'ai',
                              page: from, payload: { from, to } });
      }
    }

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
      let to = null;
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
          to = 1;
        } else {
          global.currentQuestionIndex = currentIndex + 1;
          if (typeof global.changePageAndNotify === 'function') global.changePageAndNotify(2);
          to = 2;
        }
      } else if (this._page === 1) {
        if (typeof global.changePageAndNotify === 'function') global.changePageAndNotify(2);
        to = 2;
      }
      if (to !== null && to !== this._page) this._emitPageChanged(this._page, to);
      return { ok: true, actionId: action.actionId, page: this._page,
               stepBefore: 'navIdle', stepAfter: 'navIdle',
               validation: { correct: true }, feedback: null, stateDelta: {} };
    }

    _prev(action) {
      let to = null;
      if (this._page === 2) {
        if (typeof global.changePageAndNotify === 'function') global.changePageAndNotify(1);
        to = 1;
      }
      if (to !== null && to !== this._page) this._emitPageChanged(this._page, to);
      return { ok: true, actionId: action.actionId, page: this._page,
               stepBefore: 'navIdle', stepAfter: 'navIdle',
               validation: { correct: true }, feedback: null, stateDelta: {} };
    }
  }

  global.NavSurface = NavSurface;
})(typeof window !== 'undefined' ? window : globalThis);
