# Long-division grid: manual no-regression checklist

After the applyDigit wrapper addition (Task 4.2), walk through these scenarios in the
browser (`index.html` with default config, page 2). Each must behave exactly as before.

1. **Drag a digit from the panel onto the first quotient cell.**
   - Correct digit (e.g. "3" for 96÷3): cell turns green, hint advances to product step,
     correct.mp3 plays. Same as before.
   - Wrong digit (e.g. "5"): cell flashes red, hint stays, wrong.mp3 plays, value rejected.

2. **Click a row in the multiplication table** to fill the quotient digit. Same outcomes as #1.

3. **Click a digit-panel button** while a guided cell is highlighted. Same as #1.

4. **Click a dividend digit** to add it to selectedStartingDigits. Selection ring appears.

5. **Run a full division** (96÷3 → quotient 32, remainder 0). Confetti + completion message
   appear at the end.

6. **Switch to page 1, back to page 2.** Grid resets to first question. Repeat #5.

If any item differs from the pre-change behaviour, the change introduced a regression.

## Handle exposure check (post-Task-4.2)

7. **With `?ai=1`, navigate to page 2, devtools console:**
   - `typeof window.__longDivisionGridHandle.applyDigit` → `"function"`
   - `window.__longDivisionGridHandle.getProblem()` → `{ dividend: 96, divisor: 3 }` (or the current question)
   - `window.__longDivisionGridHandle.getGuidedStepIndex()` → small integer ≥ 0
   - `window.__longDivisionGridHandle.getGuidedValues()` → object (may be empty initially)

8. **AI-driven first quotient digit (96÷3 expects 3):**
   - `window.__longDivisionGridHandle.applyDigit({ cellKey: 'quotient-0', value: 3, source: 'ai' })`
   - Returns: `{ accepted: true, correct: true, expected: 3, advancedTo: <next step type or 'complete'>, hint: <object|null> }`
   - The cell visibly fills with "3" and the hint advances. correct.mp3 plays.

9. **AI-driven wrong digit:**
   - First reset (refresh or click previous→next), then call:
     `window.__longDivisionGridHandle.applyDigit({ cellKey: 'quotient-0', value: 5, source: 'ai' })`
   - Returns: `{ accepted: true, correct: false, expected: 3, advancedTo: null, hint: <object|null> }`
   - The cell flashes red, wrong.mp3 plays, no advance. Same visual feedback as a wrong drag/click.
