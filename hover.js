// Reveal native panels without changing Docs' expanded/collapsed layout state.
const compactDocsHover = (() => {
  let settings = {};
  let active = null;
  let keyboard = false;
  let initialized = false;
  let closeTimer;
  const buttons = {};
  const selectors = {
    left: '.left-sidebar-container',
    right: '.docs-companion-app-switcher-container, .docs-companion-sidebar'
  };
  function show(side, byKeyboard = false) {
    clearTimeout(closeTimer);
    active = side;
    keyboard = byKeyboard;
    for (const name of ['left', 'right']) {
      document.documentElement.classList.toggle(`compactdocs-peek-${name}`, name === side);
      buttons[name]?.setAttribute('aria-expanded', String(name === side));
    }
  }
  function close() {
    clearTimeout(closeTimer);
    active = null;
    for (const side of ['left', 'right']) {
      document.documentElement.classList.remove(`compactdocs-peek-${side}`);
      buttons[side]?.setAttribute('aria-expanded', 'false');
    }
  }
  function inside(node, side) {
    return !!side && node instanceof Element && (node.closest(selectors[side]) || buttons[side]?.contains(node));
  }
  function deferClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!keyboard || !inside(document.activeElement, active)) close();
    }, 220);
  }
  document.addEventListener('pointerover', event => {
    if (!active) return;
    if (inside(event.target, active) || event.target.closest?.('.goog-menu, [role="dialog"]')) {
      clearTimeout(closeTimer);
    } else deferClose();
  });
  document.addEventListener('focusin', event => {
    if (active && !inside(event.target, active)) deferClose();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
      const button = buttons[active];
      close();
      // Do not let returning keyboard focus immediately reopen the overlay.
      button?.focus({ preventScroll: true });
      close();
    }
  });
  return {
    isOpen: () => active !== null,
    update(value, activate) {
      settings = value;
      const editor = document.querySelector('#kix-appview');
      if (!editor) return;
      if (!initialized && activate && document.querySelector('.kix-canvas-tile-content')) {
        initialized = true;
        // Let Docs finish mounting its resize handlers, then settle the canvas
        // against the compact viewport before the first panel is opened.
        setTimeout(() => {
          if (active) { initialized = false; return; }
          const show = document.querySelector('.companion-collapser-button[aria-label="Show side panel"]');
          if (settings.hideRightPanel && show) {
            activate(show);
            const hide = document.querySelector('.companion-collapser-button[aria-label="Hide side panel"]');
            if (hide) activate(hide);
          }
        }, 250);
      }
      const top = `${Math.max(0, editor.getBoundingClientRect().top)}px`;
      const root = document.documentElement;
      if (root.style.getPropertyValue('--compactdocs-overlay-top') !== top) root.style.setProperty('--compactdocs-overlay-top', top);
      for (const side of ['left', 'right']) {
        if (!buttons[side]?.isConnected) {
          const button = document.createElement('button');
          button.id = `compactdocs-edge-${side}`;
          button.className = 'compactdocs-edge';
          button.type = 'button';
          button.textContent = side === 'left' ? '☰' : '‹';
          button.setAttribute('aria-label', side === 'left' ? 'Show document tabs on hover' : 'Show Google side panel on hover');
          button.setAttribute('aria-expanded', 'false');
          button.title = side === 'left' ? 'Document tabs' : 'Google side panel';
          button.addEventListener('pointerenter', () => show(side));
          button.addEventListener('focus', () => show(side, button.matches(':focus-visible')));
          button.addEventListener('click', () => { button.blur(); show(side); });
          button.addEventListener('pointerleave', deferClose);
          document.body.appendChild(button);
          buttons[side] = button;
        }
        const enabled = side === 'left'
          ? settings.collapseTabs && !!document.querySelector('.navigation-widget')
          : settings.hideRightPanel && !!document.querySelector('.docs-companion-app-switcher-container');
        buttons[side].hidden = !enabled;
        if (!enabled && active === side) close();
      }
    }
  };
})();
