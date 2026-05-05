const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  delete require.cache[require.resolve('../../js/ai/control-surface.js')];
  delete require.cache[require.resolve('../../js/ai/event-bus.js')];
  delete require.cache[require.resolve('../../js/ai/registry.js')];
  require('../../js/ai/control-surface.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/registry.js');
  return global.window;
}

function fakeSurface(id, page, manifest = {}, state = {}) {
  return {
    id,
    kind: 'grid',
    scope: { page },
    getManifest: () => ({ semanticActions: [], uiElements: [], goal: null, ...manifest }),
    getState:    () => ({ currentStep: 's', stepContext: {}, expectedActions: [], currentHint: null, uiElementValues: {}, ...state }),
    checkGoal:   () => ({ reached: false, actual: {} }),
    dispatch:    (a) => ({ ok: true, actionId: a.actionId, surface: id }),
    attach:      () => {},
    detach:      () => {}
  };
}

test('registry: register/unregister surfaces', () => {
  const w = load();
  const reg = new w.AIRegistry(new w.AIEventBus());
  reg.register(fakeSurface('a', 2));
  assert.equal(reg.list().length, 1);
  reg.unregister('a');
  assert.equal(reg.list().length, 0);
  teardownWindow();
});

test('registry: forCurrentPage filters by current page', () => {
  const w = load();
  const reg = new w.AIRegistry(new w.AIEventBus());
  reg.register(fakeSurface('a', 1));
  reg.register(fakeSurface('b', 2));
  reg.register(fakeSurface('c', 2));
  assert.deepEqual(reg.forPage(1).map(s => s.id), ['a']);
  assert.deepEqual(reg.forPage(2).map(s => s.id).sort(), ['b', 'c']);
  teardownWindow();
});

test('registry: composeDescription unions manifests + states for a page', () => {
  const w = load();
  const reg = new w.AIRegistry(new w.AIEventBus());
  reg.register(fakeSurface('a', 2,
    { semanticActions: [{ name: 'x' }], uiElements: [{ id: 'e1' }], goal: { kind: 'g' } }));
  reg.register(fakeSurface('b', 2,
    { semanticActions: [{ name: 'y' }], uiElements: [{ id: 'e2' }] }));
  const desc = reg.composeDescription(2);
  assert.deepEqual(desc.semanticActions.map(a => a.name).sort(), ['x', 'y']);
  assert.deepEqual(desc.uiElements.map(e => e.id).sort(), ['e1', 'e2']);
  assert.deepEqual(desc.goal, { kind: 'g' });
  teardownWindow();
});

test('registry: dispatch routes to the surface owning the action', () => {
  const w = load();
  const reg = new w.AIRegistry(new w.AIEventBus());
  reg.register(fakeSurface('a', 2, { semanticActions: [{ name: 'foo' }] }));
  reg.register(fakeSurface('b', 2, { semanticActions: [{ name: 'bar' }] }));
  const r = reg.dispatch(2, { kind: 'semantic', name: 'bar', args: {}, source: 'ai', actionId: 'x1' });
  assert.equal(r.surface, 'b');
  teardownWindow();
});
