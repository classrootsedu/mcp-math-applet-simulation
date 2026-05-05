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
          { name: 'chooseDividendDigits',         args: { digits: 'int[]' } },
          { name: 'chooseQuotientDigit',          args: { column: 'int>=0', value: 'digit' } },
          { name: 'setPartialProduct',            args: { column: 'int>=0', value: 'digit' } },
          { name: 'setSubtractionResult',         args: { column: 'int>=0', value: 'digit' } },
          { name: 'bringDownDigit',               args: { fromColumn: 'int>=0' } },
          { name: 'setRemainder',                 args: { value: 'digit' } },
          { name: 'selectMultiplicationTableRow', args: { multiplier: 'int 1..10' } }
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
      // multiplication table (1-10)
      const div = problem().divisor;
      for (let m = 1; m <= 10; m++) {
        els.push({ id: `page2-mtable-row-${m}`, role: 'row',
                   label: { ui: `${div} × ${m} = ${div*m}`, en: `${div} × ${m} = ${div*m}`, i18nKey: null, params: { divisor: div, multiplier: m } } });
      }
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
      return {
        ok: true, actionId: action.actionId, page: 2,
        stepBefore, stepAfter: currentStep(),
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
      // The actual selection mutator is internal; the existing dividend-click handler stays the
      // source of truth. We expose this action for parity but route via the click handler when
      // available — for v1, surface the call as accepted and let the user-facing step advance
      // via the existing path. Future work: add a setter on the grid handle.
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
