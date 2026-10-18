/**
 * Enter to Send - Content Script
 * High-performance capture-phase keyboard interceptor.
 * Executes in < 0.1ms on key strokes to ensure zero input lag.
 */

(() => {
  'use strict';

  // In-memory cache for ultra-fast synchronous lookup on every keypress
  let isExtensionActive = true;
  let isGloballyEnabled = true;
  let disabledDomainsSet = new Set();
  const currentHostname = window.location.hostname;

  /**
   * Recompute cached boolean flag whenever settings change
   */
  function updateActiveState() {
    isExtensionActive = isGloballyEnabled && !disabledDomainsSet.has(currentHostname);
  }

  // Fast asynchronous sync on startup
  if (typeof getSettings === 'function') {
    getSettings().then((settings) => {
      isGloballyEnabled = settings.enabled;
      disabledDomainsSet = new Set(settings.disabledDomains);
      updateActiveState();
    });
  }

  // Update in-memory cache in real-time when popup changes settings
  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        if (changes.enabled !== undefined) {
          isGloballyEnabled = changes.enabled.newValue;
        }
        if (changes.disabledDomains !== undefined) {
          disabledDomainsSet = new Set(changes.disabledDomains.newValue || []);
        }
        updateActiveState();
      }
    });
  }

  /**
   * Keydown event listener registered during the capture phase.
   * High-frequency code path: optimized with fast early returns.
   * @param {KeyboardEvent} event
   */
  function handleKeyDown(event) {
    // Fast check 1: Extension disabled on this domain (0 CPU overhead)
    if (!isExtensionActive) return;

    // Fast check 2: Not Enter key (immediate exit for 99.9% of user typing)
    if (event.keyCode !== 13 && event.key !== 'Enter') return;

    // Fast check 3: Modifier keys held (Shift, Cmd, Ctrl, Alt)
    if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;

    // Fast check 4: IME / dictation composition in progress
    if (event.isComposing) return;

    // Fast check 5: Multiline editor target
    const target = event.target;
    if (!DOMUtils.isMultilineEditor(target)) return;

    // Fast check 6: Non-empty content guard
    const text = DOMUtils.getElementText(target);
    if (!text) return;

    // Intercept and prevent newline insertion
    event.preventDefault();
    event.stopImmediatePropagation();

    // Trigger submission
    DOMUtils.submitEditor(target);
  }

  // Bind to window in capture phase (passive: false is required to allow preventDefault)
  window.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
})();
