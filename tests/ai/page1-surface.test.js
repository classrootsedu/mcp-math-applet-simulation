const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  delete require.cache[require.resolve('../../js/ai/errors.js')];
  delete require.cache[require.resolve('../../js/ai/event-bus.js')];
  delete require.cache[require.resolve('../../js/ai/control-surface.js')];
  delete require.cache[require.resolve('../../js/ai/registry.js')];
  delete require.cache[require.resolve('../../js/ai/i18n-payload.js')];
  delete require.cache[require.resolve('../../js/ai/surfaces/page1-surface.js')];
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['*'] };
  global.window.AppData = {
    currentLanguage: 'en',
    translations: {
      en: { pages: { page1: { startButton: 'Start', headerWhatIs: 'What is' } } },
      id: { pages: { page1: { startButton: 'Mulai', headerWhatIs: 'Berapa' } } }
    }
  };
  global.window.question = [{ dividend: 96, divisor: 3 }];
  global.window.currentQuestionIndex = 0;
  let lastNav = null;
  global.window.changePageAndNotify = (n) => { lastNav = n; };
  Object.defineProperty(global.window, '_lastNav', { get: () => lastNav });
  global.window.getCurrentPage = () => 1;
  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/registry.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/surfaces/page1-surface.js');
  return global.window;
}

test('page1-surface: manifest lists start + setQuestion (admin)', () => {
  const w = load();
  const s = new w.Page1Surface();
  const m = s.getManifest();
  assert.deepEqual(m.semanticActions.map(a => a.name).sort(), ['setQuestion', 'start']);
  assert.equal(m.semanticActions.find(a => a.name === 'setQuestion').scope, 'admin');
  assert.equal(m.goal.kind, 'navigate');
  assert.equal(m.goal.target, 2);
  teardownWindow();
});

test('page1-surface: dispatch start → calls changePageAndNotify(2)', () => {
  const w = load();
  const s = new w.Page1Surface();
  const r = s.dispatch({ kind: 'semantic', name: 'start', args: {}, source: 'ai', actionId: 'a1' });
  assert.equal(r.ok, true);
  assert.equal(w._lastNav, 2);
  assert.equal(r.stepBefore, 'tapStartButton');
  teardownWindow();
});

test('page1-surface: dispatch setQuestion mutates window.question', () => {
  const w = load();
  const s = new w.Page1Surface();
  const r = s.dispatch({ kind: 'semantic', name: 'setQuestion', args: { dividend: 248, divisor: 7 }, source: 'ai', actionId: 'a2' });
  assert.equal(r.ok, true);
  assert.equal(w.question[0].dividend, 248);
  assert.equal(w.question[0].divisor, 7);
  teardownWindow();
});

test('page1-surface: dispatch unknown action → E_UNKNOWN_METHOD', () => {
  const w = load();
  const s = new w.Page1Surface();
  const r = s.dispatch({ kind: 'semantic', name: 'nonexistent', args: {}, source: 'ai', actionId: 'a3' });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'E_UNKNOWN_METHOD');
  teardownWindow();
});

test('page1-surface: checkGoal reached when getCurrentPage() === 2', () => {
  const w = load();
  const s = new w.Page1Surface();
  assert.equal(s.checkGoal().reached, false);
  w.getCurrentPage = () => 2;
  assert.equal(s.checkGoal().reached, true);
  teardownWindow();
});
