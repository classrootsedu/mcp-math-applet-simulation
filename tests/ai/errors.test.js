// tests/ai/errors.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

test('errors: AI_ERROR_CODES exposed on window', () => {
  newWindow();
  delete require.cache[require.resolve('../../js/ai/errors.js')];
  require('../../js/ai/errors.js');
  assert.equal(global.window.AI_ERROR_CODES.E_ORIGIN, 'E_ORIGIN');
  assert.equal(global.window.AI_ERROR_CODES.E_ADMIN_DENIED, 'E_ADMIN_DENIED');
  teardownWindow();
});

test('errors: AppApiError carries code, message, details', () => {
  newWindow();
  delete require.cache[require.resolve('../../js/ai/errors.js')];
  require('../../js/ai/errors.js');
  const e = new global.window.AppApiError('E_BAD_ARGS', 'bad args', { field: 'value' });
  assert.equal(e.code, 'E_BAD_ARGS');
  assert.equal(e.message, 'bad args');
  assert.deepEqual(e.details, { field: 'value' });
  assert.ok(e instanceof Error);
  teardownWindow();
});
