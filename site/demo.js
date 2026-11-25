// Hero demo: mirrors the extension's edge target. Pointing at the left edge opens
// the captured tabs overlay after a short delay; moving off the window closes it.
// Click, tap or keyboard toggles it.
(() => {
  const demo = document.querySelector('[data-demo]');
  if (!demo) return;
  const edge = demo.querySelector('.demo-edge');
  let timer;
  const set = open => {
    demo.classList.toggle('is-open', open);
    edge.setAttribute('aria-pressed', String(open));
    edge.setAttribute('aria-label', open ? 'Hide document tabs' : 'Show document tabs');
  };
  edge.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(timer);
    timer = setTimeout(() => set(true), 140);
  });
  edge.addEventListener('pointerleave', () => clearTimeout(timer));
  demo.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') { clearTimeout(timer); set(false); }
  });
  edge.addEventListener('click', event => {
    clearTimeout(timer);
    // A mouse is already hovering, so a click only confirms; taps and keys toggle.
    set(event.pointerType === 'mouse' || !demo.classList.contains('is-open'));
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') set(false); });
})();
