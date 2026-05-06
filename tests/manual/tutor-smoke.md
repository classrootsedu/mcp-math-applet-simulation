# Tutor extension — manual smoke checklist

After Phase 2 complete. Open `http://localhost:8080/index.html?ai=1` in a modern browser; devtools open.

## Activate tutor capability

```js
// In a sibling tab/window opener-style or direct:
AppAPI._tutorCapabilityActive = true   // for direct in-page testing
// (For postMessage path, set via handshake capabilities including 'tutor')
```

## In-page tests

- [ ] `AppAPI.actions.start()` returns `tutor` and `next` blocks. `tutor.completionDialogue.i18nKey === "tutor.start.correct"`. The dialogue is in the current language (id by default).

- [ ] On page 2, `AppAPI.actions.chooseDividendDigits({digits:[0]})` returns a `tutor` block. `next.recommended.pedagogical === true` for the upcoming quotient step.

- [ ] **Right answer path:** `AppAPI.actions.chooseQuotientDigit({column:0, value:3})` returns:
  - `tutor.completionDialogue.i18nKey === "tutor.quotient.correct"`
  - Resolved `en: "Great! 3 × 3 = 9."` (or `id`).
  - `next.recommended.pedagogical === false` (next step is mechanical subtraction).

- [ ] **Wrong answer path:** Reset and run `AppAPI.actions.chooseQuotientDigit({column:0, value:5})`:
  - `validation.correct === false`
  - `tutor.completionDialogue.i18nKey === "tutor.quotient.incorrect.tooHigh"`
  - `tutor.completionDialogue.params.accepted === 5, productAccepted === 15`
  - `next.recommended.pedagogical === true, args.value === 3, rationale.en === "3 × 3 = 9."`

- [ ] `AppAPI.actions.setSubtractionResult({column:0, value:0})` returns `tutor.completionDialogue.i18nKey === "tutor.subtract.correct"` and `next.recommended.pedagogical === false`.

- [ ] After completing 96 ÷ 3, `AppAPI.actions.clickNext()` returns `tutor.completionDialogue.i18nKey === "tutor.nav.next.midBank"` with the next question's dividend and divisor in params.

## Capability gating

- [ ] Set `AppAPI._tutorCapabilityActive = false` and run `AppAPI.actions.chooseQuotientDigit({column:0, value:3})`. The response should NOT contain a `tutor` or `next` block.

- [ ] Send a postMessage handshake without `tutor` capability and confirm the resulting ack does NOT list `tutor` in `capabilities`.
