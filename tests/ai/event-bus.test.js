const { test } = require('node:test');
const assert = require('node:assert');
const { newWindow, teardownWindow } = require('../helpers/setup-jsdom');

function loadBus() {
  newWindow();
  delete require.cache[require.resolve('../../js/ai/event-bus.js')];
  require('../../js/ai/event-bus.js');
  return new global.window.AIEventBus({ capacity: 5 });
}

test('eventBus: emit/subscribe round-trip with monotonic seq', () => {
  const bus = loadBus();
  const received = [];
  bus.subscribe({}, (e) => received.push(e));
  bus.emit({ type: 'a', source: 'system' });
  bus.emit({ type: 'b', source: 'ai' });
  assert.equal(received.length, 2);
  assert.equal(received[0].seq, 0);
  assert.equal(received[1].seq, 1);
  assert.ok(typeof received[0].ts === 'number');
  teardownWindow();
});

test('eventBus: filter by types and source', () => {
  const bus = loadBus();
  const got = [];
  bus.subscribe({ types: ['x'], source: 'human' }, (e) => got.push(e));
  bus.emit({ type: 'x', source: 'ai' });
  bus.emit({ type: 'x', source: 'human' });
  bus.emit({ type: 'y', source: 'human' });
  assert.equal(got.length, 1);
  assert.equal(got[0].type, 'x');
  teardownWindow();
});

test('eventBus: ring buffer capacity drops oldest and counts dropped', () => {
  const bus = loadBus(); // capacity 5
  for (let i = 0; i < 7; i++) bus.emit({ type: 'tick', source: 'system' });
  const r = bus.transcript({ since: 0 });
  assert.equal(r.events.length, 5);
  assert.equal(r.dropped, 2);
  assert.equal(r.oldestSeq, 2);
  assert.equal(r.newestSeq, 6);
  teardownWindow();
});

test('eventBus: transcript filters by since', () => {
  const bus = loadBus();
  for (let i = 0; i < 4; i++) bus.emit({ type: 't', source: 'system' });
  const r = bus.transcript({ since: 2 });
  assert.deepEqual(r.events.map(e => e.seq), [2, 3]);
  teardownWindow();
});

test('eventBus: unsubscribe stops delivery', () => {
  const bus = loadBus();
  let count = 0;
  const off = bus.subscribe({}, () => count++);
  bus.emit({ type: 'a', source: 'ai' });
  off();
  bus.emit({ type: 'b', source: 'ai' });
  assert.equal(count, 1);
  teardownWindow();
});
