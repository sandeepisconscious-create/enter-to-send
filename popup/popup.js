document.addEventListener('DOMContentLoaded', async () => {
  const globalToggle = document.getElementById('globalToggle');
  const siteToggle = document.getElementById('siteToggle');
  const currentDomainEl = document.getElementById('currentDomain');
  const statusIndicator = document.getElementById('statusIndicator');
  const footer = document.getElementById('footer');
  const modKey = document.getElementById('modKey');

  // Detect OS modifier key label
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  if (modKey) {
    modKey.textContent = isMac ? 'Cmd' : 'Ctrl';
  }

  let activeHostname = '';

  // Get active tab domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      if (url.protocol.startsWith('http')) {
        activeHostname = url.hostname;
        currentDomainEl.textContent = activeHostname;
      } else {
        currentDomainEl.textContent = 'System page';
        siteToggle.disabled = true;
      }
    }
  } catch (_) {
    currentDomainEl.textContent = 'Active tab';
  }

  // Load state from storage
  chrome.storage.sync.get({ enabled: true, disabledDomains: [] }, (items) => {
    const isGlobal = items.enabled;
    const disabledList = items.disabledDomains || [];
    const isSiteEnabled = activeHostname ? !disabledList.includes(activeHostname) : true;

    globalToggle.checked = isGlobal;
    siteToggle.checked = isSiteEnabled;
    updateStatusFooter(isGlobal, isSiteEnabled);
  });

  function updateStatusFooter(isGlobal, isSiteEnabled) {
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

  // Handle global toggle
  globalToggle.addEventListener('change', () => {
    const isEnabled = globalToggle.checked;
    chrome.storage.sync.set({ enabled: isEnabled });
    updateStatusFooter(isEnabled, siteToggle.checked);
  });

  // Handle per-site toggle
  siteToggle.addEventListener('change', () => {
    if (!activeHostname) return;
    const isEnabled = siteToggle.checked;

    chrome.storage.sync.get({ disabledDomains: [] }, (items) => {
      let disabledList = items.disabledDomains || [];
      if (!isEnabled) {
        if (!disabledList.includes(activeHostname)) {
          disabledList.push(activeHostname);
        }
      } else {
        disabledList = disabledList.filter((d) => d !== activeHostname);
      }
      chrome.storage.sync.set({ disabledDomains: disabledList });
      updateStatusFooter(globalToggle.checked, isEnabled);
    });
  });
});
