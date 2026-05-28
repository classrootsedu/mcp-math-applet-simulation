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
          { name: 'clickNext',     args: {}, pedagogical: false, description: 'Press the » button' },
          { name: 'clickPrevious', args: {}, pedagogical: false, description: 'Press the « button' }
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

    // AI idle auto-step: advance to the NEXT question by pressing » — but ONLY
    // when the current page-2 division is actually complete and there are more
    // questions left. This is what unblocks the loop where the division is
    // finished but aiAutoStep had nothing to do (the long-division surface
    // returns ok:false on a complete board, so aiAutoStep falls through to
    // here). We never click » mid-division, and never on the last question
    // (that would wrap back to page 1) — the whole-session-complete case is
    // handled lesson-side via check_session_goal → [ADVANCE].
    autoStep() {
      if (this._page !== 2) {
        return { ok: false, error: { code: 'E_NO_AUTOSTEP', message: 'nav autostep only on page 2' } };
      }
      const divisionDone = (typeof global !== 'undefined') && global.__longDivisionComplete === true;
      if (!divisionDone) {
        return { ok: false, error: { code: 'E_NOT_DONE', message: 'division not complete — not navigating' } };
      }
      const qList = global.question || [];
      const idx   = global.currentQuestionIndex || 0;
      const isLast = qList.length > 0 && idx >= qList.length - 1;
      if (isLast) {
        // Whole session done — do NOT press » (it would wrap to page 1).
        // The lesson advances via check_session_goal on the backend.
        return { ok: false, error: { code: 'E_SESSION_COMPLETE', message: 'all questions complete' },
                 sessionComplete: true };
      }
      const r = this._next({ name: 'clickNext', actionId: 'autostep-' + Date.now(), kind: 'semantic' });
      return Object.assign({ autoStepped: true, advancedQuestion: true,
                             stepAfter: 'nextQuestion' }, r);
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

    getTutorPayload(action, _result) {
      const t = (key, params) => global.buildLocalizedPayload({ key, params });
      const modality = (action.args && action.args._modality) || 'ai-direct';
      const details  = (action.args && action.args._details)  || {};
      const echoArgs = Object.assign({}, action.args);
      delete echoArgs._modality; delete echoArgs._details;
      const input = { action: action.name, args: echoArgs, modality, details };

      if (action.name === 'clickNext') {
        const qList = global.question || [];
        const currentIndex = global.currentQuestionIndex || 0;
        const wasLast = qList.length > 0 && currentIndex >= qList.length - 1;
        const nextQ = wasLast ? null : qList[currentIndex + 1];
        const params = nextQ
          ? { nextDividend: nextQ.dividend, nextDivisor: nextQ.divisor }
          : {};
        return {
          input,
          tutor: {
            completionDialogue: t(wasLast ? 'tutor.nav.next.lastQuestion' : 'tutor.nav.next.midBank', params),
            talkingPoints: [],
            nextStepHint: null
          },
          next: { possible: [], recommended: null }
        };
      }
      if (action.name === 'clickPrevious') {
        return {
          input,
          tutor: {
            completionDialogue: t('tutor.nav.previous', {}),
            talkingPoints: [],
            nextStepHint: null
          },
          next: { possible: [], recommended: null }
        };
      }
      return null;
    }
  }

  global.NavSurface = NavSurface;
})(typeof window !== 'undefined' ? window : globalThis);
