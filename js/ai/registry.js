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
