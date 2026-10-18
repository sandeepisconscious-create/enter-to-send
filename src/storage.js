/**
 * Shared storage management for Enter to Send
 * Provides type-safe wrappers around chrome.storage.sync
 */

const STORAGE_KEYS = {
  ENABLED: 'enabled',
  DISABLED_DOMAINS: 'disabledDomains'
};

const DEFAULT_SETTINGS = {
  enabled: true,
  disabledDomains: []
};

/**
 * Load settings from chrome storage
 * @returns {Promise<{ enabled: boolean, disabledDomains: string[] }>}
 */
function getSettings() {
  return new Promise((resolve) => {
    if (!chrome?.storage?.sync) {
      resolve({ ...DEFAULT_SETTINGS });
      return;
    }
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      resolve({
        enabled: typeof items.enabled === 'boolean' ? items.enabled : true,
        disabledDomains: Array.isArray(items.disabledDomains) ? items.disabledDomains : []
      });
    });
  });
}

/**
 * Set the global enabled state
 * @param {boolean} enabled
 * @returns {Promise<void>}
 */
function setGlobalEnabled(enabled) {
  return new Promise((resolve) => {
    if (!chrome?.storage?.sync) {
      resolve();
      return;
    }
    chrome.storage.sync.set({ [STORAGE_KEYS.ENABLED]: Boolean(enabled) }, resolve);
  });
}

/**
 * Toggle domain enabled/disabled status
 * @param {string} domain
 * @param {boolean} isEnabled
 * @returns {Promise<string[]>} Updated disabled domains list
 */
function setDomainStatus(domain, isEnabled) {
  return new Promise((resolve) => {
    if (!chrome?.storage?.sync || !domain) {
      resolve([]);
      return;
    }
    getSettings().then((settings) => {
      let domains = settings.disabledDomains;
      if (!isEnabled) {
        if (!domains.includes(domain)) {
          domains.push(domain);
        }
      } else {
        domains = domains.filter((d) => d !== domain);
      }
      chrome.storage.sync.set({ [STORAGE_KEYS.DISABLED_DOMAINS]: domains }, () => {
        resolve(domains);
      });
    });
  });
}

// Make available in content scripts and extension pages
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STORAGE_KEYS, DEFAULT_SETTINGS, getSettings, setGlobalEnabled, setDomainStatus };
}
