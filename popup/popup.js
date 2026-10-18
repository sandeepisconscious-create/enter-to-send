/**
 * Enter to Send - Popup Script
 * Manages UI interactions and syncs preferences with storage
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const globalToggle = /** @type {HTMLInputElement|null} */ (document.getElementById('globalToggle'));
  const siteToggle = /** @type {HTMLInputElement|null} */ (document.getElementById('siteToggle'));
  const currentDomainEl = document.getElementById('currentDomain');
  const statusIndicator = document.getElementById('statusIndicator');
  const footer = document.getElementById('footer');
  const modKey = document.getElementById('modKey');

  // Display OS-specific shortcut key
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
  if (modKey) {
    modKey.textContent = isMac ? 'Cmd' : 'Ctrl';
  }

  let activeHostname = '';

  // Resolve current tab domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const url = new URL(tab.url);
      if (url.protocol.startsWith('http')) {
        activeHostname = url.hostname;
        if (currentDomainEl) currentDomainEl.textContent = activeHostname;
      } else {
        if (currentDomainEl) currentDomainEl.textContent = 'System page';
        if (siteToggle) siteToggle.disabled = true;
      }
    }
  } catch (_) {
    if (currentDomainEl) currentDomainEl.textContent = 'Active tab';
  }

  // Update status footer styling & text
  function updateStatusUI(isGlobal, isSiteEnabled) {
    if (!statusIndicator || !footer) return;

    if (!isGlobal) {
      statusIndicator.textContent = 'Disabled globally';
      footer.classList.add('disabled');
    } else if (!isSiteEnabled) {
      statusIndicator.textContent = 'Disabled on this site';
      footer.classList.add('disabled');
    } else {
      statusIndicator.textContent = 'Active';
      footer.classList.remove('disabled');
    }
  }

  // Load and apply initial state
  const settings = await getSettings();
  const isSiteActive = activeHostname ? !settings.disabledDomains.includes(activeHostname) : true;

  if (globalToggle) globalToggle.checked = settings.enabled;
  if (siteToggle) siteToggle.checked = isSiteActive;
  updateStatusUI(settings.enabled, isSiteActive);

  // Global toggle handler
  globalToggle?.addEventListener('change', async () => {
    const isEnabled = globalToggle.checked;
    await setGlobalEnabled(isEnabled);
    updateStatusUI(isEnabled, siteToggle?.checked ?? true);
  });

  // Per-site toggle handler
  siteToggle?.addEventListener('change', async () => {
    if (!activeHostname) return;
    const isEnabled = siteToggle.checked;
    await setDomainStatus(activeHostname, isEnabled);
    updateStatusUI(globalToggle?.checked ?? true, isEnabled);
  });
});
