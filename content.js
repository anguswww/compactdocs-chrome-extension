(() => {
  const defaults = { collapseTabs: true, hideRightPanel: true, fitToWindow: true };
  let settings = { ...defaults };
  const pendingSettings = {};
  let attempted = false;
  let tabsAttempts = 0;
  let tabsRetryPending = false;
  let scheduled = false;
  let initialized = false;
  let lastZoom = null;
  let manualZoom = false;
  let autoFitZoom = null;
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
    const input = document.querySelector('#zoomSelect input');
    const editor = document.querySelector('#docs-editor');
    // Do not commit or blur a user's in-progress zoom edit during layout work.
    if (!input || !editor || document.activeElement === input) return;
    const value = input.value;
    // Fit remains Docs' real zoom mode. The compact layout supplies its width.
    if (value === 'Fit') {
      lastZoom = value;
      manualZoom = false;
      if (autoFitZoom !== null && (!settings.fitToWindow || window.innerWidth > 960) && !document.body.classList.contains('docs-body-pageless') && !(typeof compactDocsHover !== 'undefined' && compactDocsHover.isOpen())) {
        lastZoom = autoFitZoom;
        autoFitZoom = null;
        setViewZoom(lastZoom);
      }
      return;
    }
    if (!/^\d+(?:\.\d+)?%$/.test(value)) return;
    if (lastZoom === null && value !== '100%') manualZoom = true;
    if (lastZoom !== null && value !== lastZoom) { manualZoom = true; autoFitZoom = null; }
    lastZoom = value;
    if (!settings.fitToWindow || manualZoom || document.body.classList.contains('docs-body-pageless')) return;
    if (typeof compactDocsHover !== 'undefined' && compactDocsHover.isOpen()) return;
    if (!(window.innerWidth > 0 && window.innerWidth <= 960)) return;
    if (!document.querySelector('.canvas-first-page') || !/^\d+(?:\.\d+)?%$/.test(value)) return;
    const sidebar = document.querySelector('.navigation-widget');
    if (settings.collapseTabs && !sidebar?.classList.contains('navigation-widget-hidden')) return;
    autoFitZoom = value;
    lastZoom = 'Fit';
    setViewZoom('Fit');
  }
  function setViewZoom(target) {
    const input = document.querySelector('#zoomSelect input');
    if (!input) return;
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
      activate(document.body);
    }
    input.blur();
    if (focused !== input && focused instanceof HTMLElement) focused.focus({ preventScroll: true });
  }
  function apply() {
    if (!initialized) return;
    const root = document.documentElement;
    let changed = false;
    if (!document.getElementById('compactdocs-layout-style')) {
      const style = document.createElement('style');
      style.id = 'compactdocs-layout-style';
      style.textContent = COMPACTDOCS_CSS;
      (document.head || root).appendChild(style);
      changed = true;
    }
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
    const fullWidth = settings.hideRightPanel ? document.querySelector('#docs-chrome')?.getBoundingClientRect().width : 0;
    const editorWidth = fullWidth ? `${fullWidth}px` : document.querySelector('#docs-editor')?.style.width;
    if (editorWidth && !(typeof compactDocsHover !== 'undefined' && compactDocsHover.isOpen()) && root.style.getPropertyValue('--compactdocs-editor-width') !== editorWidth) {
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
    if (typeof compactDocsHover !== 'undefined') compactDocsHover.update(settings, activate);
    if (changed) window.dispatchEvent(new Event('resize'));
    fitPage();
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; apply(); });
  }
  chrome.storage.local.get(defaults, value => {
    settings = { ...defaults, ...value, ...pendingSettings };
    initialized = true;
    schedule();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of Object.keys(defaults)) if (changes[key]) {
      settings[key] = changes[key].newValue ?? defaults[key];
      if (!initialized) pendingSettings[key] = settings[key];
    }
    attempted = false;
    tabsAttempts = 0;
    schedule();
  });
  // Relinquish automatic zoom before Docs handles a real zoom interaction.
  // Synthetic Enter events from setViewZoom must retain extension ownership.
  for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, event => {
    if (!event.isTrusted || !document.querySelector('#zoomSelect')?.contains(event.target)) return;
    autoFitZoom = null;
    manualZoom = true;
  }, true);
  document.addEventListener('focusout', event => {
    if (event.target === document.querySelector('#zoomSelect input')) schedule();
  });
  window.addEventListener('resize', schedule);
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'style', 'aria-label', 'data-tooltip']
  });
})();
