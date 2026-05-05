const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  delete require.cache[require.resolve('../../js/ai/errors.js')];
  delete require.cache[require.resolve('../../js/ai/event-bus.js')];
  delete require.cache[require.resolve('../../js/ai/control-surface.js')];
  delete require.cache[require.resolve('../../js/ai/i18n-payload.js')];
  delete require.cache[require.resolve('../../js/ai/surfaces/long-division-surface.js')];
  global.window.APP_CONFIG = { AI_ENABLED: true };
  global.window.AppData = {
    currentLanguage: 'en',
    translations: { en: { division: { howManyTimes: 'How many times does {divisor} go into {value}?' } } }
  };
  global.window.question = [{ dividend: 96, divisor: 3 }];
  global.window.currentQuestionIndex = 0;

  // Fake grid handle that records calls and emulates the real one.
  const calls = [];
  const guidedValues = {};
  const guidedValidation = {};
  global.window.__longDivisionGridHandle = {
    applyDigit: ({ cellKey, value, source }) => {
      calls.push({ cellKey, value, source });
      const expected = (cellKey === 'quotient-0') ? 3 : 9; // mock expected values for 96÷3
      const correct = value === expected;
      guidedValues[cellKey] = value;
      guidedValidation[cellKey] = { isCorrect: correct, correctValue: expected, userValue: value };
      return { accepted: true, correct, expected, advancedTo: correct ? 'writePartialProduct' : null, hint: null };
    },
    getGuidedValues:    () => guidedValues,
    getGuidedValidation:() => guidedValidation,
    getGuidedSteps:     () => [{ type: 'quotient', cellKey: 'quotient-0' }],
    getGuidedStepIndex: () => 0,
    getProblem:         () => ({ dividend: 96, divisor: 3 }),
    getSelectedStartingDigits: () => []
  };
  global.window._calls = calls;

  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/surfaces/long-division-surface.js');
  return global.window;
}

test('long-division-surface: manifest lists the seven semantic actions', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const names = s.getManifest().semanticActions.map(a => a.name).sort();
  assert.deepEqual(names,
    ['bringDownDigit','chooseDividendDigits','chooseQuotientDigit','selectMultiplicationTableRow',
     'setPartialProduct','setRemainder','setSubtractionResult'].sort());
  teardownWindow();
});

test('long-division-surface: chooseQuotientDigit correct → calls applyDigit, returns validation.correct=true', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 0, value: 3 }, source: 'ai', actionId: 'a1' });
  assert.equal(r.ok, true);
  assert.equal(r.validation.correct, true);
  assert.equal(r.validation.expected, 3);
  assert.equal(w._calls.length, 1);
  assert.equal(w._calls[0].cellKey, 'quotient-0');
  assert.equal(w._calls[0].value, 3);
  assert.equal(w._calls[0].source, 'ai');
  teardownWindow();
});

test('long-division-surface: chooseQuotientDigit wrong → validation.correct=false, no step advance', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 0, value: 9 }, source: 'ai', actionId: 'a2' });
  assert.equal(r.ok, true);
  assert.equal(r.validation.correct, false);
  assert.equal(r.stepBefore, r.stepAfter); // unchanged
  teardownWindow();
});

test('long-division-surface: bad args → E_BAD_ARGS', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 'oops', value: 3 }, source: 'ai', actionId: 'a3' });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'E_BAD_ARGS');
  teardownWindow();
});

test('long-division-surface: missing grid handle → E_NOT_INTERACTABLE', () => {
  const w = load();
  delete w.__longDivisionGridHandle;
  const s = new w.LongDivisionSurface();
  const r = s.dispatch({ kind: 'semantic', name: 'chooseQuotientDigit',
                         args: { column: 0, value: 3 }, source: 'ai', actionId: 'a4' });
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'E_NOT_INTERACTABLE');
  teardownWindow();
});
