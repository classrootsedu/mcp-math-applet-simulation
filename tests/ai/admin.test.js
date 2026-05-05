// tests/ai/admin.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['*'] };
  global.window.AppData = { currentLanguage: 'en', translations: { en: {} } };
  global.window.question = [{ dividend: 96, divisor: 3 }, { dividend: 13, divisor: 2 }];
  global.window.currentQuestionIndex = 0;
  let lastNav = null;
  global.window.changePageAndNotify = (n) => { lastNav = n; };
  Object.defineProperty(global.window, '_lastNav', { get: () => lastNav });
  global.window.getCurrentPage = () => 1;
  global.window.PageCompletionManager = { setPageCompleted: () => {}, _calls: [] };
  global.window.__longDivisionComplete = true;
  global.window.__longDivisionGuidedHint = { targetId: 'x', text: 'y' };

  // cache-busting:
  ['errors','event-bus','control-surface','registry','i18n-payload','app-api']
    .forEach(m => { try { delete require.cache[require.resolve(`../../js/ai/${m}.js`)]; } catch(_) {} });
  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/registry.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/app-api.js');
  return global.window;
}

test('admin.setQuestionIndex: jumps to question N, validates bounds', () => {
  const w = load();
  const r = w.AppAPI.admin.setQuestionIndex({ index: 1 });
  assert.equal(r.ok, true);
  assert.equal(w.currentQuestionIndex, 1);
  const bad = w.AppAPI.admin.setQuestionIndex({ index: 99 });
  assert.equal(bad.ok, false);
  assert.equal(bad.error.code, 'E_BAD_ARGS');
  teardownWindow();
});

test('admin.reset: clears completion state and navigates per `to`', () => {
  const w = load();
  const r = w.AppAPI.admin.reset({ to: 'page1' });
  assert.equal(r.ok, true);
  assert.equal(w._lastNav, 1);
  assert.equal(w.currentQuestionIndex, 0);
  assert.equal(w.__longDivisionComplete, undefined);
  assert.equal(w.__longDivisionGuidedHint, undefined);
  teardownWindow();
});

test('admin.reset: bad `to` → E_BAD_ARGS', () => {
  const w = load();
  const r = w.AppAPI.admin.reset({ to: 'bogus' });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'E_BAD_ARGS');
  teardownWindow();
});

test('admin.reset: clears event-bus transcript', () => {
  const w = load();
  w.AppAPI._emit({ type: 'a', source: 'system' });
  w.AppAPI._emit({ type: 'b', source: 'system' });
  assert.equal(w.AppAPI.transcript({ since: 0 }).events.length, 2);
  w.AppAPI.admin.reset({ to: 'currentPage-fresh' });
  assert.equal(w.AppAPI.transcript({ since: 0 }).events.length, 0);
  teardownWindow();
});
