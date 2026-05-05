// tests/ai/bridge.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function loadBridge({ aiEnabled = true } = {}) {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: aiEnabled, AI_ALLOWED_ORIGINS: ['*'] };
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

// Stub out window.postMessage to capture outgoing messages on a side channel.
function captureOutgoing(win) {
  const out = [];
  const orig = win.postMessage.bind(win);
  win.postMessage = (data, target) => { out.push({ data, target }); return orig(data, target); };
  return out;
}

test('bridge: handshake → ack with capabilities intersection + initial schema', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't', version: '0' }, capabilities: ['actions','events','transcript'] });
  await new Promise(r => setTimeout(r, 10));
  const ack = out.find(m => m.data && m.data.type === 'ai.handshake.ack');
  assert.ok(ack, 'no handshake ack received');
  assert.equal(ack.data.requestId, 'h1');
  assert.equal(ack.data.ok, true);
  assert.deepEqual(ack.data.capabilities.sort(), ['actions','events','transcript']);
  assert.ok(ack.data.schema);
  teardownWindow();
});

test('bridge: successful handshake emits bridge.handshake event into the eventBus', async () => {
  const w = loadBridge();
  captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't', version: '0' }, capabilities: ['actions','events','transcript'] });
  await new Promise(r => setTimeout(r, 10));
  const t = w.AppAPI.transcript({ since: 0 });
  const handshakeEvents = t.events.filter(e => e.type === 'bridge.handshake');
  assert.equal(handshakeEvents.length, 1, 'expected exactly one bridge.handshake event in transcript');
  assert.equal(handshakeEvents[0].source, 'system');
  assert.equal(handshakeEvents[0].payload.caller.name, 't');
  assert.deepEqual(handshakeEvents[0].payload.capabilities.sort(), ['actions','events','transcript']);
  teardownWindow();
});

test('bridge: ai.call before handshake → E_NO_HANDSHAKE', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.call', requestId: 'r1', method: 'describePage', params: {} });
  await new Promise(r => setTimeout(r, 10));
  const resp = out.find(m => m.data && m.data.type === 'ai.response' && m.data.requestId === 'r1');
  assert.ok(resp);
  assert.equal(resp.data.ok, false);
  assert.equal(resp.data.error.code, 'E_NO_HANDSHAKE');
  teardownWindow();
});

test('bridge: admin call without admin capability → E_ADMIN_DENIED', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't' }, capabilities: ['actions'] });
  await new Promise(r => setTimeout(r, 10));
  postMsg(w, { v: 1, type: 'ai.call', requestId: 'r1', method: 'admin.setQuestion', params: { dividend: 7, divisor: 2 } });
  await new Promise(r => setTimeout(r, 10));
  const resp = out.find(m => m.data && m.data.type === 'ai.response' && m.data.requestId === 'r1');
  assert.ok(resp);
  assert.equal(resp.data.ok, false);
  assert.equal(resp.data.error.code, 'E_ADMIN_DENIED');
  teardownWindow();
});

test('bridge: describePage forwards through', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't' }, capabilities: ['actions','events','transcript','admin'] });
  await new Promise(r => setTimeout(r, 10));
  postMsg(w, { v: 1, type: 'ai.call', requestId: 'r1', method: 'describePage', params: {} });
  await new Promise(r => setTimeout(r, 10));
  const resp = out.find(m => m.data && m.data.type === 'ai.response' && m.data.requestId === 'r1');
  assert.ok(resp);
  assert.equal(resp.data.ok, true);
  assert.equal(resp.data.result.page, 1);
  teardownWindow();
});

test('bridge: subscribe + emit fans out events to caller', async () => {
  const w = loadBridge();
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't' }, capabilities: ['actions','events'] });
  await new Promise(r => setTimeout(r, 10));
  postMsg(w, { v: 1, type: 'ai.subscribe', requestId: 'r1', filter: { types: ['ping'] } });
  await new Promise(r => setTimeout(r, 10));
  w.AppAPI._emit({ type: 'ping', source: 'system' });
  w.AppAPI._emit({ type: 'pong', source: 'system' });
  await new Promise(r => setTimeout(r, 10));
  const events = out.filter(m => m.data && m.data.type === 'ai.event').map(m => m.data.event.type);
  assert.deepEqual(events, ['ping']);
  teardownWindow();
});

test('bridge: origin not in allow-list → E_ORIGIN, no events delivered', async () => {
  newWindow();
  global.window.APP_CONFIG = { AI_ENABLED: true, AI_ALLOWED_ORIGINS: ['https://trusted.example'] };
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
  const w = global.window;
  const out = captureOutgoing(w);
  postMsg(w, { v: 1, type: 'ai.handshake', requestId: 'h1',
               caller: { name: 't' }, capabilities: ['actions'] }, 'http://evil.example');
  await new Promise(r => setTimeout(r, 10));
  const ack = out.find(m => m.data && m.data.type === 'ai.handshake.ack');
  assert.ok(ack);
  assert.equal(ack.data.ok, false);
  assert.equal(ack.data.error.code, 'E_ORIGIN');
  teardownWindow();
});
