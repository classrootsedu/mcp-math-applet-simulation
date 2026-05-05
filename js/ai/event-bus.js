(function (global) {
  'use strict';

  class AIEventBus {
    constructor({ capacity = 2000 } = {}) {
      this._capacity = capacity;
      this._buffer = [];                 // ring buffer of events
      this._oldestSeq = 0;
      this._dropped = 0;
      this._nextSeq = 0;
      this._subs = new Map();            // id → {filter, cb}
      this._nextSubId = 1;
    }

    emit(partial) {
      const event = Object.assign({
        seq: this._nextSeq++,
        ts:  Date.now(),
        page: undefined,
        questionIndex: undefined,
        actionId: undefined,
        payload: undefined
      }, partial);

      // ring buffer
      this._buffer.push(event);
      if (this._buffer.length > this._capacity) {
        this._buffer.shift();
        this._oldestSeq++;
        this._dropped++;
      }

      // fanout
      for (const { filter, cb } of this._subs.values()) {
        if (this._matches(event, filter)) {
          try { cb(event); } catch (err) { console.error('[AIEventBus] subscriber threw', err); }
        }
      }
      return event;
    }

    subscribe(filter, cb) {
      const id = this._nextSubId++;
      this._subs.set(id, { filter: filter || {}, cb });
      // initial replay if `since` provided
      if (filter && typeof filter.since === 'number') {
        for (const e of this._buffer) {
          if (e.seq >= filter.since && this._matches(e, filter)) {
            try { cb(e); } catch (err) { console.error('[AIEventBus] replay threw', err); }
          }
        }
      }
      return () => this._subs.delete(id);
    }

    transcript({ since = 0, limit = Infinity } = {}) {
      const events = [];
      for (const e of this._buffer) {
        if (e.seq >= since) {
          events.push(e);
          if (events.length >= limit) break;
        }
      }
      return {
        events,
        oldestSeq: this._oldestSeq,
        newestSeq: this._nextSeq - 1,
        dropped:   this._dropped
      };
    }

    clear() {
      this._buffer = [];
      this._oldestSeq = this._nextSeq;
      this._dropped = 0;
    }

    _matches(event, filter) {
      if (filter.types && !filter.types.includes(event.type)) return false;
      if (filter.pages && !filter.pages.includes(event.page)) return false;
      if (filter.source && event.source !== filter.source) return false;
      return true;
    }
  }

  global.AIEventBus = AIEventBus;
})(typeof window !== 'undefined' ? window : globalThis);
