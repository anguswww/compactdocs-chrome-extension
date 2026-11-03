// Run in the Docs page after loading the extension, then call prepareCompactDocsCapture.
// This requests the same native layout refresh used by the Fit fix in the attached chat.
// It changes only local view state, not document contents.
window.prepareCompactDocsCapture = async ({ width, height = 900, hover = false }) => {
  if (innerWidth !== width || innerHeight !== height) {
    throw new Error(`Expected ${width}×${height}; got ${innerWidth}×${innerHeight}`);
  }
  if (!document.documentElement.classList.contains('compactdocs-compact-tabs')) {
    throw new Error('CompactDocs must be active before capture');
  }
  if (typeof window.KX_resize !== 'function') throw new Error('Docs layout refresh is unavailable');
  const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const settle = async () => { for (let i = 0; i < 4; i++) await frame(); };
  const escape = () => {
    const input = document.querySelector('#zoomSelect input');
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true
    }));
    input.blur();
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
  };
  escape();
  await document.fonts.ready;
  window.KX_resize();
  await settle();
  const input = document.querySelector('#zoomSelect input');
  input.focus();
  input.value = 'Fit';
  input.dispatchEvent(new Event('input', {bubbles: true}));
  for (const type of ['keydown', 'keypress', 'keyup']) {
    input.dispatchEvent(new KeyboardEvent(type, {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
    }));
  }
  await settle();
  escape();
  window.KX_resize();
  await settle();
  const editor = document.querySelector('.kix-appview-editor');
  editor.scrollTop = 0;
  editor.scrollLeft = 0;
  // Avoid capturing the blinking insertion caret in this source demonstration.
  if (!document.getElementById('compactdocs-capture-caret')) {
    const style = document.createElement('style');
    style.id = 'compactdocs-capture-caret';
    style.textContent = '.kix-cursor { visibility: hidden !important; }';
    document.head.appendChild(style);
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    if (document.querySelector('#zoomSelect').getAttribute('aria-expanded') !== 'true') break;
    escape();
    await settle();
  }
  if (document.querySelector('#zoomSelect').getAttribute('aria-expanded') === 'true') {
    throw new Error('Zoom menu is still open');
  }
  if (hover) document.querySelector('#compactdocs-edge-left').click();
  await settle();
  const page = document.querySelector('.canvas-first-page').getBoundingClientRect();
  const left = page.left, right = innerWidth - page.right;
  if (left < 0 || right < 0 || left > 64 || right > 64 || Math.abs(right - left) > 40) {
    throw new Error(`Stale or clipped Fit layout: left=${left}, right=${right}`);
  }
  return {
    viewport: {width: innerWidth, height: innerHeight},
    zoom: input.value, fonts: document.fonts.status,
    page: {x: page.x, width: page.width, right: page.right},
    gutters: {left, right}, hover, nativeLayoutRefreshed: true,
    source: location.href
  };
};
