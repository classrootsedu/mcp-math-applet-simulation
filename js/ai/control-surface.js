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

    /**
     * Optional. Surfaces override to provide tutor narration copy.
     * Called by AppAPI envelope merger when tutor capability is active and
     * the action is semantic (not UI, not admin).
     * @returns {{input?: Object, tutor: Object, next: Object} | null}
     */
    getTutorPayload(_action, _result) { return null; }
  }

  global.AIControlSurface = AIControlSurface;
})(typeof window !== 'undefined' ? window : globalThis);
