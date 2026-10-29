const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function boot(zoom = '100%') {
  const nodes = new Map();
  const frames = [], timers = [];
  let observer;
  class Element {
    constructor() { this.style = {}; this.value = zoom; }
    focus() {}
    blur() {}
    dispatchEvent() {}
    getAttribute() { return null; }
    getBoundingClientRect() { return { width: 800 * parseFloat(input.value) / 100 }; }
  }
  const input = new Element();
  const root = new Element();
  const props = new Map(), classes = new Set();
  root.style = {getPropertyValue: k => props.get(k), setProperty: (k,v) => props.set(k,v)};
  root.classList = {contains: k => classes.has(k), toggle: (k,v) => v ? classes.add(k) : classes.delete(k)};
  const head = {appendChild: n => nodes.set(n.id,n)};
  const doc = {
    documentElement: root, head, body: new Element(), activeElement: null,
    getElementById: id => nodes.get(id), createElement: () => new Element(),
    querySelectorAll: () => [],
    querySelector: selector => ({
      '#zoomSelect input': input, '.canvas-first-page': new Element(),
      '#docs-editor': {style:{width:'768px'}},
      '.navigation-widget': {classList:{contains:()=>true}}
    })[selector]
  };
  const context = vm.createContext({
    document: doc, HTMLElement: Element, Event: class {}, MouseEvent: class {}, KeyboardEvent: class {},
    window: {addEventListener(){}, dispatchEvent(){}},
    requestAnimationFrame: cb => frames.push(cb), setTimeout: cb => timers.push(cb),
    MutationObserver: class { constructor(cb) {observer=cb;} observe(target) {assert.equal(target,root);} },
    chrome:{storage:{local:{get:(defaults,cb)=>cb(defaults)},onChanged:{addListener(){}}}}
  });
  vm.runInContext(readFileSync('styles.js','utf8'),context);
  vm.runInContext(readFileSync('content.js','utf8'),context);
  const flush = () => { for(let i=0;frames.length && i<20;i++) frames.shift()(); };
  flush();
  return {nodes, input, observer:()=>{observer();flush();}, timers, flush};
}
test('layout styles are restored after Docs removes them', () => {
  const app=boot();
  assert.equal(app.nodes.get('compactdocs-layout-style').textContent,readFileSync('compact.css','utf8'));
  app.nodes.delete('compactdocs-layout-style');
  app.observer();
  assert.ok(app.nodes.has('compactdocs-layout-style'));
});
test('saved Fit zoom is normalized before fitting; manual zoom is respected', () => {
  const app=boot('Fit');
  assert.equal(app.input.value,'100%');
  app.timers.shift()();app.flush();
  assert.equal(app.input.value,'90%'); // 768px viewport minus 48px fits 800px paper at 90%.
  app.input.value='75%';app.observer();
  assert.equal(app.input.value,'75%');
});
test('manifest injects embedded styles before the content script', () => {
  const manifest=JSON.parse(readFileSync('manifest.json','utf8'));
  assert.deepEqual(manifest.content_scripts[0].js,['styles.js','content.js']);
});
