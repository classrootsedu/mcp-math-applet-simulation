(function (global) {
  'use strict';

  function lookup(translations, key) {
    if (!translations) return null;
    const parts = key.split('.');
    let v = translations;
    for (const p of parts) {
      if (v && typeof v === 'object' && p in v) v = v[p];
      else return null;
    }
    return typeof v === 'string' ? v : null;
  }

  function interpolate(template, params) {
    if (template == null) return null;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (m, k) => params.hasOwnProperty(k) ? params[k] : m);
  }

  /**
   * Build a localized payload triple from an i18n key.
   * @param {{key: string, params?: object}} args
   * @returns {{ui: string|null, en: string|null, i18nKey: string, params: object}}
   */
  function buildLocalizedPayload({ key, params = {} }) {
    const data = global.AppData;
    const uiLang = data ? data.currentLanguage : 'en';
    const uiRaw  = data ? lookup(data.translations[uiLang], key) : null;
    const enRaw  = data ? lookup(data.translations.en,    key) : null;
    return {
      ui:      interpolate(uiRaw  ?? enRaw, params),
      en:      interpolate(enRaw,           params),
      i18nKey: key,
      params:  params
    };
  }

  global.buildLocalizedPayload = buildLocalizedPayload;
})(typeof window !== 'undefined' ? window : globalThis);
