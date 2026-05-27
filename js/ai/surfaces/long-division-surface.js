(function (global) {
  'use strict';

  const ID = 'long-division-surface';

  function handle() { return global.__longDivisionGridHandle || null; }

  function problem() {
    const h = handle();
    if (h) return h.getProblem();
    const qList = global.question || [];
    const idx   = global.currentQuestionIndex || 0;
    return qList[idx] || { dividend: 96, divisor: 3 };
  }

  function expectedQuotient() {
    const { dividend, divisor } = problem();
    const q = Math.floor(dividend / divisor).toString();
    return q.split('').map(Number);
  }

  function expectedRemainder() {
    const { dividend, divisor } = problem();
    return dividend % divisor;
  }

  function currentStep() {
    const h = handle();
    if (!h) return 'unknown';
    const steps = h.getGuidedSteps();
    const idx = h.getGuidedStepIndex();
    if (!steps || idx >= steps.length) return 'complete';
    const s = steps[idx];
    switch (s.type) {
      case 'selectStartingDigits':
      case 'startingDigits': return 'chooseDividendDigits';
      case 'quotient':       return 'chooseQuotientDigit';
      case 'partialProduct':
      case 'product':        return 'writePartialProduct';
      case 'subtract':
      case 'difference':     return 'writeSubtractionResult';
      case 'bringDown':      return 'bringDownDigit';
      case 'remainder':      return 'writeRemainder';
      default:               return s.type;
    }
  }

  function activeCellId() {
    const h = handle();
    if (!h) return null;
    const steps = h.getGuidedSteps();
    const idx   = h.getGuidedStepIndex();
    if (!steps || idx >= steps.length) return null;
    return 'page2-grid-' + (steps[idx].cellKey || '');
  }

  class LongDivisionSurface extends global.AIControlSurface {
    get id()    { return ID; }
    get kind()  { return 'grid'; }
    get scope() { return { page: 2 }; }

    getManifest() {
      const t = (key, params) => global.buildLocalizedPayload({ key, params });
      const q = problem();
      return {
        title:   t('pages.page1.headerWhatIs'),
        problem: { dividend: q.dividend, divisor: q.divisor,
                   questionIndex: global.currentQuestionIndex || 0,
                   totalQuestions: (global.question || []).length },
        goal: { kind: 'completeDivision',
                target: { quotient: expectedQuotient(), remainder: expectedRemainder() } },
        semanticActions: [
          { name: 'chooseDividendDigits',         args: { digits: 'int[]' },                  pedagogical: true },
          { name: 'chooseQuotientDigit',          args: { column: 'int>=0', value: 'digit' }, pedagogical: true },
          { name: 'setPartialProduct',            args: { column: 'int>=0', value: 'digit' }, pedagogical: false },
          { name: 'setSubtractionResult',         args: { column: 'int>=0', value: 'digit' }, pedagogical: false },
          { name: 'bringDownDigit',               args: { fromColumn: 'int>=0' },             pedagogical: false },
          { name: 'setRemainder',                 args: { value: 'digit' },                   pedagogical: true },
          { name: 'selectMultiplicationTableRow', args: { multiplier: 'int 1..10' },          pedagogical: true }
        ],
        uiElements: this._buildUiElements()
      };
    }

    _buildUiElements() {
      const els = [];
      const h = handle();
      const values = h ? h.getGuidedValues() : {};
      // quotient row (length matches expected quotient digits)
      const quotientLen = expectedQuotient().length;
      for (let c = 0; c < quotientLen; c++) {
        const k = `quotient-${c}`;
        els.push({
          id: `page2-grid-${k}`, role: 'cell', group: 'quotient', col: c,
          value: values[k] !== undefined ? values[k] : null,
          interactable: c === (h ? h.getGuidedStepIndex() : 0)
        });
      }
      // digit panel (0-9)
      for (let d = 0; d < 10; d++) {
        els.push({ id: `page2-digit-panel-${d}`, role: 'button', label: String(d) });
      }
      // Multiplication-table rows are owned by MTableSurface — don't duplicate them here.
      return els;
    }

    getState() {
      const h = handle();
      const hint = global.__longDivisionGuidedHint || null;
      return {
        currentStep:     currentStep(),
        stepContext:     { activeCellId: activeCellId(),
                           guidedStepIndex: h ? h.getGuidedStepIndex() : 0 },
        expectedActions: this._expectedActionsForStep(currentStep()),
        currentHint:     hint ? { ui: hint.text, en: hint.text, i18nKey: null, params: {} } : null,
        uiElementValues: h ? h.getGuidedValues() : {}
      };
    }

    // AI idle auto-step: perform the SINGLE next correct guided step using the
    // applet's own answer knowledge. Uses loop-safe handle methods:
    //   • applyDigit / bringDownNextDigit do NOT emit a student event.
    //   • dividend selection uses aiSelectStartingDigit (source:'ai' path) so
    //     the host bridge (source:'student' only) doesn't echo it as a turn.
    autoStep() {
      const h = handle();
      if (!h) return { ok: false, error: { code: 'E_NOT_INTERACTABLE', message: 'long-division grid not mounted' } };
      const step = currentStep();
      if (step === 'complete' || step === 'unknown') {
        return { ok: false, error: { code: 'E_DONE', message: 'no pending step' } };
      }

      // Dividend-digit selection — canonical expected indices (e.g. [0] for 96÷3).
      if (step === 'chooseDividendDigits') {
        const digits = this._expectedStartingDigits();
        const sel = (typeof h.aiSelectStartingDigit === 'function')
          ? h.aiSelectStartingDigit
          : h.selectStartingDigit;
        if (typeof sel === 'function') {
          for (const d of digits) sel(d);
        }
        return { ok: true, page: 2, stepBefore: step, stepAfter: currentStep(),
                 validation: { correct: true, expected: digits, accepted: digits }, autoStepped: true };
      }

      // Bring-down — mechanical, no value.
      if (step === 'bringDownDigit') {
        const r = (typeof h.bringDownNextDigit === 'function') ? h.bringDownNextDigit() : { ok: false };
        return { ok: !!r.ok, page: 2, stepBefore: step, stepAfter: r.advancedTo || currentStep(),
                 validation: { correct: true }, autoStepped: true };
      }

      // Cell-fill steps (quotient / partial product / subtraction / remainder):
      // read the active guided step's correctValue + cellKey and apply it.
      const steps = (typeof h.getGuidedSteps === 'function') ? h.getGuidedSteps() : null;
      const idx   = (typeof h.getGuidedStepIndex === 'function') ? h.getGuidedStepIndex() : 0;
      const gs    = steps && steps[idx];
      if (!gs || gs.correctValue === undefined || gs.cellKey == null) {
        return { ok: false, error: { code: 'E_NO_STEP', message: `no correctValue for step ${step}` } };
      }
      const r = h.applyDigit({ cellKey: gs.cellKey, value: Number(gs.correctValue), source: 'ai' });
      return { ok: true, page: 2, stepBefore: step,
               stepAfter: r.correct ? (r.advancedTo || 'complete') : step,
               validation: { correct: r.correct, expected: r.expected, accepted: Number(gs.correctValue) },
               autoStepped: true };
    }

    _expectedActionsForStep(step) {
      switch (step) {
        case 'chooseDividendDigits':  return ['chooseDividendDigits'];
        case 'chooseQuotientDigit':   return ['chooseQuotientDigit', 'selectMultiplicationTableRow'];
        case 'writePartialProduct':   return ['setPartialProduct'];
        case 'writeSubtractionResult':return ['setSubtractionResult'];
        case 'bringDownDigit':        return ['bringDownDigit'];
        case 'writeRemainder':        return ['setRemainder'];
        case 'complete':              return [];
        default:                      return [];
      }
    }

    checkGoal() {
      const h = handle();
      const target = { quotient: expectedQuotient(), remainder: expectedRemainder() };
      if (!h) return { reached: false, actual: {} };
      // Read filled quotient digits in order.
      const values = h.getGuidedValues();
      const actualQ = [];
      for (let c = 0; c < target.quotient.length; c++) actualQ.push(values[`quotient-${c}`] !== undefined ? values[`quotient-${c}`] : null);
      const remainderCellKey = 'remainder-0';
      const actualR = values[remainderCellKey] !== undefined ? values[remainderCellKey] : null;
      const reached = actualQ.every((v, i) => v === target.quotient[i]) &&
                      (target.remainder === 0 ? (actualR === null || actualR === 0) : actualR === target.remainder);
      return { reached, actual: { quotient: actualQ, remainder: actualR } };
    }

    dispatch(action) {
      const stepBefore = currentStep();
      try {
        switch (action.name) {
          case 'chooseQuotientDigit':          return this._fillCell('quotient', action, stepBefore, 'column');
          case 'setPartialProduct':            return this._fillCell('partialProduct', action, stepBefore, 'column');
          case 'setSubtractionResult':         return this._fillCell('subtract', action, stepBefore, 'column');
          case 'setRemainder':                 return this._fillCell('remainder', action, stepBefore, null);
          case 'bringDownDigit':               return this._bringDown(action, stepBefore);
          case 'chooseDividendDigits':         return this._chooseStartingDigits(action, stepBefore);
          case 'selectMultiplicationTableRow': return this._mtableRow(action, stepBefore);
          default:
            return { ok: false, actionId: action.actionId,
                     error: { code: 'E_UNKNOWN_METHOD', message: `not handled: ${action.name}` } };
        }
      } catch (e) {
        return { ok: false, actionId: action.actionId,
                 error: { code: 'E_INTERNAL', message: e.message, details: { stack: e.stack } } };
      }
    }

    getTutorPayload(action, result) {
      const t = (key, params) => global.buildLocalizedPayload({ key, params });
      const h = handle();
      if (!h) return null;

      // Determine input modality.
      const modality = (action.args && action.args._modality) || 'ai-direct';
      const details  = (action.args && action.args._details)  || {};
      // Strip our internal modality hints from the echoed args.
      const echoArgs = Object.assign({}, action.args);
      delete echoArgs._modality;
      delete echoArgs._details;
      const input = { action: action.name, args: echoArgs, modality, details };

      // Find which step keyspace to use.
      const stepKey = this._tutorStepKey(action.name);
      if (!stepKey) return null;

      // Categorize correct vs incorrect (and which error type).
      const correct = result && result.validation && result.validation.correct === true;
      const errorType = correct ? null : this._categorizeError(action, result);

      // Build the completionDialogue.
      const params = this._tutorParams(action, result, correct);
      const completionKey = correct
        ? `tutor.${stepKey}.correct`
        : `tutor.${stepKey}.incorrect.${errorType || 'generic'}`;
      const completionDialogue = t(completionKey, params);

      // Build talkingPoints (2-3 variants per step).
      const variants = correct
        ? ['confirm', 'transition']
        : ['reframe', 'encourage', 'askMtable'];
      const talkingPoints = variants
        .map(v => t(`tutor.${stepKey}.points.${v}`, params))
        .filter(p => p.ui != null || p.en != null);

      // Build nextStepHint.
      const hintKey = correct
        ? `tutor.${stepKey}.nextHint.transition`
        : `tutor.${stepKey}.nextHint.retry`;
      const nextStepHint = t(hintKey, params);

      // Build the next.recommended block.
      const next = this._tutorNext(action, result, correct);

      return { input, tutor: { completionDialogue, talkingPoints, nextStepHint }, next };
    }

    _tutorStepKey(actionName) {
      switch (actionName) {
        case 'chooseDividendDigits':         return 'startingDigit';
        case 'chooseQuotientDigit':          return 'quotient';
        case 'setPartialProduct':            return 'product';
        case 'setSubtractionResult':         return 'subtract';
        case 'bringDownDigit':               return 'bringDown';
        case 'setRemainder':                 return 'remainder';
        case 'selectMultiplicationTableRow': return 'quotient';
        default: return null;
      }
    }

    _categorizeError(action, result) {
      // chooseDividendDigits compares ARRAY lengths, not digit values.
      if (action.name === 'chooseDividendDigits') {
        const accepted = action.args && action.args.digits;
        const expected = result && result.validation && result.validation.expected;
        if (Array.isArray(accepted) && Array.isArray(expected)) {
          if (accepted.length > expected.length) return 'tooManyDigits';
          if (accepted.length < expected.length) return 'notEnoughDigits';
        }
        return 'generic';
      }
      const accepted = action.args && action.args.value;
      const expected = result && result.validation && result.validation.expected;
      if (accepted === 0 && expected !== 0) return 'zero';
      if (typeof accepted === 'number' && typeof expected === 'number') {
        if (action.name === 'chooseQuotientDigit') {
          const { divisor } = problem();
          if (accepted * divisor > expected * divisor) return 'tooHigh';
          if (accepted * divisor < expected * divisor) return 'tooLow';
        }
        if (action.name === 'setSubtractionResult' || action.name === 'setPartialProduct') {
          if (accepted > expected) return 'tooHigh';
          if (accepted < expected) return 'tooLow';
        }
      }
      return 'generic';
    }

    _tutorParams(action, result, correct) {
      const { dividend, divisor } = problem();
      // chooseDividendDigits has array args; everything else has scalar `value`.
      if (action.name === 'chooseDividendDigits') {
        const acceptedArr = (action.args && action.args.digits) || [];
        const expectedArr = (result && result.validation && result.validation.expected) || [];
        const dStr = String(dividend);
        const valueFromIdx = (arr) => {
          if (!Array.isArray(arr) || arr.length === 0) return null;
          const s = arr.map(i => dStr[i] || '').join('');
          const n = parseInt(s, 10);
          return isNaN(n) ? null : n;
        };
        return {
          dividend, divisor,
          accepted: acceptedArr,
          expected: expectedArr,
          value: valueFromIdx(correct ? expectedArr : acceptedArr)
        };
      }
      const accepted = action.args && action.args.value;
      const expected = result && result.validation && result.validation.expected;
      const params = { dividend, divisor, accepted, expected };
      if (action.name === 'chooseQuotientDigit') {
        const h = handle();
        const idx = h ? h.getGuidedStepIndex() : 0;
        const dividendDigits = String(dividend).split('').map(Number);
        const value = dividendDigits[idx] !== undefined ? dividendDigits[idx] : dividend;
        params.value = value;
        params.product = correct ? expected * divisor : null;
        params.productAccepted = (typeof accepted === 'number') ? accepted * divisor : null;
        params.expectedProduct = (typeof expected === 'number') ? expected * divisor : null;
        params.direction = (accepted > expected) ? 'smaller' : 'bigger';
      }
      return params;
    }

    _tutorNext(action, result, correct) {
      const stepKey = this._tutorStepKey(action.name);
      const params  = this._tutorParams(action, result, correct);
      const t = (key, p) => global.buildLocalizedPayload({ key, params: p });
      // Possible next actions in current step (after dispatch). For wrong answers, possibles
      // remain the same as before (step didn't advance). For correct, _expectedActionsForStep
      // gives the new step's actions.
      const stepName = correct ? currentStep() : (result && result.stepBefore) || '';
      const possibleNames = this._expectedActionsForStep(stepName);
      const possible = possibleNames.map(name => {
        const m = this.getManifest().semanticActions.find(a => a.name === name);
        return m ? { name: m.name, args: m.args } : { name, args: {} };
      });
      // Recommended: same step's top action, with pre-computed args when knowable.
      let recommended = null;
      if (action.name === 'chooseDividendDigits') {
        const expected = result && result.validation && result.validation.expected;
        recommended = {
          name: 'chooseDividendDigits',
          args: { digits: expected },
          pedagogical: true,
          rationale: t(`tutor.startingDigit.reco`, params)
        };
      } else if (action.name === 'chooseQuotientDigit') {
        const expected = result && result.validation && result.validation.expected;
        recommended = {
          name: 'chooseQuotientDigit',
          args: { column: action.args.column, value: expected },
          pedagogical: true,
          rationale: t(`tutor.quotient.reco`, params)
        };
      } else if (action.name === 'setSubtractionResult') {
        const expected = result && result.validation && result.validation.expected;
        recommended = {
          name: 'setSubtractionResult',
          args: { column: action.args.column, value: expected },
          pedagogical: false,
          rationale: t(`tutor.subtract.reco`, params)
        };
      }
      // (Other actions: keep recommended as null in v1.1 unless we add per-action computation later.)
      return { possible, recommended };
    }

    _fillCell(rowKind, action, stepBefore, columnArg) {
      const h = handle();
      if (!h) return this._noHandle(action);
      const { value } = action.args || {};
      if (!Number.isInteger(value) || value < 0 || value > 9) return this._badArgs(action, 'value must be digit 0-9');
      if (columnArg === 'column') {
        const col = action.args.column;
        if (!Number.isInteger(col) || col < 0) return this._badArgs(action, 'column must be int >= 0');
      }
      // Read the actual cellKey from the active guided step rather than computing it.
      // Different rows use different key shapes: `quotient-{c}`, `subtract-{r}-{c}`,
      // `difference-{r}-{c}`, `remainder-0`, etc. The guided state machine tells us
      // which cell is currently expected; trust that source rather than guessing.
      const steps = h.getGuidedSteps();
      const idx   = h.getGuidedStepIndex();
      const step  = steps && steps[idx];
      if (!step || !step.cellKey) {
        return { ok: false, actionId: action.actionId,
                 error: { code: 'E_DISABLED_ACTION',
                          message: `no active guided step for ${action.name}` } };
      }
      const cellKey = step.cellKey;
      const r = h.applyDigit({ cellKey, value, source: action.source || 'ai' });
      // Use applyDigit's advancedTo (computed inside the wrapper before React's
      // setGuidedStepIndex flush) instead of re-querying currentStep, which would
      // read the stale pre-advance index.
      const stepAfter = r.correct ? (r.advancedTo || 'complete') : stepBefore;
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter,
        validation: { correct: r.correct, expected: r.expected, accepted: value },
        feedback: r.correct
          ? { kind: 'correct',  sound: 'correct.mp3' }
          : { kind: 'incorrect', sound: 'wrong.mp3' },
        stateDelta: { [`uiElementValues.page2-grid-${cellKey}`]: value }
      };
    }

    _bringDown(action, stepBefore) {
      const h = handle();
      if (!h) return this._noHandle(action);
      // Trigger the grid's programmatic bring-down (fills the target cell + advances).
      // The user-facing path is a click on the highlighted dividend digit; the surface
      // calls the same end state without the 610ms animation.
      if (typeof h.bringDownNextDigit !== 'function') {
        // Older grid handle without the setter — best-effort no-op fallback.
        return {
          ok: true, actionId: action.actionId, page: 2,
          stepBefore, stepAfter: currentStep(),
          validation: { correct: true },
          feedback: null,
          stateDelta: {}
        };
      }
      const r = h.bringDownNextDigit();
      if (!r.ok) {
        return { ok: false, actionId: action.actionId,
                 error: { code: 'E_DISABLED_ACTION',
                          message: 'current step is not bringDown' } };
      }
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore,
        stepAfter: r.advancedTo || 'complete',
        validation: { correct: true },
        feedback: { kind: 'correct', sound: 'correct.mp3' },
        stateDelta: { 'stepContext.bringDown': true }
      };
    }

    _chooseStartingDigits(action, stepBefore) {
      const h = handle();
      if (!h) return this._noHandle(action);
      const { digits } = action.args || {};
      if (!Array.isArray(digits) || !digits.every(d => Number.isInteger(d) && d >= 0)) {
        return this._badArgs(action, 'digits must be array of int>=0');
      }
      if (typeof h.selectStartingDigit !== 'function') {
        return { ok: false, actionId: action.actionId,
                 error: { code: 'E_NOT_INTERACTABLE',
                          message: 'grid handle does not expose selectStartingDigit' } };
      }
      // Validate against canonical pedagogy: smallest leftmost prefix of the dividend
      // whose value is ≥ divisor. For 96 ÷ 3 the answer is [0] (9 ≥ 3); for 13 ÷ 2 it's
      // [0, 1] (13 ≥ 2 because 1 < 2 alone). [0, 1] for 96÷3 is "tooManyDigits" — wrong.
      const expected = this._expectedStartingDigits();
      const correct  = digits.length === expected.length &&
                       digits.every((d, i) => d === expected[i]);

      // Only mutate grid state if the selection is correct. Wrong selections leave the
      // grid alone so the AI's coaching response (using the tutor block) makes sense.
      if (correct) {
        for (const d of digits) h.selectStartingDigit(d);
      }

      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter: correct ? currentStep() : stepBefore,
        validation: { correct, expected, accepted: digits },
        feedback: correct
          ? { kind: 'correct',  sound: 'correct.mp3' }
          : { kind: 'incorrect', sound: 'wrong.mp3' },
        stateDelta: correct ? { 'stepContext.selectedStartingDigits': digits } : {}
      };
    }

    _expectedStartingDigits() {
      const { dividend, divisor } = problem();
      const dStr = String(dividend);
      let acc = 0;
      for (let i = 0; i < dStr.length; i++) {
        acc = acc * 10 + Number(dStr[i]);
        if (acc >= divisor) {
          return Array.from({ length: i + 1 }, (_, k) => k);
        }
      }
      // Whole dividend < divisor. Take everything (quotient will be 0).
      return dStr.split('').map((_, i) => i);
    }

    _mtableRow(action, stepBefore) {
      const h = handle();
      if (!h) return this._noHandle(action);
      const { multiplier } = action.args || {};
      if (!Number.isInteger(multiplier) || multiplier < 1 || multiplier > 10) {
        return this._badArgs(action, 'multiplier must be 1..10');
      }
      // If we're at the chooseQuotientDigit step, this is equivalent to choosing the multiplier as the digit.
      if (currentStep() === 'chooseQuotientDigit') {
        const idx = h.getGuidedStepIndex();
        const cellKey = `quotient-${idx}`;
        const r = h.applyDigit({ cellKey, value: multiplier, source: 'mtable' });
        return {
          ok: true, actionId: action.actionId, page: 2,
          stepBefore, stepAfter: currentStep(),
          validation: { correct: r.correct, expected: r.expected, accepted: multiplier },
          feedback: r.correct ? { kind: 'correct', sound: 'correct.mp3' } : { kind: 'incorrect', sound: 'wrong.mp3' },
          stateDelta: { [`uiElementValues.page2-grid-${cellKey}`]: multiplier }
        };
      }
      // Otherwise, just record the row selection without effect.
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter: stepBefore,
        validation: { correct: true, accepted: multiplier },
        feedback: null,
        stateDelta: {}
      };
    }

    _noHandle(action) {
      return { ok: false, actionId: action.actionId,
               error: { code: 'E_NOT_INTERACTABLE', message: 'long-division grid not mounted' } };
    }

    _badArgs(action, message) {
      return { ok: false, actionId: action.actionId,
               error: { code: 'E_BAD_ARGS', message } };
    }
  }

  global.LongDivisionSurface = LongDivisionSurface;
})(typeof window !== 'undefined' ? window : globalThis);
