const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
function boot() {
  let listener;
  const frames = [], timers = [];
  const state = { editor: true, calls: 0 };
  const window = { KX_resize: () => state.calls++ };
  vm.runInNewContext(readFileSync('layout.js', 'utf8'), {
    window, document: { querySelector: () => state.editor, addEventListener: (name, cb) => { assert.equal(name, 'compactdocs-layout-changed'); listener = cb; } },
    requestAnimationFrame: cb => frames.push(cb), setTimeout: cb => timers.push(cb)
  });
  return { state, window, frames, timers, notify: () => listener() };
}
test('layout bridge coalesces notifications and refreshes Docs after layout, without zoom changes', () => {
  const app = boot();
  app.notify(); app.notify();
  assert.equal(app.state.calls, 0);
  assert.equal(app.frames.length, 1);
  app.frames.shift()();
  assert.equal(app.state.calls, 1);
  assert.equal(app.timers.length, 0);
  app.notify(); app.frames.shift()();
  assert.equal(app.state.calls, 2);
});
test('layout bridge tolerates missing and partially initialized Docs, with bounded retries', () => {
  const app = boot();
  delete app.window.KX_resize;
  app.notify(); app.frames.shift()();
  app.window.KX_resize = () => { throw Error('loading'); };
  app.timers.shift()();
  app.window.KX_resize = () => app.state.calls++;
  app.timers.shift()();
  assert.equal(app.state.calls, 1);
  delete app.window.KX_resize;
  app.notify(); app.frames.shift()();
  let attempts = 0;
  while (app.timers.length && attempts < 20) { app.timers.shift()(); attempts++; }
  assert.equal(attempts, 10);
  assert.equal(app.timers.length, 0);
});
test('editor teardown cancels a pending layout refresh', () => {
  const app = boot(); app.notify(); app.state.editor = false; app.frames.shift()();
  assert.equal(app.state.calls, 0);
  assert.equal(app.timers.length, 0);
});
