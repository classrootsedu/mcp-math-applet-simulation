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
            description: 'Replace the current question (admin)' },
          { name: 'setQuestionIndex', args: { index: 'int>=0' }, scope: 'admin',
            description: 'Jump to question N (admin)' },
          { name: 'reset', args: { to: 'page1|page2-fresh|currentPage-fresh' }, scope: 'admin',
            description: 'Reset completion state and optionally navigate (admin)' }
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
