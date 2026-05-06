const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true };
  global.window.AppData = {
    currentLanguage: 'en',
    translations: {
      en: {
        tutor: {
          quotient: {
            correct: 'Great! {accepted} × {divisor} = {product}.',
            incorrect: { tooHigh: '{accepted} × {divisor} = {productAccepted}, > {value}.' },
            points:   { confirm: 'ok', transition: 'next', reframe: 'reframe', encourage: 'enc', askMtable: 'mt' },
            nextHint: { retry: 'try', transition: 'next' },
            reco: '{expected} × {divisor} = {expectedProduct}.'
          }
        }
      }
    }
  };
  global.window.question = [{ dividend: 96, divisor: 3 }];
  global.window.currentQuestionIndex = 0;
  const guidedValues = {};
  global.window.__longDivisionGridHandle = {
    applyDigit: ({ cellKey, value }) => {
      const expected = (cellKey === 'quotient-0') ? 3 : 0;
      const correct = value === expected;
      if (correct) guidedValues[cellKey] = value;
      return { accepted: true, correct, expected, advancedTo: correct ? 'writePartialProduct' : null, hint: null };
    },
    getGuidedValues:    () => guidedValues,
    getGuidedValidation:() => ({}),
    getGuidedSteps:     () => [{ type: 'quotient', cellKey: 'quotient-0', correctValue: 3 }],
    getGuidedStepIndex: () => 0,
    getProblem:         () => ({ dividend: 96, divisor: 3 }),
    getSelectedStartingDigits: () => [],
    selectStartingDigit: () => {}
  };
  ['errors','event-bus','control-surface','i18n-payload','surfaces/long-division-surface']
    .forEach(m => { try { delete require.cache[require.resolve(`../../js/ai/${m}.js`)]; } catch(_) {} });
  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/surfaces/long-division-surface.js');
  return global.window;
}

test('long-division tutor: chooseQuotientDigit correct → tutor.completionDialogue uses tutor.quotient.correct', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const action = { kind:'semantic', name:'chooseQuotientDigit', args:{column:0, value:3}, source:'ai', actionId:'a1' };
  const result = s.dispatch(action);
  const p = s.getTutorPayload(action, result);
  assert.ok(p);
  assert.ok(p.tutor);
  assert.equal(p.tutor.completionDialogue.i18nKey, 'tutor.quotient.correct');
  assert.equal(p.tutor.completionDialogue.en, 'Great! 3 × 3 = 9.');
  teardownWindow();
});

test('long-division tutor: chooseQuotientDigit wrong (too high) → incorrect.tooHigh i18nKey', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const action = { kind:'semantic', name:'chooseQuotientDigit', args:{column:0, value:5}, source:'ai', actionId:'a2' };
  const result = s.dispatch(action);
  const p = s.getTutorPayload(action, result);
  assert.equal(p.tutor.completionDialogue.i18nKey, 'tutor.quotient.incorrect.tooHigh');
  assert.equal(p.tutor.completionDialogue.params.accepted, 5);
  assert.equal(p.tutor.completionDialogue.params.productAccepted, 15);
  teardownWindow();
});

test('long-division tutor: next.recommended carries pedagogical:true for quotient', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const action = { kind:'semantic', name:'chooseQuotientDigit', args:{column:0, value:5}, source:'ai', actionId:'a3' };
  const result = s.dispatch(action);
  const p = s.getTutorPayload(action, result);
  assert.equal(p.next.recommended.pedagogical, true);
  assert.equal(p.next.recommended.args.value, 3);
  teardownWindow();
});

test('long-division tutor: input.modality reflects ai-direct by default', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const action = { kind:'semantic', name:'chooseQuotientDigit', args:{column:0, value:3}, source:'ai', actionId:'a4' };
  const result = s.dispatch(action);
  const p = s.getTutorPayload(action, result);
  assert.equal(p.input.modality, 'ai-direct');
  teardownWindow();
});

test('long-division tutor: input.modality honors _modality override', () => {
  const w = load();
  const s = new w.LongDivisionSurface();
  const action = { kind:'semantic', name:'chooseQuotientDigit',
                   args:{column:0, value:5, _modality:'ai-relay', _details:{source:'student-via-tutor'}},
                   source:'ai', actionId:'a5' };
  const result = s.dispatch(action);
  const p = s.getTutorPayload(action, result);
  assert.equal(p.input.modality, 'ai-relay');
  assert.equal(p.input.details.source, 'student-via-tutor');
  teardownWindow();
});
