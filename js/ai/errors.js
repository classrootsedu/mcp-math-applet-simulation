// js/ai/errors.js
(function (global) {
  'use strict';

  const AI_ERROR_CODES = Object.freeze({
    E_ORIGIN:           'E_ORIGIN',
    E_NO_HANDSHAKE:     'E_NO_HANDSHAKE',
    E_UNKNOWN_METHOD:   'E_UNKNOWN_METHOD',
    E_BAD_ARGS:         'E_BAD_ARGS',
    E_DISABLED_ACTION:  'E_DISABLED_ACTION',
    E_NO_SUCH_ELEMENT:  'E_NO_SUCH_ELEMENT',
    E_NOT_INTERACTABLE: 'E_NOT_INTERACTABLE',
    E_ADMIN_DENIED:     'E_ADMIN_DENIED',
    E_INTERNAL:         'E_INTERNAL'
  });

  class AppApiError extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = 'AppApiError';
      this.code = code;
      this.details = details;
    }
    toJSON() {
      return { code: this.code, message: this.message, details: this.details };
    }
  }

  global.AI_ERROR_CODES = AI_ERROR_CODES;
  global.AppApiError = AppApiError;
})(typeof window !== 'undefined' ? window : globalThis);
