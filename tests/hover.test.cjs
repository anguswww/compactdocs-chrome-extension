const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { readFileSync } = require('node:fs');
function setup() {
  const classes = new Set(), props = new Map(), buttons = new Map(), events = new Map(), timers = new Map();
  let timerId = 0;
  class Element {
    constructor(side) { this.side = side; this.events = new Map(); this.attrs = new Map(); }
    addEventListener(name, fn) { this.events.set(name, fn); }
    setAttribute(name, value) { this.attrs.set(name, value); }
    contains(node) { return this === node; }
    closest(selector) { return this.side && selector.includes(this.side === 'left' ? '.left-sidebar-container' : '.docs-companion') ? this : null; }
    matches() { return this.keyboard; }
    focus() { document.activeElement = this; this.fire('focus'); }
    blur() { document.activeElement = null; }
    fire(name) { this.events.get(name)?.(); }
  }
  const document = {
    activeElement:null,
    hasFocus:()=>false,
    documentElement: {
      classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key),remove:key=>classes.delete(key)},
      style:{getPropertyValue:key=>props.get(key),setProperty:(key,value)=>props.set(key,value)}
    },
    body:{appendChild(button){button.isConnected=true;buttons.set(button.id,button);}},
    querySelector:()=>({getBoundingClientRect:()=>({top:129})}),
    createElement:()=>new Element(),
    addEventListener:(name,fn)=>events.set(name,fn)
  };
  const context=vm.createContext({document,Element,Event:class {},window:{dispatchEvent(){},addEventListener:(name,fn)=>events.set(`window:${name}`,fn)},clearTimeout:id=>timers.delete(id),setTimeout:fn=>{timers.set(++timerId,fn);return timerId;}});
  vm.runInContext(readFileSync('hover.js','utf8'),context);
  const controller=vm.runInContext('compactDocsHover',context);
  controller.update({collapseTabs:true,hideRightPanel:true});
  return {controller,buttons,classes,document,Element,
    event:(name,event)=>events.get(name)?.(event),
    flush:()=>{const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());}};
}
test('editor teardown cancels pending hover and hides stale controls',()=>{
  const app=setup(), button=app.buttons.get('compactdocs-edge-left');
  button.fire('pointerenter');
  app.document.querySelector=()=>null;
  app.controller.update({collapseTabs:true,hideRightPanel:true});
  app.flush();
  assert.equal(app.controller.isOpen(),false);
  for (const edge of app.buttons.values()) assert.equal(edge.hidden,true);
});
test('editor teardown dismisses an already open panel',()=>{
  const app=setup();
  app.buttons.get('compactdocs-edge-left').fire('click');
  app.document.querySelector=()=>null;
  app.controller.update({collapseTabs:true,hideRightPanel:true});
  assert.equal(app.controller.isOpen(),false);
});
test('hover reveals one panel and closes when pointer leaves, even if app retains focus',()=>{
  const app=setup();
  app.buttons.get('compactdocs-edge-left').fire('pointerenter');app.flush();
  assert.ok(app.classes.has('compactdocs-peek-left'));
  app.buttons.get('compactdocs-edge-right').fire('pointerenter');app.flush();
  assert.ok(!app.classes.has('compactdocs-peek-left'));
  const panel=new app.Element('right');
  app.document.activeElement=panel;
  app.event('pointerover',{target:new app.Element()});app.flush();
  assert.equal(app.controller.isOpen(),false);
});
test('moving from edge button into panel cancels delayed close',()=>{
  const app=setup(), button=app.buttons.get('compactdocs-edge-left');
  button.fire('pointerenter');app.flush();button.fire('pointerleave');
  app.event('pointerover',{target:new app.Element('left')});app.flush();
  assert.equal(app.controller.isOpen(),true);
});
test('keyboard access and Escape close; disabled settings remove hover access',()=>{
  const app=setup(), button=app.buttons.get('compactdocs-edge-left');
  button.keyboard=true;button.focus();
  assert.equal(app.controller.isOpen(),true);
  app.event('keydown',{key:'Escape'});
  assert.equal(app.controller.isOpen(),false);
  app.controller.update({collapseTabs:false,hideRightPanel:false});
  assert.equal(button.hidden,true);
});

test('brief edge passes do not open a panel and window blur dismisses it',()=>{
  const app=setup(), button=app.buttons.get('compactdocs-edge-left');
  button.fire('pointerenter');
  assert.equal(app.controller.isOpen(),false);
  button.fire('pointerleave');app.flush();
  assert.equal(app.controller.isOpen(),false);
  button.fire('pointerenter');app.flush();
  assert.equal(app.controller.isOpen(),true);
  app.event('window:blur');
  assert.equal(app.controller.isOpen(),false);
});
test('disabled panel cannot open from a pending hover timer',()=>{
  const app=setup(), button=app.buttons.get('compactdocs-edge-left');
  button.fire('pointerenter');
  app.controller.update({collapseTabs:false,hideRightPanel:true});app.flush();
  assert.equal(app.controller.isOpen(),false);
});
test('leaving the browser cancels a pending reveal',()=>{
  const app=setup(), button=app.buttons.get('compactdocs-edge-left');
  button.fire('pointerenter');
  app.event('pointerout',{relatedTarget:null});app.flush();
  assert.equal(app.controller.isOpen(),false);
});

test('focus inside an embedded app does not dismiss its overlay',()=>{
  const app=setup();
  app.buttons.get('compactdocs-edge-right').fire('click');
  app.document.hasFocus=()=>true;
  app.event('window:blur');
  assert.equal(app.controller.isOpen(),true);
});
