const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
function setup() {
  const inputs = new Map(['collapseTabs', 'hideRightPanel', 'fitToWindow'].map(key => [key, {
    checked: false, disabled: false, events: {}, addEventListener(name, fn) { this.events[name] = fn; }
  }]));
  const messages = [];
  let load, save;
  const chrome = { runtime: {}, storage: { local: {
    get(defaults, callback) { load = callback; },
    set(value, callback) { save = callback; }
  } } };
  const document = { getElementById: key => inputs.get(key),
    createElement: () => ({ setAttribute() {} }), body: { appendChild: node => messages.push(node) } };
  vm.runInNewContext(readFileSync('popup.js', 'utf8'), { chrome, document });
  return { inputs, messages, chrome, load: value => load(value), save: () => save?.() };
}
test('storage load errors leave controls disabled and announce failure', () => {
  const app = setup();
  app.chrome.runtime.lastError = { message: 'Storage unavailable' };
  assert.doesNotThrow(() => app.load(undefined));
  for (const input of app.inputs.values()) assert.equal(input.disabled, true);
  assert.match(app.messages.at(-1).textContent, /load/i);
});
test('failed saves revert the checkbox and allow retry without a false success state', () => {
  const app = setup();
  app.load({ collapseTabs: true, hideRightPanel: true, fitToWindow: true });
  const input = app.inputs.get('collapseTabs');
  input.checked = false;
  input.events.change();
  assert.equal(input.disabled, true);
  app.chrome.runtime.lastError = { message: 'Write failed' };
  app.save();
  assert.equal(input.checked, true);
  assert.equal(input.disabled, false);
  assert.match(app.messages.at(-1).textContent, /save/i);
  delete app.chrome.runtime.lastError;
  input.checked = false;
  input.events.change();
  app.save();
  assert.equal(input.checked, false);
  assert.equal(input.disabled, false);
  assert.equal(app.messages.at(-1).textContent, '');
});
test('popup disables controls until preferences are loaded', () => {
  const app = setup();
  for (const input of app.inputs.values()) assert.equal(input.disabled, true);
  app.load({ collapseTabs: false, hideRightPanel: true, fitToWindow: true });
  assert.equal(app.inputs.get('collapseTabs').checked, false);
  for (const input of app.inputs.values()) assert.equal(input.disabled, false);
});
