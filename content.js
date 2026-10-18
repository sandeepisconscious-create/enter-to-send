/**
 * Enter to Send - Universal Chrome Extension
 * Allows pressing Enter to send messages and submit forms instead of Cmd/Ctrl + Enter.
 * Shift + Enter remains dedicated to creating a new line.
 */

(() => {
  'use strict';

  let isGloballyEnabled = true;
  let disabledDomains = [];
  const currentHostname = window.location.hostname;
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  /**
   * Check if extension should be active on current site
   */
  function isSiteActive() {
    if (!isGloballyEnabled) return false;
    return !disabledDomains.includes(currentHostname);
  }

  // Synchronize preferences from chrome storage
  if (chrome?.storage?.sync) {
    chrome.storage.sync.get({ enabled: true, disabledDomains: [] }, (items) => {
      isGloballyEnabled = items.enabled;
      disabledDomains = items.disabledDomains || [];
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') {
        if (changes.enabled !== undefined) {
          isGloballyEnabled = changes.enabled.newValue;
        }
        if (changes.disabledDomains !== undefined) {
          disabledDomains = changes.disabledDomains.newValue || [];
        }
      }
    });
  }

  /**
   * Determine if target element is a multiline text editor where Enter typically inserts a newline
   */
  function isMultilineEditor(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    
    // Standard multiline inputs
    if (tag === 'textarea') return true;

    // Contenteditable elements (rich text editors, chat boxes, AI inputs)
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      return true;
    }

    // Common web editors (Monaco, CodeMirror, ProseMirror, Slate)
    return Boolean(el.closest('[contenteditable="true"], .monaco-editor, .cm-editor, .ProseMirror, .slate-editor'));
  }

  /**
   * Extract trimmed text content from the target element
   */
  function getElementText(el) {
    if (!el) return '';
    if (typeof el.value === 'string') return el.value.trim();
    return (el.innerText || el.textContent || '').trim();
  }

  /**
   * Locate the best send/run/submit button for the current context
   */
  function findSubmitButton(target) {
    // 1. Check inside closest form or container
    const container = target.closest('form, [role="region"], [role="main"], div') || document.body;
    
    // Check buttons with clear submit / send intents
    const submitBtn = container.querySelector(
      'button[type="submit"], input[type="submit"], [data-testid*="send" i], [data-testid*="run" i], button[aria-label*="Send" i], button[aria-label*="Run" i]'
    );
    if (submitBtn && submitBtn.offsetParent !== null && !submitBtn.disabled) {
      return submitBtn;
    }

    // 2. Global search for visible send/run action buttons
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    for (const btn of buttons) {
      if (btn.offsetParent === null || btn.disabled) continue;
      const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
      const aria = (btn.getAttribute('aria-label') || '').trim().toLowerCase();

      if (
        text === 'run' || aria === 'run' ||
        text === 'send' || aria === 'send' ||
        text === 'submit' || aria === 'submit'
      ) {
        return btn;
      }
    }

    // 3. Buttons with typical send icons (arrow, plane, play)
    for (const btn of buttons) {
      if (btn.offsetParent === null || btn.disabled) continue;
      const innerHTML = btn.innerHTML || '';
      if (
        innerHTML.includes('play_arrow') ||
        innerHTML.includes('send') ||
        innerHTML.includes('paper-plane') ||
        innerHTML.includes('arrow_upward')
      ) {
        return btn;
      }
    }

    return null;
  }

  /**
   * Execute submission via synthetic shortcut dispatch, form submission, or button click
   */
  function triggerSubmission(target) {
    // 1. Try finding and clicking the corresponding button
    const button = findSubmitButton(target);
    if (button) {
      button.click();
      return true;
    }

    // 2. Try form.requestSubmit() if within a form
    const form = target.closest('form');
    if (form && typeof form.requestSubmit === 'function') {
      try {
        form.requestSubmit();
        return true;
      } catch (_) {
        // Fall through if constraint validation fails or custom handlers block it
      }
    }

    // 3. Dispatch synthetic Cmd/Ctrl + Enter shortcut directly to target
    const eventParams = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      metaKey: isMac,
      ctrlKey: !isMac,
      bubbles: true,
      cancelable: true,
      composed: true
    };

    const downEvent = new KeyboardEvent('keydown', eventParams);
    const upEvent = new KeyboardEvent('keyup', eventParams);

    const handled = target.dispatchEvent(downEvent);
    target.dispatchEvent(upEvent);

    return handled;
  }

  /**
   * Keydown event handler running in the capture phase
   */
  function handleKeyDown(event) {
    if (!isSiteActive()) return;

    // Only process plain Enter key
    if (event.key !== 'Enter') return;

    // Preserve Shift + Enter for multiline text entry
    if (event.shiftKey) return;

    // Preserve existing Cmd/Ctrl/Alt combinations
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    // Ignore active composition (IME or pending input finalization)
    if (event.isComposing) return;

    const target = event.target;
    if (!isMultilineEditor(target)) return;

    // Guard: Do not trigger submission if editor is empty or only whitespace
    const text = getElementText(target);
    if (!text) return;

    // Prevent default newline insertion
    event.preventDefault();
    event.stopImmediatePropagation();

    // Trigger submission
    triggerSubmission(target);
  }

  // Register in capture phase
  window.addEventListener('keydown', handleKeyDown, true);
})();
