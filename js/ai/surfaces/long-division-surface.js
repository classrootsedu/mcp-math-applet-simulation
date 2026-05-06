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
      if (action.name === 'chooseQuotientDigit') {
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
      let cellKey;
      if (columnArg === 'column') {
        const col = action.args.column;
        if (!Number.isInteger(col) || col < 0) return this._badArgs(action, 'column must be int >= 0');
        cellKey = `${rowKind}-${col}`;
      } else {
        cellKey = `${rowKind}-0`;
      }
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
      // Bring-down currently happens automatically when guided step reaches 'bringDown';
      // expose as a no-op confirmation that returns the new state.
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter: currentStep(),
        validation: { correct: true },
        feedback: null,
        stateDelta: {}
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
      // The grid's selectStartingDigit only accepts sequential additions (0, then 1, then 2…)
      // and removes from the end. Apply the digits in order.
      for (const d of digits) {
        h.selectStartingDigit(d);
      }
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter: currentStep(),
        validation: { correct: true, accepted: digits },
        stateDelta: { 'stepContext.selectedStartingDigits': digits }
      };
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
