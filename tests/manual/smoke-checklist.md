# AI Scaffolding — End-to-end smoke checklist

Run after Phase 7 complete. Open `index.html?ai=1` in a modern browser; devtools open.

## In-page (window.AppAPI) verification

- [ ] `typeof AppAPI === 'object'` is true.
- [ ] `AppAPI.describePage()` returns `{ page: 1, semanticActions: [...], goal: { kind:'navigate', target:2 } }`.
- [ ] `AppAPI.actions.start()` returns `ok:true` and the page transitions to page 2.
- [ ] After transition, `AppAPI.describePage().page === 2` and `semanticActions` includes `chooseQuotientDigit`.
- [ ] `AppAPI.actions.chooseQuotientDigit({column:0, value:3})` returns
      `ok:true, validation:{correct:true, expected:3}`. The "3" appears in the first quotient cell on screen.
- [ ] An incorrect call `chooseQuotientDigit({column:0, value:9})` returns `ok:true, validation:{correct:false}`.
      The cell does NOT update visually; wrong.mp3 plays.
- [ ] Walk the full division (96 ÷ 3 → quotient 32, remainder 0) using semantic actions only.
      `AppAPI.checkGoal().reached` becomes `true` at the end.
- [ ] `AppAPI.transcript({since:0}).events.length` ≥ number of dispatch calls made.

## postMessage bridge verification

- [ ] In a sibling window/tab open to a blank page, run:
      ```js
      const target = window.opener || window.parent;
      target.postMessage({v:1, type:'ai.handshake', requestId:'h1', caller:{name:'manual'}, capabilities:['actions','events','transcript','admin']}, '*');
      window.addEventListener('message', e => console.log(e.data));
      ```
      Expect to see `ai.handshake.ack` with `ok:true` logged.
- [ ] Issue an `ai.call` for `describePage` and confirm a matching `ai.response` arrives with `requestId:'r1'`.
- [ ] Issue an `ai.subscribe` with `filter:{types:['action.completed']}`, then drive a click in the applet,
      and confirm an `ai.event` arrives.

## Inert-when-off verification

- [ ] Reload `index.html` (no `?ai=1`). Console: `APP_CONFIG.AI_ENABLED === false`.
- [ ] Without sending a handshake, no `AppAPI` calls happen, no `__aiBridge.getSession()` returns non-null.
- [ ] All applet behaviour identical to baseline (drag/drop, click, mtable, completion, sound effects).

If every box ticks, ship it.
