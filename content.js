(() => {
  const defaults = { collapseTabs: true, hideRightPanel: true, fitToWindow: true };
  let settings = defaults;
  let attempted = false;
  let tabsAttempts = 0;
  let tabsRetryPending = false;
  let scheduled = false;
  let initialized = false;
  let lastZoom = null;
  let manualZoom = false;
  const collapsedRightControls = new WeakSet();
  function activate(control) {
    // Google Closure buttons activate on mouseup, rather than DOM click().
    for (const type of ['mousedown', 'mouseup', 'click']) {
      control.dispatchEvent(new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window,
        button: 0, buttons: type === 'mousedown' ? 1 : 0
      }));
    }
  }

  function fitPage() {
    if (!settings.fitToWindow || manualZoom) return;
    const input = document.querySelector('#zoomSelect input');
    const page = document.querySelector('.canvas-first-page');
    const editor = document.querySelector('#docs-editor');
    if (!input || !page || !editor) return;
    const value = input.value;
    if (!/^\d+(?:\.\d+)?%$/.test(value)) return;
    if (lastZoom !== null && value !== lastZoom) { manualZoom = true; return; }
    const sidebar = document.querySelector('.navigation-widget');
    if (settings.collapseTabs && !sidebar?.classList.contains('navigation-widget-hidden')) return;
    const baseWidth = page.getBoundingClientRect().width / (parseFloat(value) / 100);
    const leftReserve = settings.collapseTabs && sidebar?.classList.contains('navigation-widget-hidden')
      ? 0 : parseFloat(document.querySelector('.left-sidebar-container')?.style.width || '0');
    const available = parseFloat(editor.style.width) - leftReserve - 48;
    if (!baseWidth || available < 100) return;
    const target = `${Math.max(25, Math.min(200, Math.floor(available / baseWidth * 100)))}%`;
    lastZoom = value;
    if (value === target) return;
    lastZoom = target;
    // Change only the local view zoom using Docs' normal zoom input.
    const focused = document.activeElement;
    input.focus();
    input.value = target;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    for (const type of ['keydown', 'keypress', 'keyup']) {
      input.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    }
    const combo = document.querySelector('#zoomSelect');
    if (combo?.getAttribute('aria-expanded') === 'true') {
      const toolbar = document.querySelector('#docs-toolbar-wrapper');
      if (toolbar) activate(toolbar);
    }
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
  }
  function apply() {
    if (!initialized) return;
    const root = document.documentElement;
    let changed = false;
    for (const [name, enabled] of [
      ['compactdocs-hide-right', settings.hideRightPanel],
      ['compactdocs-compact-tabs', settings.collapseTabs]
    ]) {
      if (root.classList.contains(name) !== enabled) {
        root.classList.toggle(name, enabled);
        changed = true;
      }
    }

    // Hiding the inner rail alone leaves Docs reserving 56px in #docs-editor.
    // Collapse through the native control as well so Fit zoom and hit testing
    // use the larger viewport. Activation also works when our CSS hides the control.
    if (settings.hideRightPanel) {
      const hide = document.querySelector('.companion-collapser-button[aria-label="Hide side panel"]');
      if (hide && !collapsedRightControls.has(hide)) {
        collapsedRightControls.add(hide);
        activate(hide);
        changed = true;
      }
    }
    if (settings.collapseTabs && !attempted && !tabsRetryPending && tabsAttempts < 10) {
      const widget = document.querySelector('.navigation-widget');
      if (widget?.classList.contains('navigation-widget-hidden')) attempted = true;
      if (!attempted)
      for (const control of document.querySelectorAll('[aria-label], [data-tooltip]')) {
        const label = control.getAttribute('aria-label') || control.getAttribute('data-tooltip') || '';
        if (/^(?:hide|collapse)\s+(?:the\s+)?tabs\s*(?:&|and)\s*outlines?/i.test(label.trim())) {
          if (!control.getClientRects().length) continue;
          tabsAttempts++;
          tabsRetryPending = true;
          activate(control);
          setTimeout(() => { tabsRetryPending = false; schedule(); }, 250);
          changed = true;
          break;
        }
      }
    }
    const editorWidth = document.querySelector('#docs-editor')?.style.width;
    if (editorWidth && root.style.getPropertyValue('--compactdocs-editor-width') !== editorWidth) {
      root.style.setProperty('--compactdocs-editor-width', editorWidth);
      changed = true;
    }
    const sidebar = document.querySelector('.left-sidebar-container:has(.navigation-widget-hidden)');
    if (sidebar) {
      const gutter = sidebar.style.width;
      if (/^\d+(?:\.\d+)?px$/.test(gutter) && root.style.getPropertyValue('--compactdocs-tabs-gutter') !== gutter) {
        root.style.setProperty('--compactdocs-tabs-gutter', gutter);
        changed = true;
      }
    }
    if (changed) window.dispatchEvent(new Event('resize'));
    fitPage();
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; apply(); });
  }
  chrome.storage.local.get(defaults, value => {
    settings = value;
    initialized = true;
    schedule();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of Object.keys(defaults)) if (changes[key]) settings[key] = changes[key].newValue ?? defaults[key];
    attempted = false;
    tabsAttempts = 0;
    manualZoom = false;
    lastZoom = null;
    schedule();
  });
  window.addEventListener('resize', schedule);
  new MutationObserver(schedule).observe(document.body, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'style', 'aria-label', 'data-tooltip']
  });
})();
