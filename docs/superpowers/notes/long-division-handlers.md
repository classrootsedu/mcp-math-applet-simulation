# Long-division grid: digit application paths (pre-refactor)

> **File:** `js/components/long-division-grid-component.js`  
> **Recorded:** 2026-05-05 for Task 4.2 refactor planning.  
> All line numbers are absolute lines in the ~5 000-line file.

---

## State declarations

| State variable | Declaration line |
|---|---|
| `const [guidedValues, setGuidedValues]` | 453 |
| `const [guidedValidation, setGuidedValidation]` | 454 |
| `const [selectedStartingDigits, setSelectedStartingDigits]` | 457 |
| `guidedStepIndex / setGuidedStepIndex` | 450 |
| `guidedSteps / setGuidedSteps` | 451 |
| `guidedComplete / setGuidedComplete` | 452 |

---

## State mutators relevant to "filling a digit into a guided cell"

### `setGuidedValues({...prev, [cellKey]: value})` call sites

| Line | Context |
|---|---|
| 527 | Reset effect (dividend/divisor change) — clears entire map |
| 1579 | `applyGuidedQuotientFromMultTableRow` — correct quotient path (immediate set) |
| 1589–1592 | `applyGuidedQuotientFromMultTableRow` — deferred auto-fill of subtract cells (inside `setTimeout 100 ms`) |
| 1642–1645 | `skipGuidedStep` — force-fills current step with correct value |
| 1654 | `resetGuided` — clears entire map |
| 2565 | Dividend click / bringDown → after animation completes (610 ms delay) |
| 2590 | Dividend click / bringDown → fallback (no DOM target found), immediate |
| 2704 | Text `<input>` `onChange` — main branch: sets value as user types |
| 2728–2733 | Text `<input>` `onChange` — auto-fills subtract cells when quotient correct + `autoFillSubtract` |
| 2790–2810 | Text `<input>` `onChange` — auto-fills remainder cells when last difference filled + `autoCalculateRemainder` |
| 2839–2842 | Text `<input>` `onChange` — special-case: last difference = single-digit remainder shortcut |
| 4074 | `applyGuidedDigit` — immediate set at entry |
| 4099–4104 | `applyGuidedDigit` — deferred auto-fill of subtract cells (setTimeout 100 ms) |
| 4166–4186 | `applyGuidedDigit` — deferred auto-fill of remainder cells when last difference done |
| 4215–4218 | `applyGuidedDigit` — special-case last difference = single-digit remainder shortcut |
| 4275–4279 | `applyGuidedDigit` — **incorrect drop**: clear the cell value after 1 500 ms wiggle |

### `setGuidedValidation({...prev, [cellKey]: { isCorrect, ... }})` call sites

| Line | Context |
|---|---|
| 528 | Reset effect |
| 1578 | `applyGuidedQuotientFromMultTableRow` — marks quotient cell correct immediately |
| 1594–1598 | `applyGuidedQuotientFromMultTableRow` — marks subtract cells correct (deferred) |
| 1655 | `resetGuided` |
| 2568 | Dividend-click bringDown — after animation: marks `isCorrect: true` |
| 2578 | Dividend-click bringDown — after animation: marks `isCorrect: false` |
| 2593 | Dividend-click bringDown fallback — marks correct |
| 2603 | Dividend-click bringDown fallback — marks incorrect |
| 2707 | Text `<input>` `onChange` — marks correct |
| 2736–2741 | Text `<input>` `onChange` — marks subtract cells correct (deferred) |
| 2813–2818 | Text `<input>` `onChange` — marks remainder cells correct (deferred, autoCalculateRemainder) |
| 2844–2848 | Text `<input>` `onChange` — marks remainder correct (single-digit shortcut) |
| 2880 | Text `<input>` `onChange` — marks incorrect |
| 4078 | `applyGuidedDigit` — marks correct |
| 4107–4112 | `applyGuidedDigit` — marks subtract cells correct (deferred) |
| 4189–4194 | `applyGuidedDigit` — marks remainder correct (deferred, autoCalculateRemainder) |
| 4220–4223 | `applyGuidedDigit` — marks remainder correct (single-digit shortcut) |
| 4268 | `applyGuidedDigit` — marks incorrect |
| 4280–4284 | `applyGuidedDigit` — **clears** validation after wiggle (1 500 ms) |

### `setSelectedStartingDigits(...)` call sites

| Line | Context |
|---|---|
| 520 | Reset effect |
| 1141–1157 | `handleSelectStartingDigit` callback — toggle/add/remove digit index |

### `advanceGuidedStep()` call sites

`advanceGuidedStep` is defined at **lines 1508–1562** as a `useCallback`.

| Lines | Caller / context |
|---|---|
| 1618, 1620, 1623 | `applyGuidedQuotientFromMultTableRow` — `setTimeout(advanceGuidedStep, 300)` |
| 1646 | `skipGuidedStep` — direct call |
| 2571, 2596 | Dividend-click bringDown handler — `setTimeout(advanceGuidedStep, 300)` |
| 2765, 2770 | Text `<input>` `onChange` — when quotient+autoFillSubtract path ends |
| 2860 | Text `<input>` `onChange` — normal auto-advance on correct answer |
| 4141, 4146 | `applyGuidedDigit` — quotient+autoFillSubtract path |
| 4241 | `applyGuidedDigit` — normal auto-advance |
| 4294 | `applyGuidedDigit` dependency array (callback definition end) |

The function increments `guidedStepIndex`, skips pre-filled remainder steps, fires `onStepComplete`, sets `guidedComplete = true` when at the last step, and then calls `unlockInteraction()` after 150 ms.

---

## Entry points (places that ultimately write a digit into the grid)

### 1. Drag-drop from digit panel → any guided cell

**Functions:** `handleGuidedDragStart` (lines 4039–4048), `handleGuidedDragMove` (4050–4057), `handleGuidedDragEnd` (4296–4309)  
**Ultimate call:** `handleGuidedDragEnd` calls `applyGuidedDigit(guidedDraggedDigit)` at **line 4305**.  
**User action:** mousedown on a digit-panel button starts the drag (`handleGuidedDragStart`); mouseup anywhere fires `handleGuidedDragEnd` via a global `window.addEventListener('mouseup', handleGuidedDragEnd)` wired in the `useEffect` at lines 4316–4330. Touch equivalents are also registered there (`touchend`).  
**Note:** `applyGuidedDigit` does its own lock check and handles correct/incorrect paths internally.

### 2. Click on digit-panel button

**Function:** `handleGuidedDigitClick` (lines 4311–4313), which is a thin wrapper: `applyGuidedDigit(digit)`.  
**JSX wiring:** digit-panel buttons rendered in `renderGuidedDigitPanel` (lines 4332 ff.); the `onClick` at **line 4423–4426** calls `handleGuidedDigitClick(digit)` when `canInteract` is true.  
**User action:** Click on one of the 0–9 buttons in the floating/fixed digit panel.  
**`applyGuidedDigit` definition:** lines **4060–4294** (the shared implementation used by both drag-drop and click).

### 3. Multiplication-table row click → quotient digit

**Function:** `applyGuidedQuotientFromMultTableRow` (lines 1565–1625).  
**JSX wiring:** `renderMultiplicationTable` (≈ lines 4970–5090); the `onClick` at **lines 5063–5074** validates the row against `currentStep.correctValue`, plays audio, then calls `applyGuidedQuotientFromMultTableRow(i)` at **line 5067**.  
**User action:** Click on a row in the multiplication table component (only active when `mode === 'guided'` and `currentStep.type === 'quotient'`).  
**Differences from `applyGuidedDigit`:** Uses a separate dedicated function, does NOT go through `applyGuidedDigit`. The audio (`playAnswerSound`) is called by the caller (line 5065/5070) before `applyGuidedQuotientFromMultTableRow` is invoked; the callee does not call it again. Incorrect row click is handled entirely in the `onClick` (sets wiggle feedback, no value written).

### 4. Dividend-digit click → starting-digit selection (`selectStartingDigits` step)

**Function:** `handleSelectStartingDigit` (lines 1133–1161).  
**JSX wiring:** In `renderCell`, when `isSelectStartingDigitsStep && isDividendCell`, a `div.div-cell-clickable` is returned (lines 2433–2492); its `onClick` at **line 2460–2469** calls `handleSelectStartingDigit(dividendIdx)` when `canSelectDigit` is true.  
**User action:** Tap a dividend digit to mark it as part of the starting value (e.g. selecting "3" and "6" from "364" before dividing by 45).  
**State written:** `setSelectedStartingDigits` (line 1141). This step does NOT write to `guidedValues` / `guidedValidation` directly; those are only mutated later after auto-advance to the first quotient step.

### 5. Dividend-digit click → bringDown (click mode)

**Function:** Inline `onClick` at **lines 2526–2610** within `renderCell`.  
**Trigger condition:** `isClickableDividend` is true (lines 2411–2413): `isBringDownStep && useClickMode && !isInteractionLocked && dividendIdx === currentStep.dividendIndex`.  
**User action:** Click the highlighted dividend digit that needs to be "brought down" into the working area.  
**Mechanism:** Locks interaction, reads `digitValue = value` from the cell, then either:  
  - Animates the digit from source to target DOM element over ~610 ms and writes `setGuidedValues` / `setGuidedValidation` after the animation (lines 2564–2608).  
  - Falls back to immediate write if the target element is not found in the DOM (lines 2589–2607).  
**Note:** This is a self-contained inline handler; it does NOT call `applyGuidedDigit`. Audio is NOT called here (bringDown is always "correct" — the only digit shown is the correct one).

---

## Common downstream logic (the seam where `applyDigit` will live)

All paths (except `selectStartingDigits` and bringDown-click) share the following concerns after a digit is committed. These are currently duplicated between `applyGuidedDigit` (lines 4060–4294) and the text `<input>` `onChange` (lines 2698–2884):

### Validation against correct value

- In `applyGuidedDigit`: comparison at **line 4075** — `digit === currentStep.correctValue || Number(digit) === Number(currentStep.correctValue)`.
- In text `<input>` onChange: same pattern at **line 2706**.
- In `applyGuidedQuotientFromMultTableRow`: the caller (`onClick` at line 5064) does the comparison; the callee assumes it's always correct.
- `getCorrectValueForCell(key)` defined at **lines 850–879** — parses `quotient-N`, `subtract-N-M`, `difference-N-M`, `remainder-N` cell keys; used only by practice/input mode helpers (lines 830, 959, 982), NOT called by guided-mode handlers directly (they use `currentStep.correctValue` from the step definition).

### Audio cue

- `window.playAnswerSound(true)` — correct: called at **line 4076** inside `applyGuidedDigit` (drag/click path). NOT called inside the text `<input>` onChange or bringDown-click handlers.
- `window.playAnswerSound(false)` — incorrect: called at **line 4266** inside `applyGuidedDigit`. Also called at **lines 2487** (wrong dividend-digit during selectStartingDigits), **4436** (wrong digit-panel click during selectStartingDigits), **5070** (wrong mult-table row click).
- The mult-table row handler (line 5065/5070) calls `playAnswerSound` **before** delegating to `applyGuidedQuotientFromMultTableRow`.

### Hint update via `window.__longDivisionGuidedHint`

- **Main reactive effect** (lines 1396–1420): fires whenever `guidedHintTarget` or the derived `hintTextToPush` changes. Writes `window.__longDivisionGuidedHint = { targetId, text }` and dispatches `guided-hint-changed` CustomEvent.
- **Remainder-completion effect** (lines 1422–1448): fires when `guidedValues` / `guidedValidation` change and all remainder steps are filled; force-pushes the completion hint.
- **Inline imperative pushes** in `applyGuidedDigit`: at lines **4229** and **4256–4261** (same-value single-digit shortcut and last-remainder paths respectively) — bypasses the reactive effect for immediate delivery.
- **Inline imperative pushes** in text `<input>` onChange: at lines **2853–2855** and **2872–2875**.

### `guidedStepIndex` advance on success

Handled by `advanceGuidedStep` (lines 1508–1562), called via `setTimeout(advanceGuidedStep, 300)` after a correct answer in all entry points except:
- `applyGuidedQuotientFromMultTableRow` (may jump index directly via `setGuidedStepIndex` when skipping subtract rows, line 1605).
- `applyGuidedDigit` (same jump pattern, line 4125).
- `skipGuidedStep` (direct call to `advanceGuidedStep`, line 1646).

### Interaction lock / unlock

- Lock acquired: `lockInteraction()` at entry of `applyGuidedDigit` (line 4065), `applyGuidedQuotientFromMultTableRow` (line 1570), `handleSelectStartingDigit` (line 1138), bringDown-click inline (lines 2531–2532).
- Lock released: inside `advanceGuidedStep` via `setTimeout(unlockInteraction, 150)` (lines 1549–1551); or `setTimeout(unlockInteraction, 150)` directly (e.g. lines 4235, 4244) for early exits; or after 1 500 ms wiggle animation (line 4291).
- Text `<input>` onChange does NOT acquire the interaction lock (it relies on `isInteractionLocked` disabling the input via `readOnly` / `autoFocus` during wiggle, but does not call `lockInteraction`).

### Auto-fill side-effects (autoFillSubtract, autoCalculateRemainder)

Identical logic is duplicated between `applyGuidedDigit` (lines 4081–4148, 4151–4201) and text `<input>` onChange (lines 2710–2773, 2774–2826). Both:
1. Look up subtract steps keyed by `subtract-${stepIdx}-*`.
2. Batch-fill them via `setGuidedValues` inside a 100 ms `setTimeout`.
3. Jump `guidedStepIndex` past the auto-filled steps.

---

## Existing `window` exposure (guided mode)

Set in the `useEffect` at lines 2143–2165 (cleanup at 2177–2180):

| Global | Value | Line |
|---|---|---|
| `window.longDivisionGridAdvanceGuided` | `advanceGuidedStep` | 2144 |
| `window.longDivisionGridSkipGuided` | `skipGuidedStep` | 2145 |
| `window.longDivisionGridResetGuided` | `resetGuided` | 2146 |
| `window.longDivisionGridGuidedStepIndex` | `guidedStepIndex` (number) | 2147 |
| `window.longDivisionGridGuidedSteps` | `guidedSteps` (array) | 2148 |
| `window.longDivisionGridGuidedComplete` | `guidedComplete` (bool) | 2149 |

`window.__longDivisionGridHandle` does NOT yet exist — Task 4.2 will introduce it.

---

## Key observations for Task 4.2

1. **`applyGuidedDigit` (lines 4060–4294) is the closest existing equivalent to the planned `applyDigit` seam.** It already serves both drag-drop and digit-panel-click. Extending it (or wrapping it) to also accept a `source` parameter would cover those two paths.

2. **The mult-table path (`applyGuidedQuotientFromMultTableRow`, lines 1565–1625) is a separate function.** It handles only the `quotient` step type and replicates the autoFillSubtract logic. Task 4.2 should route this through `applyDigit` or merge it.

3. **The text `<input>` onChange (lines 2698–2884) duplicates all the core logic** of `applyGuidedDigit` for keyboard-input mode. This is the longest duplication — ~186 lines of nearly identical branching. Task 4.2 should eliminate this duplicate by routing keyboard input through `applyDigit` too.

4. **The bringDown-click handler (inline, lines 2526–2610) is self-contained** and always correct (no wrong-answer path). It could be adapted to call `applyDigit` after the animation completes (line 2564 currently calls `setGuidedValues` directly).

5. **The `selectStartingDigits` dividend-digit-click (`handleSelectStartingDigit`) writes only to `setSelectedStartingDigits`**, not to `guidedValues`. It is logically separate from the digit-filling flow and does NOT need to be routed through `applyDigit`.

6. **Audio is inconsistent:** `applyGuidedDigit` calls `playAnswerSound` internally; the mult-table path calls it externally before delegating; bringDown-click does not call it at all (implicitly always correct); text `<input>` does not call it either. The unified `applyDigit` function should own the audio call.

7. **`getCorrectValueForCell` (lines 850–879) is only used by practice/input mode.** Guided-mode handlers use `currentStep.correctValue` from the step object, which already has the correct value pre-computed. Task 4.2 can rely on `currentStep.correctValue` directly.
