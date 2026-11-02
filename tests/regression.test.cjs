const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function boot(zoom = '100%', options = {}) {
  const nodes = new Map();
  const frames = [], timers = [];
  const listeners = new Map();
  let observer, storageListener, resolveStorage;
  class Element {
    constructor() { this.style = {}; this.value = zoom; }
    focus() {}
    blur() {}
    dispatchEvent(event) { listeners.get(event.type)?.({target:this,isTrusted:false}); }
    getAttribute() { return null; }
    getBoundingClientRect() { return { width: 800 * parseFloat(input.value) / 100 }; }
  }
  const input = new Element();
  const combo = new Element();
  combo.contains = target => target === combo || target === input;
  const root = new Element();
  const props = new Map(), classes = new Set();
  root.style = {getPropertyValue: k => props.get(k), setProperty: (k,v) => props.set(k,v)};
  root.classList = {contains: k => classes.has(k), toggle: (k,v) => v ? classes.add(k) : classes.delete(k)};
  const body = new Element();
  body.classList = {contains: k => k === 'docs-body-pageless' && options.pageless};
  const head = {appendChild: n => nodes.set(n.id,n)};
  const doc = {
    addEventListener: (type, cb) => listeners.set(type, cb),
    documentElement: root, head, body, activeElement: null,
    getElementById: id => nodes.get(id), createElement: () => new Element(),
    querySelectorAll: () => [],
    querySelector: selector => ({
      '#zoomSelect': combo, '#zoomSelect input': input, '.canvas-first-page': options.noEditor ? null : new Element(),
      '#docs-editor': options.noEditor ? null : {style:{width:`${options.width || 768}px`}},
      '.navigation-widget': {classList:{contains:()=>true}}
    })[selector]
  };
  const context = vm.createContext({
    document: doc, HTMLElement: Element, Event: class {}, MouseEvent: class {}, KeyboardEvent: class { constructor(type) { this.type=type; } },
    window: {get innerWidth(){return options.width || 768;}, addEventListener(){}, dispatchEvent(){}},
    requestAnimationFrame: cb => frames.push(cb), setTimeout: cb => timers.push(cb),
    MutationObserver: class { constructor(cb) {observer=cb;} observe(target) {assert.equal(target,root);} },
    chrome:{storage:{local:{get:(defaults,cb)=>{const snapshot={...defaults,...options.settings};resolveStorage=()=>cb(snapshot);if(!options.deferStorage)resolveStorage();}},onChanged:{addListener(cb){storageListener=cb;}}}}
  });
  vm.runInContext(readFileSync('styles.js','utf8'),context);
  vm.runInContext(readFileSync('content.js','utf8'),context);
  const flush = () => { for(let i=0;frames.length && i<20;i++) frames.shift()(); };
  flush();
  return {nodes, input, combo, doc, root, emit:(type,target,details={})=>{listeners.get(type)?.({target,...details});flush();}, resolveStorage:()=>{resolveStorage();flush();}, observer:()=>{observer();flush();}, timers, flush, changeSettings: values=>{storageListener(Object.fromEntries(Object.entries(values).map(([key,newValue])=>[key,{newValue}])),"local");flush();}};
}
test('storage changes during startup take precedence over the stale initial snapshot', () => {
  const app=boot('100%', {deferStorage:true});
  app.changeSettings({fitToWindow:false,hideRightPanel:false});
  app.resolveStorage();
  assert.equal(app.input.value,'100%');
  assert.equal(app.root.classList.contains('compactdocs-hide-right'),false);
  app.changeSettings({hideRightPanel:undefined});
  assert.equal(app.root.classList.contains('compactdocs-hide-right'),true);
});

test('wide windows keep their existing numeric zoom', () => {
  const app = boot('100%', {width:1400});
  assert.equal(app.input.value,'100%');
});

test('narrow windows select native Fit rather than a calculated percentage', () => {
  const app = boot('100%', {width:780});
  assert.equal(app.input.value,'Fit');
});

test('a saved numeric zoom other than 100% is respected even in a narrow window', () => {
  const app=boot('125%', {width:620});
  assert.equal(app.input.value,'125%');
});

test('leaving a narrow window restores the zoom that automatic Fit replaced', () => {
  const options={width:620};
  const app=boot('100%',options);
  assert.equal(app.input.value,'Fit');
  options.width=1400;app.observer();
  assert.equal(app.input.value,'100%');
});

test('explicit pointer Fit remains manual after widening', () => {
  const options={width:620};
  const app=boot('100%',options);
  assert.equal(app.input.value,'Fit');
  app.emit('pointerdown',app.combo,{isTrusted:true});
  app.input.value='Fit';app.observer();
  options.width=1400;app.observer();
  assert.equal(app.input.value,'Fit');
});

test('explicit keyboard Fit remains manual after disabling automatic Fit', () => {
  const app=boot('100%',{width:620});
  assert.equal(app.input.value,'Fit');
  app.emit('keydown',app.input,{isTrusted:true,key:'Enter'});
  app.input.value='Fit';app.observer();
  app.changeSettings({fitToWindow:false});
  assert.equal(app.input.value,'Fit');
});

test('synthetic zoom interactions retain automatic Fit ownership', () => {
  for (const disable of [false,true]) {
    const options={width:620};
    const app=boot('100%',options);
    app.emit('pointerdown',app.combo,{isTrusted:false});
    app.emit('keydown',app.input,{isTrusted:false,key:'Enter'});
    app.emit('focusout',app.input,{isTrusted:true});
    if (disable) app.changeSettings({fitToWindow:false});
    else { options.width=1400;app.observer(); }
    assert.equal(app.input.value,'100%');
  }
});

test('trusted interactions outside zoom retain automatic Fit ownership', () => {
  const app=boot('100%',{width:620});
  app.emit('pointerdown',app.doc.body,{isTrusted:true});
  app.emit('keydown',app.doc.body,{isTrusted:true,key:'Enter'});
  app.changeSettings({fitToWindow:false});
  assert.equal(app.input.value,'100%');
});

test('manual numeric zoom after explicit Fit is not replaced by later layout work', () => {
  const app=boot('100%',{width:620});
  app.emit('keydown',app.input,{isTrusted:true,key:'Enter'});
  app.observer();
  app.input.value='100%';app.observer();
  app.changeSettings({hideRightPanel:false});
  assert.equal(app.input.value,'100%');
});

test('automatic zoom does not overwrite or blur the zoom field while it is being edited', () => {
  const options={width:620};
  const app=boot('100%',options);
  app.doc.activeElement=app.input;
  options.width=1400;
  app.observer();
  assert.equal(app.input.value,'Fit');
  app.input.value='125%';
  app.doc.activeElement=null;
  app.observer();
  assert.equal(app.input.value,'125%');
});

test('deferred restoration resumes after the user leaves the zoom field', () => {
  const options={width:620};
  const app=boot('100%',options);
  app.doc.activeElement=app.input;
  options.width=1400;app.observer();
  app.doc.activeElement=null;
  app.emit('focusout',app.input);
  assert.equal(app.input.value,'100%');
});

test('disabling automatic Fit restores only the zoom owned by the extension', () => {
  const app=boot('100%',{width:620});
  assert.equal(app.input.value,'Fit');
  app.changeSettings({fitToWindow:false});
  assert.equal(app.input.value,'100%');
  const manual=boot('Fit',{width:620});
  manual.changeSettings({fitToWindow:false});
  assert.equal(manual.input.value,'Fit');
});

test('changing a sidebar setting does not override a manual 100% zoom', () => {
  const app=boot('100%',{width:620});
  app.input.value='100%';app.observer();
  assert.equal(app.input.value,'100%');
  app.changeSettings({hideRightPanel:false});
  assert.equal(app.input.value,'100%');
});

test('layout styles are restored after Docs removes them', () => {
  const app=boot();
  assert.equal(app.nodes.get('compactdocs-layout-style').textContent,readFileSync('compact.css','utf8'));
  app.nodes.delete('compactdocs-layout-style');
  app.observer();
  assert.ok(app.nodes.has('compactdocs-layout-style'));
});
test('native Fit stays Fit rather than becoming a numeric percentage', () => {
  const app=boot('Fit');
  assert.equal(app.input.value,'Fit');
  assert.equal(app.timers.length,0);
  app.input.value='75%';app.observer();
  assert.equal(app.input.value,'75%');
});
test('manifest injects embedded styles before the content script', () => {
  const manifest=JSON.parse(readFileSync('manifest.json','utf8'));
  assert.deepEqual(manifest.content_scripts[0].js,['styles.js','hover.js','content.js']);
});

test('pageless preserves native zoom even when a stale page canvas exists', () => {
  const app = boot('125%', {pageless:true});
  app.observer();
  assert.equal(app.input.value,'125%');
  assert.equal(app.timers.length,0);
});
test('preview and loading screens without an editor are safe', () => {
  const app = boot('Fit', {noEditor:true});
  app.observer();
  assert.equal(app.input.value,'Fit');
  assert.equal(app.timers.length,0);
});

test('manual pageless zoom survives a later switch to pages', () => {
  const options = {pageless:true};
  const app = boot('100%',options);
  app.input.value='75%';app.observer();
  options.pageless=false;app.observer();
  assert.equal(app.input.value,'75%');
});
