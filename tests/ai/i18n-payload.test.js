const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load(currentLanguage = 'id') {
  newWindow();
  global.window.AppData = {
    currentLanguage,
    translations: {
      en: { hello: 'Hello {name}', nested: { msg: 'Top' } },
      id: { hello: 'Halo {name}' }                         // nested.msg missing → en fallback
    }
  };
  delete require.cache[require.resolve('../../js/ai/i18n-payload.js')];
  require('../../js/ai/i18n-payload.js');
  return global.window;
}

test('buildLocalizedPayload: returns ui+en+i18nKey+params', () => {
  const w = load('id');
  const p = w.buildLocalizedPayload({ key: 'hello', params: { name: 'Asep' } });
  assert.deepEqual(p, {
    ui:      'Halo Asep',
    en:      'Hello Asep',
    i18nKey: 'hello',
    params:  { name: 'Asep' }
  });
  teardownWindow();
});

test('buildLocalizedPayload: missing UI key falls back to English', () => {
  const w = load('id');
  const p = w.buildLocalizedPayload({ key: 'nested.msg' });
  assert.equal(p.ui, 'Top');
  assert.equal(p.en, 'Top');
  teardownWindow();
});

test('buildLocalizedPayload: missing in both languages → ui/en are null', () => {
  const w = load('id');
  const p = w.buildLocalizedPayload({ key: 'does.not.exist' });
  assert.equal(p.ui, null);
  assert.equal(p.en, null);
  assert.equal(p.i18nKey, 'does.not.exist');
  teardownWindow();
});
