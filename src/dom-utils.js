/**
 * High-performance DOM query, submit discovery, and key dispatch utilities
 * Optimized for zero-garbage collection overhead and sub-millisecond execution.
 */

const DOMUtils = (() => {
  'use strict';

  const IS_MAC = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  // Pre-compiled cached selectors for fast DOM matching
  const RICH_EDITOR_SELECTOR = '[contenteditable="true"], .monaco-editor, .cm-editor, .ProseMirror, .slate-editor';
  const PRIMARY_SUBMIT_SELECTOR = 'button[type="submit"], input[type="submit"], [data-testid*="send" i], [data-testid*="run" i], button[aria-label*="Send" i], button[aria-label*="Run" i]';
  const SEND_ICON_SELECTOR = 'svg, .material-icons, [class*="icon" i]';

  // Pre-constructed reusable event parameters template
  const SHORTCUT_PARAMS = Object.freeze({
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    metaKey: IS_MAC,
    ctrlKey: !IS_MAC,
    bubbles: true,
    cancelable: true,
    composed: true
  });

  /**
   * Fast check if element is visible and interactive
   * Uses offsetParent check which is fast, falling back to bounding rect
   */
  function isVisibleButton(btn) {
    if (btn.disabled) return false;
    if (btn.offsetParent !== null) return true;
    const rect = btn.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Determine if target element is an active multiline editor
   * Fast-path: checks tagName and contentEditable directly before querying ancestors
   * @param {Element|null} el
   * @returns {boolean}
   */
  function isMultilineEditor(el) {
    if (!el || !(el instanceof Element)) return false;

    // 1. Fast path: Direct tagName check (no DOM traversal)
    if (el.tagName === 'TEXTAREA') return true;

    // 2. Fast path: Direct contentEditable property check
    if (el.isContentEditable) return true;

    // 3. Fallback: Check if nested within known code/rich text editor structures
    return Boolean(el.closest(RICH_EDITOR_SELECTOR));
  }

  /**
   * Extract text from target element with minimal string allocation
   * @param {Element|null} el
   * @returns {string}
   */
  function getElementText(el) {
    if (!el) return '';
    if ('value' in el && typeof el.value === 'string') {
      return el.value.trim();
    }
    return (el.innerText || el.textContent || '').trim();
  }

  /**
   * Fast targeted submit button search
   * Scopes search to the immediate ancestor container before touching the rest of document
   * @param {Element} target
   * @returns {Element|null}
   */
  function findSubmitButton(target) {
    // Stage 1: Fast contextual search in immediate container
    const container = target.closest('form, [role="region"], [role="main"]') || target.parentElement;
    if (container) {
      const match = container.querySelector(PRIMARY_SUBMIT_SELECTOR);
      if (match && isVisibleButton(match)) return match;
    }

    // Stage 2: Scope to active view / main content area
    const scope = document.querySelector('main, [role="main"]') || document.body;
    const buttons = scope.querySelectorAll('button, [role="button"]');
    const len = buttons.length;

    // Fast indexed loop (significantly faster than Array.from + filter/for..of)
    for (let i = 0; i < len; i++) {
      const btn = buttons[i];
      if (!isVisibleButton(btn)) continue;

      const aria = btn.getAttribute('aria-label');
      if (aria) {
        const lowerAria = aria.toLowerCase();
        if (lowerAria === 'run' || lowerAria === 'send' || lowerAria === 'submit' || lowerAria.startsWith('run ') || lowerAria.startsWith('send ')) {
          return btn;
        }
      }

      const text = btn.textContent;
      if (text) {
        const trimmed = text.trim();
        if (trimmed === 'Run' || trimmed === 'Send' || trimmed === 'Submit' || trimmed.toLowerCase() === 'run' || trimmed.toLowerCase() === 'send') {
          return btn;
        }
      }
    }

    // Stage 3: Scan buttons with typical icons only if text/aria search found nothing
    for (let i = 0; i < len; i++) {
      const btn = buttons[i];
      if (!isVisibleButton(btn)) continue;

      const icon = btn.querySelector(SEND_ICON_SELECTOR);
      if (icon) {
        const content = (icon.textContent || '') + (icon.className || '');
        if (content.includes('play') || content.includes('send') || content.includes('arrow')) {
          return btn;
        }
      }
    }

    return null;
  }

  /**
   * Dispatches synthetic Cmd/Ctrl + Enter shortcut directly to target
   * @param {Element} target
   * @returns {boolean}
   */
  function dispatchShortcut(target) {
    const downEvent = new KeyboardEvent('keydown', SHORTCUT_PARAMS);
    const upEvent = new KeyboardEvent('keyup', SHORTCUT_PARAMS);

    const handled = target.dispatchEvent(downEvent);
    target.dispatchEvent(upEvent);
    return handled;
  }

  /**
   * Executes multi-strategy submission in order of speed and certainty
   * @param {Element} target
   * @returns {boolean}
   */
  function submitEditor(target) {
    // 1. Direct button click
    const button = findSubmitButton(target);
    if (button) {
      button.click();
      return true;
    }

    // 2. Native form submission if supported
    const form = target.closest('form');
    if (form && typeof form.requestSubmit === 'function') {
      try {
        form.requestSubmit();
        return true;
      } catch (_) {
        // Fall through on validation error
      }
    }

    // 3. Fast synthetic shortcut dispatch
    return dispatchShortcut(target);
  }

  return {
    IS_MAC,
    isMultilineEditor,
    getElementText,
    findSubmitButton,
    dispatchShortcut,
    submitEditor
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMUtils;
}
