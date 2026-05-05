// js/ai/bridge.js
(function (global) {
  'use strict';

  if (typeof global.window === 'undefined') return;
  const w = global.window || global;

  const cfg = w.APP_CONFIG || {};
  // Inert-by-default if AI not enabled and we never get a handshake. The listener is cheap.
  let session = null;

  function originAllowed(origin) {
    const list = (cfg.AI_ALLOWED_ORIGINS || ['*']);
    if (list.includes('*')) return true;
    return list.includes(origin);
  }

  function send(target, msg) {
    try { (target && target.postMessage ? target : w).postMessage(msg, '*'); }
    catch (e) { console.error('[AI bridge] postMessage failed', e); }
  }

  function reply(target, requestId, ok, payload) {
    const msg = { v: 1, type: 'ai.response', requestId };
    if (ok) msg.result = payload;
    else    msg.error  = payload;
    msg.ok = ok;
    send(target, msg);
  }

  function methodScope(method) {
    return method.startsWith('admin.') ? 'admin' : 'public';
  }

  function callAppApi(method, params) {
    const parts = method.split('.');
    let target = w.AppAPI;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target && target[parts[i]];
    }
    const fn = target && target[parts[parts.length - 1]];
    if (typeof fn !== 'function') {
      return { ok: false, error: { code: 'E_UNKNOWN_METHOD', message: `no method ${method}` } };
    }
    let result;
    try { result = (params == null) ? fn.call(target) : fn.call(target, params); }
    catch (e) {
      return { ok: false, error: { code: 'E_INTERNAL', message: e.message } };
    }
    // If the method already returned an {ok, ...} object, pass through; else wrap.
    if (result && typeof result === 'object' && 'ok' in result) return result;
    return { ok: true, result };
  }

  function handleHandshake(ev) {
    const { data, origin, source } = ev;
    const target = source || w;
    if (!originAllowed(origin)) {
      send(target, { v: 1, type: 'ai.handshake.ack', requestId: data.requestId,
                     ok: false, error: { code: 'E_ORIGIN', message: `origin not allowed: ${origin}` } });
      return;
    }
    const requested = Array.isArray(data.capabilities) ? data.capabilities : [];
    const granted = requested.filter(c => ['actions','events','transcript','admin'].includes(c));
    // Drain any subscriptions from the previous session so the eventBus doesn't
    // keep fanning events to an orphaned caller after a re-handshake.
    if (session && session.subs) {
      for (const off of session.subs.values()) {
        try { off(); } catch (e) { console.error('[AI bridge] sub cleanup failed', e); }
      }
    }
    session = {
      id:           'sess_' + Math.random().toString(36).slice(2, 10),
      caller:       data.caller || {},
      capabilities: granted,
      target,
      origin,
      subs:         new Map() // subscriptionId → unsubscribe()
    };
    // Emit bridge.handshake into the eventBus so subscribers / transcript see it.
    if (w.AppAPI && typeof w.AppAPI._emit === 'function') {
      w.AppAPI._emit({ type: 'bridge.handshake', source: 'system',
                       payload: { caller: session.caller, capabilities: granted } });
    }
    send(target, {
      v: 1, type: 'ai.handshake.ack', requestId: data.requestId, ok: true,
      session: { id: session.id, page: w.getCurrentPage ? w.getCurrentPage() : 1,
                 questionIndex: w.currentQuestionIndex || 0,
                 language: (w.AppData && w.AppData.currentLanguage) || 'en' },
      capabilities: granted,
      schema: w.AppAPI ? w.AppAPI.describePage() : null
    });
  }

  function handleCall(ev) {
    const { data, origin, source } = ev;
    const target = source || w;
    if (!session) {
      reply(target, data.requestId, false, { code: 'E_NO_HANDSHAKE', message: 'send ai.handshake first' });
      return;
    }
    if (!originAllowed(origin)) {
      reply(target, data.requestId, false, { code: 'E_ORIGIN', message: `origin not allowed: ${origin}` });
      return;
    }
    if (methodScope(data.method) === 'admin' && !session.capabilities.includes('admin')) {
      reply(target, data.requestId, false, { code: 'E_ADMIN_DENIED', message: 'admin capability not granted' });
      return;
    }
    const result = callAppApi(data.method, data.params);
    if (result.ok) reply(target, data.requestId, true,  result.result !== undefined ? result.result : result);
    else           reply(target, data.requestId, false, result.error);
  }

  function handleSubscribe(ev) {
    const { data, source } = ev;
    const target = source || w;
    if (!session) { reply(target, data.requestId, false, { code: 'E_NO_HANDSHAKE' }); return; }
    if (!session.capabilities.includes('events')) {
      reply(target, data.requestId, false, { code: 'E_ADMIN_DENIED', message: 'events capability not granted' });
      return;
    }
    const subscriptionId = 's_' + Math.random().toString(36).slice(2, 10);
    const off = w.AppAPI.subscribe(data.filter || {}, (event) => {
      send(target, { v: 1, type: 'ai.event', subscriptionId, event });
    });
    session.subs.set(subscriptionId, off);
    reply(target, data.requestId, true, { subscriptionId });
  }

  function handleUnsubscribe(ev) {
    const { data, source } = ev;
    const target = source || w;
    if (!session) { reply(target, data.requestId, false, { code: 'E_NO_HANDSHAKE' }); return; }
    const off = session.subs.get(data.subscriptionId);
    if (off) { off(); session.subs.delete(data.subscriptionId); }
    reply(target, data.requestId, true, { unsubscribed: true });
  }

  function onMessage(ev) {
    const data = ev.data;
    if (!data || typeof data !== 'object' || data.v !== 1) return;
    switch (data.type) {
      case 'ai.handshake':   return handleHandshake(ev);
      case 'ai.call':        return handleCall(ev);
      case 'ai.subscribe':   return handleSubscribe(ev);
      case 'ai.unsubscribe': return handleUnsubscribe(ev);
    }
  }

  w.addEventListener('message', onMessage);
  // Expose for tests / debugging.
  w.__aiBridge = { getSession: () => session, _onMessage: onMessage };
})(typeof window !== 'undefined' ? window : globalThis);
