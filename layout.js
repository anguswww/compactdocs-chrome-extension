// Docs filters synthetic window resize events when the browser size is unchanged.
// Run in MAIN so layout changes can reach its existing resize entry point. No
// document content, application objects or extension settings cross this bridge.
(() => {
  let pending = false;
  let retries = 0;
  function resize() {
    pending = false;
    if (!document.querySelector('#docs-editor')) return;
    try {
      if (typeof window.KX_resize === 'function') {
        window.KX_resize();
        retries = 0;
        return;
      }
    } catch {
      // The entry point can exist before the editor has finished loading.
    }
    if (retries++ < 10) {
      pending = true;
      setTimeout(resize, 250);
    }
  }
  document.addEventListener('compactdocs-layout-changed', () => {
    if (pending) return;
    retries = 0;
    pending = true;
    requestAnimationFrame(resize);
  });
})();
