// tests/ai/app-api-readonly.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['*'] };
  delete require.cache[require.resolve('../../js/ai/errors.js')];
  delete require.cache[require.resolve('../../js/ai/event-bus.js')];
  delete require.cache[require.resolve('../../js/ai/control-surface.js')];
  delete require.cache[require.resolve('../../js/ai/registry.js')];
  delete require.cache[require.resolve('../../js/ai/i18n-payload.js')];
  delete require.cache[require.resolve('../../js/ai/app-api.js')];
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
