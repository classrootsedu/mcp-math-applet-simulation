const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  delete require.cache[require.resolve('../../js/ai/control-surface.js')];
  require('../../js/ai/control-surface.js');
  return global.window.AIControlSurface;
}

test('ControlSurface: required methods throw on base class', () => {
  const Base = load();
  const s = new Base();
  assert.throws(() => s.getManifest(),  /not implemented/);
  assert.throws(() => s.getState(),     /not implemented/);
  assert.throws(() => s.checkGoal(),    /not implemented/);
  assert.throws(() => s.dispatch({}),   /not implemented/);
  teardownWindow();
});

test('ControlSurface: subclass overrides all four methods', () => {
  const Base = load();
  class S extends Base {
    get id()        { return 'test'; }
    get kind()      { return 'page'; }
    get scope()     { return { page: 1 }; }
    getManifest()   { return { semanticActions: [], uiElements: [], goal: null }; }
    getState()      { return { currentStep: 'a', stepContext: {}, expectedActions: [], currentHint: null, uiElementValues: {} }; }
    checkGoal()     { return { reached: true, actual: {} }; }
    dispatch(a)     { return { ok: true, actionId: a.actionId }; }
  }
  const s = new S();
  assert.equal(s.id, 'test');
  assert.equal(s.dispatch({ actionId: 'x' }).actionId, 'x');
  teardownWindow();
});

test('ControlSurface: attach/detach default no-ops', () => {
  const Base = load();
  const s = new Base();
  assert.doesNotThrow(() => s.attach({}));
  assert.doesNotThrow(() => s.detach());
  teardownWindow();
});
