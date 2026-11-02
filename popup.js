const defaults = { collapseTabs: true, hideRightPanel: true, fitToWindow: true };
for (const key of Object.keys(defaults)) document.getElementById(key).disabled = true;
let status;
function reportError(message) {
  if (!status) {
    status = document.createElement('p');
    status.setAttribute('role', 'alert');
    document.body.appendChild(status);
  }
  status.textContent = message;
}
chrome.storage.local.get(defaults, settings => {
  if (chrome.runtime.lastError) {
    reportError('Could not load settings. Close and reopen this popup to retry.');
    return;
  }
  for (const key of Object.keys(defaults)) {
    const input = document.getElementById(key);
    input.checked = settings[key];
    input.disabled = false;
    input.addEventListener('change', () => {
      const previous = settings[key];
      const next = input.checked;
      input.disabled = true;
      chrome.storage.local.set({ [key]: next }, () => {
        input.disabled = false;
        if (chrome.runtime.lastError) {
          input.checked = previous;
          reportError('Could not save settings. Please try again.');
        } else {
          settings[key] = next;
          if (status) status.textContent = '';
        }
      });
    });
  }
});
