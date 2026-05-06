const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['*'] };
  global.window.AppData = { currentLanguage: 'en', translations: { en: {} } };
  global.window.getCurrentPage = () => 1;
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

function fakeSurfaceWithTutor(w) {
  return {
    id: 's1', kind: 'page', scope: { page: 1 },
    getManifest: () => ({ semanticActions: [{ name: 'foo' }], uiElements: [], goal: null }),
    getState:    () => ({ currentStep: 's', stepContext: {}, expectedActions: [], currentHint: null, uiElementValues: {} }),
    checkGoal:   () => ({ reached: false, actual: {} }),
    dispatch:    (a) => ({ ok: true, actionId: a.actionId, validation: { correct: true } }),
    getTutorPayload: (a, r) => ({
      input: { action: a.name, args: a.args, modality: 'ai-direct', details: {} },
      tutor: { completionDialogue: { en: 'good', i18nKey: 'k', params: {} },
               talkingPoints: [], nextStepHint: null },
      next:  { possible: [], recommended: null }
    }),
    attach: () => {}, detach: () => {}
  };
}

test('envelope: with tutor capability OFF, response has NO tutor block', () => {
  const w = load();
  w.AppAPI._tutorCapabilityActive = false;
  w.AppAPI._registerSurface(fakeSurfaceWithTutor(w));
  const r = w.AppAPI.actions.foo({});
  assert.equal(r.ok, true);
  assert.equal(r.tutor, undefined);
  assert.equal(r.next,  undefined);
  teardownWindow();
});

test('envelope: with tutor capability ON, response HAS tutor + next blocks', () => {
  const w = load();
  w.AppAPI._tutorCapabilityActive = true;
  w.AppAPI._registerSurface(fakeSurfaceWithTutor(w));
  const r = w.AppAPI.actions.foo({});
  assert.equal(r.ok, true);
  assert.ok(r.tutor);
  assert.equal(r.tutor.completionDialogue.en, 'good');
  assert.ok(r.next);
  assert.equal(r.input.modality, 'ai-direct');
  teardownWindow();
});

test('envelope: surface without getTutorPayload (returns null) leaves response unchanged', () => {
  const w = load();
  w.AppAPI._tutorCapabilityActive = true;
  const surface = fakeSurfaceWithTutor(w);
  surface.getTutorPayload = () => null;
  w.AppAPI._registerSurface(surface);
  const r = w.AppAPI.actions.foo({});
  assert.equal(r.tutor, undefined);
  assert.equal(r.next,  undefined);
  teardownWindow();
});

test('envelope: admin actions never get tutor block even with capability active', () => {
  const w = load();
  w.AppAPI._tutorCapabilityActive = true;
  const surface = fakeSurfaceWithTutor(w);
  surface.getManifest = () => ({
    semanticActions: [{ name: 'fooAdmin', scope: 'admin' }], uiElements: [], goal: null
  });
  w.AppAPI._registerSurface(surface);
  const r = w.AppAPI.admin.fooAdmin({});
  assert.equal(r.ok, true);
  assert.equal(r.tutor, undefined);
  teardownWindow();
});
