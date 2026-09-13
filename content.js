// Pulse SMS OTP Copy - Content Script
// Adds one circular copy button to the trailing edge of each conversation row
// whose preview contains a one-time code. Nothing is ever copied automatically.

(function () {
  'use strict';

  const BTN_CLASS = 'pulse-otp-copy-btn';
  const BTN_FLEX_CLASS = 'pulse-otp-copy-btn--flex';
  const BTN_ABS_CLASS = 'pulse-otp-copy-btn--abs';
  const ROW_ABS_CLASS = 'pulse-otp-row--abs';
  const FEEDBACK_MS = 1600;

  // A conversation row is roughly avatar-height and full-width. These bounds
  // exclude both the scrolling list container (far taller) and the single-line
  // text nodes inside a row (far shorter).
  const MIN_ROW_HEIGHT = 44;
  const MAX_ROW_HEIGHT = 170;
  const MIN_ROW_WIDTH = 220;

  const ROW_SELECTORS = [
    '[class*="conversation"]',
    '[class*="Conversation"]',
    '[class*="thread"]',
    '[class*="list-item"]',
    '[class*="listItem"]',
    '[role="listitem"]',
    'li',
    'a[href*="thread"]',
    'div[role="button"]'
  ];

  const ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="9" y="9" width="13" height="13" rx="2"></rect>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

  const ICON_DONE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="20 6 9 17 4 12"></polyline></svg>';

  const detectOTP = (globalThis.PulseOtp && globalThis.PulseOtp.detectOTP) || function () {
    return null;
  };

  let injecting = false;
  let scheduled = null;

  // ---------------------------------------------------------------- row lookup

  function isRowLike(el) {
    if (!el.isConnected) return false;

    const rect = el.getBoundingClientRect();
    if (rect.width < MIN_ROW_WIDTH) return false;
    if (rect.height < MIN_ROW_HEIGHT || rect.height > MAX_ROW_HEIGHT) return false;

    const text = (el.textContent || '').trim();
    return text.length >= 8;
  }

  // Keeps only the outermost element of any nested group. Without this, an
  // outer list item and an inner content wrapper both qualify as rows and each
  // receives its own button.
  function outermostOnly(elements) {
    return elements.filter(function (el) {
      return !elements.some(function (other) {
        return other !== el && other.contains(el);
      });
    });
  }

  function findRows() {
    const seen = new Set();
    for (const selector of ROW_SELECTORS) {
      let matches;
      try {
        matches = document.querySelectorAll(selector);
      } catch (err) {
        continue;
      }
      for (const el of matches) {
        if (isRowLike(el)) seen.add(el);
      }
    }
    return outermostOnly(Array.from(seen));
  }

  // The preview is the longest leaf text in the row; the contact name and the
  // timestamp are both much shorter.
  function getPreviewText(row) {
    let best = '';
    const nodes = row.querySelectorAll('div, span, p, small, td');

    for (const node of nodes) {
      if (node.classList.contains(BTN_CLASS)) continue;
      if (node.querySelector('div, span, p, small, td')) continue;

      const text = (node.textContent || '').trim();
      if (text.length > best.length) best = text;
    }

    return best;
  }

  // ---------------------------------------------------------------- clipboard

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Clipboard API needs a focused document; fall back to a temporary node.
      try {
        const scratch = document.createElement('textarea');
        scratch.value = text;
        scratch.setAttribute('readonly', '');
        scratch.style.position = 'fixed';
        scratch.style.top = '-1000px';
        scratch.style.opacity = '0';
        document.body.appendChild(scratch);
        scratch.select();
        const ok = document.execCommand('copy');
        scratch.remove();
        return ok;
      } catch (fallbackErr) {
        return false;
      }
    }
  }

  // ---------------------------------------------------------------- injection

  function createButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = BTN_CLASS;
    button.innerHTML = ICON_COPY;

    button.addEventListener('click', async function (event) {
      // Rows are clickable and open the conversation.
      event.preventDefault();
      event.stopPropagation();

      const code = button.dataset.otp;
      if (!code) return;

      const copied = await copyToClipboard(code);
      button.classList.add(copied ? 'is-copied' : 'is-failed');
      button.innerHTML = copied ? ICON_DONE : ICON_COPY;

      clearTimeout(button.dataset.resetTimer);
      button.dataset.resetTimer = setTimeout(function () {
        button.classList.remove('is-copied', 'is-failed');
        button.innerHTML = ICON_COPY;
      }, FEEDBACK_MS);
    });

    // Stop row navigation on the press that precedes the click.
    button.addEventListener('mousedown', function (event) {
      event.stopPropagation();
    });

    return button;
  }

  // Placing the button as a flex child reserves its own space, so it can never
  // overlap the preview. That only works on a horizontal flex row: appending to
  // a column flex container would stack the button beneath the text instead.
  function usesHorizontalFlex(row) {
    const style = getComputedStyle(row);
    if (!/flex|inline-flex/.test(style.display)) return false;
    return !style.flexDirection.startsWith('column');
  }

  function attachButton(row, button) {
    if (usesHorizontalFlex(row)) {
      button.classList.add(BTN_FLEX_CLASS);
      row.appendChild(button);
      return;
    }

    button.classList.add(BTN_ABS_CLASS);
    row.classList.add(ROW_ABS_CLASS);
    if (getComputedStyle(row).position === 'static') {
      row.style.position = 'relative';
    }
    row.appendChild(button);
  }

  function syncRow(row, code) {
    const existing = row.querySelectorAll('.' + BTN_CLASS);

    if (!code) {
      existing.forEach(function (btn) {
        btn.remove();
      });
      row.classList.remove(ROW_ABS_CLASS);
      return;
    }

    // Collapse any duplicates a re-render may have left behind.
    for (let i = 1; i < existing.length; i++) {
      existing[i].remove();
    }

    if (existing.length > 0) {
      const button = existing[0];
      button.dataset.otp = code;
      button.title = 'Copy code ' + code;
      button.setAttribute('aria-label', 'Copy code ' + code);
      return;
    }

    const button = createButton();
    button.dataset.otp = code;
    button.title = 'Copy code ' + code;
    button.setAttribute('aria-label', 'Copy code ' + code);
    attachButton(row, button);
  }

  function process() {
    injecting = true;
    try {
      const rows = findRows();
      for (const row of rows) {
        syncRow(row, detectOTP(getPreviewText(row)));
      }

      // Drop buttons stranded on nodes that are no longer recognised as rows.
      const rowSet = new Set(rows);
      document.querySelectorAll('.' + BTN_CLASS).forEach(function (btn) {
        if (!rowSet.has(btn.parentElement)) btn.remove();
      });
    } finally {
      injecting = false;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = setTimeout(function () {
      scheduled = null;
      process();
    }, 150);
  }

  // ---------------------------------------------------------------- lifecycle

  function isOwnMutation(mutation) {
    const touched = [].concat(
      Array.from(mutation.addedNodes),
      Array.from(mutation.removedNodes)
    );
    if (touched.length === 0) return false;

    return touched.every(function (node) {
      return (
        node.nodeType === Node.ELEMENT_NODE &&
        node.classList &&
        node.classList.contains(BTN_CLASS)
      );
    });
  }

  function start() {
    process();

    const observer = new MutationObserver(function (mutations) {
      if (injecting) return;
      if (mutations.every(isOwnMutation)) return;
      schedule();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Virtualised lists recycle rows while scrolling.
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
