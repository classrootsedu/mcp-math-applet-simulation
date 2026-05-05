// tests/ai/page2-surface.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.AppData = { currentLanguage: 'en', translations: { en: {} } };
  global.window.question = [{ dividend: 96, divisor: 3 }];
  global.window.currentQuestionIndex = 0;
  global.window.__longDivisionGridHandle = {
    applyDigit: () => ({ accepted: true, correct: true, expected: 3, advancedTo: null, hint: null }),
    getGuidedValues: () => ({}), getGuidedValidation: () => ({}),
    getGuidedSteps: () => [{ type: 'quotient', cellKey: 'quotient-0' }],
    getGuidedStepIndex: () => 0,
    getProblem: () => ({ dividend: 96, divisor: 3 }),
    getSelectedStartingDigits: () => []
  };
  global.window.changePageAndNotify = () => {};
  global.window.PageCompletionManager = { setPageCompleted: () => {} };
  // cache-busting:
  ['errors','event-bus','control-surface','i18n-payload',
   'surfaces/long-division-surface','surfaces/mtable-surface','surfaces/nav-surface','surfaces/page2-surface']
    .forEach(m => { try { delete require.cache[require.resolve(`../../js/ai/${m}.js`)]; } catch(_) {} });
  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/surfaces/long-division-surface.js');
  require('../../js/ai/surfaces/mtable-surface.js');
  require('../../js/ai/surfaces/nav-surface.js');
  require('../../js/ai/surfaces/page2-surface.js');
  return global.window;
}

test('page2-surface: composes long-division + nav + mtable', () => {
  const w = load();
  const s = new w.Page2Surface();
  const m = s.getManifest();
  const names = m.semanticActions.map(a => a.name);
  assert.ok(names.includes('chooseQuotientDigit'));
  assert.ok(names.includes('clickNext'));
  assert.ok(names.includes('selectMultiplicationTableRow'));
  teardownWindow();
});

test('page2-surface: dispatch routes to the sub-surface owning the action', () => {
  const w = load();
  const s = new w.Page2Surface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 0, value: 3 }, source: 'ai', actionId: 'p1' });
  assert.equal(r.ok, true);
  assert.equal(r.validation.correct, true);
  teardownWindow();
});
