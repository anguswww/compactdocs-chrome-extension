const defaults = { collapseTabs: true, hideRightPanel: true };
chrome.storage.local.get(defaults, settings => {
  for (const key of Object.keys(defaults)) {
    const input = document.getElementById(key);
    input.checked = settings[key];
    input.addEventListener('change', () => chrome.storage.local.set({ [key]: input.checked }));
  }
});
