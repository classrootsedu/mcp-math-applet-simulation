// tests/ai/nav-surface.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  let nav = null;
  global.window.changePageAndNotify = (n) => { nav = n; };
  Object.defineProperty(global.window, '_lastNav', { get: () => nav });
  global.window.question = [{ dividend: 96, divisor: 3 }, { dividend: 13, divisor: 2 }];
  global.window.currentQuestionIndex = 0;
  global.window.PageCompletionManager = { setPageCompleted: () => {} };
  // cache-busting (mirrors pattern in page1-surface.test.js):
  delete require.cache[require.resolve('../../js/ai/errors.js')];
  delete require.cache[require.resolve('../../js/ai/control-surface.js')];
  delete require.cache[require.resolve('../../js/ai/surfaces/nav-surface.js')];
  require('../../js/ai/errors.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/surfaces/nav-surface.js');
  return global.window;
}

test('nav-surface: clickNext on page 2 mid-bank → next question, stay on page 2', () => {
  const w = load();
  const s = new w.NavSurface(2);
  const r = s.dispatch({ kind: 'semantic', name: 'clickNext', args: {}, source: 'ai', actionId: 'n1' });
  assert.equal(r.ok, true);
  assert.equal(w._lastNav, 2);
  assert.equal(w.currentQuestionIndex, 1);
  teardownWindow();
});

test('nav-surface: clickNext on page 2 last question → reset, return to page 1', () => {
  const w = load();
  w.currentQuestionIndex = 1; // last
  const s = new w.NavSurface(2);
  const r = s.dispatch({ kind: 'semantic', name: 'clickNext', args: {}, source: 'ai', actionId: 'n2' });
  assert.equal(r.ok, true);
  assert.equal(w._lastNav, 1);
  assert.equal(w.currentQuestionIndex, 0);
  teardownWindow();
});

test('nav-surface: clickPrevious on page 2 → page 1', () => {
  const w = load();
  const s = new w.NavSurface(2);
  s.dispatch({ kind: 'semantic', name: 'clickPrevious', args: {}, source: 'ai', actionId: 'n3' });
  assert.equal(w._lastNav, 1);
  teardownWindow();
});
