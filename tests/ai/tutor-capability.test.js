const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function load() {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['*'] };
  global.window.AppData = { currentLanguage: 'en', translations: { en: {} } };
  global.window.getCurrentPage = () => 1;
  ['errors','event-bus','control-surface','registry','i18n-payload','app-api','bridge']
    .forEach(m => { try { delete require.cache[require.resolve(`../../js/ai/${m}.js`)]; } catch(_) {} });
  require('../../js/ai/errors.js');
  require('../../js/ai/event-bus.js');
  require('../../js/ai/control-surface.js');
  require('../../js/ai/registry.js');
  require('../../js/ai/i18n-payload.js');
  require('../../js/ai/app-api.js');
  require('../../js/ai/bridge.js');
  return global.window;
}

function postMsg(win, data, origin = 'http://localhost') {
  const ev = new win.MessageEvent('message', { data, origin, source: win });
  win.dispatchEvent(ev);
}

test('tutor capability: AppAPI._tutorCapabilityActive starts false', () => {
  const w = load();
  assert.equal(w.AppAPI._tutorCapabilityActive, false);
  teardownWindow();
});

test('tutor capability: handshake without tutor does not flip the flag', async () => {
  const w = load();
  postMsg(w, { v:1, type:'ai.handshake', requestId:'h1',
               caller:{name:'t'}, capabilities:['actions','events'] });
  await new Promise(r => setTimeout(r, 10));
  assert.equal(w.AppAPI._tutorCapabilityActive, false);
  teardownWindow();
});

test('tutor capability: handshake WITH tutor flips the flag on', async () => {
  const w = load();
  postMsg(w, { v:1, type:'ai.handshake', requestId:'h1',
               caller:{name:'t'}, capabilities:['actions','tutor'] });
  await new Promise(r => setTimeout(r, 10));
  assert.equal(w.AppAPI._tutorCapabilityActive, true);
  teardownWindow();
});

test('tutor capability: re-handshake without tutor flips the flag back off', async () => {
  const w = load();
  postMsg(w, { v:1, type:'ai.handshake', requestId:'h1',
               caller:{name:'t'}, capabilities:['actions','tutor'] });
  await new Promise(r => setTimeout(r, 10));
  assert.equal(w.AppAPI._tutorCapabilityActive, true);
  postMsg(w, { v:1, type:'ai.handshake', requestId:'h2',
               caller:{name:'t'}, capabilities:['actions'] });
  await new Promise(r => setTimeout(r, 10));
  assert.equal(w.AppAPI._tutorCapabilityActive, false);
  teardownWindow();
});

test('tutor capability: handshake ack reports tutor in granted capabilities', async () => {
  const w = load();
  const out = [];
  const orig = w.postMessage.bind(w);
  w.postMessage = (data, target) => { out.push({data, target}); return orig(data, target); };
  postMsg(w, { v:1, type:'ai.handshake', requestId:'h1',
               caller:{name:'t'}, capabilities:['actions','tutor','events'] });
  await new Promise(r => setTimeout(r, 10));
  const ack = out.find(m => m.data && m.data.type === 'ai.handshake.ack');
  assert.deepEqual(ack.data.capabilities.sort(), ['actions','events','tutor']);
  teardownWindow();
});
