(() => {
  const defaults = { collapseTabs: true, hideRightPanel: true };
  let settings = defaults;
  let attempted = false;
  let scheduled = false;
  function apply() {
    document.documentElement.classList.toggle('compactdocs-hide-right', settings.hideRightPanel);
    if (!settings.collapseTabs || attempted) return;
    // Use Docs' own collapse control so its editor recalculates the available width.
    const controls = document.querySelectorAll('[aria-label], [data-tooltip]');
    for (const control of controls) {
      const label = `${control.getAttribute('aria-label') || ''} ${control.getAttribute('data-tooltip') || ''}`;
      if (/^(?:hide|collapse)\s+(?:the\s+)?tabs\s*(?:&|and)\s*outline/i.test(label.trim()) && control.getClientRects().length) {
        attempted = true;
        control.click();
        break;
      }
    }
  }
  chrome.storage.local.get(defaults, value => { settings = value; apply(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of Object.keys(defaults)) if (changes[key]) settings[key] = changes[key].newValue ?? defaults[key];
    attempted = false;
    apply();
  });
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; apply(); });
  }).observe(document.body, { childList: true, subtree: true });
})();
