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
