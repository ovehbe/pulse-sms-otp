// Pulse SMS OTP Copy - Content Script
// Detects OTP codes in conversation previews and adds copy buttons

(function() {
  'use strict';

  // OTP detection regex
  // Supports 4-8 digit codes, preferring those near Turkish/English keywords
  function detectOTP(text) {
    if (!text) return null;

    // Common OTP keywords in Turkish and English
    const keywords = [
      'dogrulama',
      'doğrulama', 
      'onay',
      'kod',
      'kodu',
      'kodunuz',
      'şifre',
      'şifreniz',
      'sifre',
      'sifreniz',
      'code',
      'verification',
      'OTP',
      'passcode'
    ];

    // Build a regex that looks for keywords followed by digits
    const keywordPattern = keywords.join('|');
    const contextualRegex = new RegExp(
      `(?:${keywordPattern})[^\\d]{0,20}(\\d{4,8})`,
      'i'
    );

    // Try contextual match first (preferred)
    let match = text.match(contextualRegex);
    if (match) {
      return match[1];
    }

    // Fallback: look for any 4-8 digit sequence
    const genericRegex = /\b(\d{4,8})\b/;
    match = text.match(genericRegex);
    if (match) {
      return match[1];
    }

    return null;
  }

  // Copy text to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }

  // Create and inject the copy button for a conversation row
  function injectCopyButton(row, otp) {
    // Check if button already exists
    if (row.querySelector('.pulse-otp-copy-btn')) {
      return;
    }

    // Create button
    const button = document.createElement('button');
    button.className = 'pulse-otp-copy-btn';
    button.setAttribute('aria-label', `Copy OTP: ${otp}`);
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;

    // Click handler
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const success = await copyToClipboard(otp);
      
      if (success) {
        // Show success feedback
        button.classList.add('pulse-otp-copied');
        button.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;

        // Reset after 2 seconds
        setTimeout(() => {
          button.classList.remove('pulse-otp-copied');
          button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          `;
        }, 2000);
      }
    });

    // Find the right place to insert the button
    // Looking at the screenshot, rows have: checkbox | avatar | content | timestamp
    // We want to add the button at the far right
    
    // Try to find timestamp or the rightmost element
    const timestamp = row.querySelector('[class*="time"], [class*="timestamp"], .timestamp');
    if (timestamp) {
      timestamp.parentElement.insertBefore(button, timestamp.nextSibling);
    } else {
      // Fallback: append to the row
      row.appendChild(button);
    }
  }

  // Process a conversation row
  function processConversationRow(row) {
    // Extract preview text
    // The preview is typically in a div/span with classes like 'preview', 'snippet', 'message', etc.
    const previewSelectors = [
      '[class*="preview"]',
      '[class*="snippet"]', 
      '[class*="message"]',
      '[class*="text"]',
      '.subtitle',
      'p',
      'span'
    ];

    let previewText = '';
    for (const selector of previewSelectors) {
      const element = row.querySelector(selector);
      if (element && element.textContent && element.textContent.trim().length > 10) {
        previewText = element.textContent.trim();
        break;
      }
    }

    if (!previewText) {
      return;
    }

    // Detect OTP
    const otp = detectOTP(previewText);
    if (otp) {
      injectCopyButton(row, otp);
    }
  }

  // Find and process all conversation rows
  function processAllRows() {
    // Pulse SMS conversations are typically in a list/container
    // Look for common patterns in conversation list UIs
    const rowSelectors = [
      '[class*="conversation"]',
      '[class*="thread"]',
      '[class*="list-item"]',
      'li[role="button"]',
      'div[role="button"]',
      '.row'
    ];

    let rows = [];
    for (const selector of rowSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        rows = Array.from(elements);
        break;
      }
    }

    rows.forEach(row => {
      // Skip if already processed
      if (row.dataset.pulseOtpProcessed) {
        return;
      }
      row.dataset.pulseOtpProcessed = 'true';
      processConversationRow(row);
    });
  }

  // Watch for DOM changes (new conversations loading, scrolling, etc.)
  function startObserving() {
    const observer = new MutationObserver((mutations) => {
      // Debounce processing
      clearTimeout(window.pulseOtpProcessTimeout);
      window.pulseOtpProcessTimeout = setTimeout(() => {
        processAllRows();
      }, 100);
    });

    // Observe the main content area
    const targetNode = document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });

    // Initial processing
    processAllRows();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
  }

})();
