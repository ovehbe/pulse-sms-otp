// Pulse SMS OTP Helper - Content Script

// OTP detection patterns
const OTP_PATTERNS = [
  // Pure numeric codes (4-8 digits)
  /\b(\d{4,8})\b/g,
  // With common keywords
  /(?:code|otp|verification|verify|pin|token|authenticate)[\s:]*(\d{4,8})\b/gi,
  // With common formatting
  /\b(\d{3}[-\s]?\d{3})\b/g,
  // Alphanumeric codes
  /\b([A-Z0-9]{4,8})\b/g
];

// State management
let detectedCode = null;
let autocopySetting = true; // default to enabled
let copiedButton = null;

// Load settings
chrome.storage.sync.get(['autocopy'], (result) => {
  autocopySetting = result.autocopy !== false; // default true
  console.log('[Pulse OTP] Autocopy setting:', autocopySetting);
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.autocopy) {
    autocopySetting = changes.autocopy.newValue;
    console.log('[Pulse OTP] Autocopy setting updated:', autocopySetting);
  }
});

/**
 * Extract OTP code from text using multiple patterns
 */
function extractOTP(text) {
  if (!text) return null;
  
  // Try each pattern
  for (const pattern of OTP_PATTERNS) {
    pattern.lastIndex = 0; // Reset regex state
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Prioritize matches with keywords
      const withKeywords = text.match(/(?:code|otp|verification|verify|pin|token)[\s:]*(\d{4,8})\b/gi);
      if (withKeywords && withKeywords.length > 0) {
        const codeMatch = withKeywords[0].match(/(\d{4,8})/);
        if (codeMatch) return codeMatch[1];
      }
      
      // Return first numeric match of reasonable length
      for (const match of matches) {
        const cleaned = match.replace(/[^A-Z0-9]/gi, '');
        if (cleaned.length >= 4 && cleaned.length <= 8) {
          // Avoid obvious false positives (like years, common numbers)
          if (!/^(19|20)\d{2}$/.test(cleaned) && !/^(1234|0000|9999)/.test(cleaned)) {
            return cleaned;
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('[Pulse OTP] Copied to clipboard:', text);
    return true;
  } catch (err) {
    console.error('[Pulse OTP] Failed to copy:', err);
    return false;
  }
}

/**
 * Show feedback on button
 */
function showCopiedFeedback() {
  if (!copiedButton) return;
  
  const originalText = copiedButton.textContent;
  copiedButton.textContent = '✓ Copied!';
  copiedButton.style.backgroundColor = '#4CAF50';
  
  setTimeout(() => {
    if (copiedButton) {
      copiedButton.textContent = originalText;
      copiedButton.style.backgroundColor = '#2196F3';
    }
  }, 2000);
}

/**
 * Create and inject the OTP copy button
 */
function createOTPButton() {
  // Remove existing button if any
  const existing = document.getElementById('pulse-otp-button');
  if (existing) existing.remove();
  
  const button = document.createElement('button');
  button.id = 'pulse-otp-button';
  button.className = 'pulse-otp-copy-btn';
  button.innerHTML = `
    <span class="pulse-otp-icon">🔑</span>
    <span class="pulse-otp-text">Copy OTP: <span id="pulse-otp-code">---</span></span>
  `;
  
  button.addEventListener('click', async () => {
    if (detectedCode) {
      const success = await copyToClipboard(detectedCode);
      if (success) {
        showCopiedFeedback();
      }
    }
  });
  
  // Try to inject into the UI - multiple strategies
  const injectionTargets = [
    // Common messaging app header selectors
    'header',
    '.header',
    '[role="banner"]',
    'nav',
    '.toolbar',
    '.app-header',
    // Fallback to body
    'body'
  ];
  
  for (const selector of injectionTargets) {
    const target = document.querySelector(selector);
    if (target) {
      // If body, position fixed at top-right
      if (selector === 'body') {
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.zIndex = '999999';
      }
      target.appendChild(button);
      console.log('[Pulse OTP] Button injected into:', selector);
      copiedButton = button;
      break;
    }
  }
  
  return button;
}

/**
 * Update button with detected code
 */
function updateOTPButton(code) {
  detectedCode = code;
  const codeElement = document.getElementById('pulse-otp-code');
  
  if (code && copiedButton) {
    if (codeElement) {
      codeElement.textContent = code;
    }
    copiedButton.disabled = false;
    copiedButton.style.opacity = '1';
    
    // Auto-copy if enabled
    if (autocopySetting) {
      copyToClipboard(code).then(success => {
        if (success) {
          showCopiedFeedback();
        }
      });
    }
  } else if (copiedButton) {
    if (codeElement) {
      codeElement.textContent = '---';
    }
    copiedButton.disabled = true;
    copiedButton.style.opacity = '0.6';
  }
}

/**
 * Scan conversation list for OTP codes
 */
function scanConversations() {
  // Target selectors for conversation items and message previews
  // These are educated guesses - may need adjustment based on actual DOM
  const conversationSelectors = [
    // Common messaging app patterns
    '[class*="conversation"]',
    '[class*="message-item"]',
    '[class*="chat-item"]',
    '[class*="thread"]',
    '[data-conversation-id]',
    '[role="listitem"]',
    'li[class*="list"]',
    '.list-item',
    // Fallback: any list structure
    'ul li',
    'div[class*="item"]'
  ];
  
  let allConversations = [];
  
  // Collect all potential conversation elements
  for (const selector of conversationSelectors) {
    const elements = document.querySelectorAll(selector);
    allConversations.push(...Array.from(elements));
  }
  
  // Remove duplicates
  allConversations = [...new Set(allConversations)];
  
  console.log(`[Pulse OTP] Scanning ${allConversations.length} conversation elements`);
  
  // Scan each conversation for OTP codes
  let latestCode = null;
  let latestTimestamp = 0;
  
  for (const element of allConversations) {
    const text = element.textContent || element.innerText || '';
    const code = extractOTP(text);
    
    if (code) {
      // Try to find timestamp or use DOM order as proxy
      const timeElements = element.querySelectorAll('[class*="time"], [class*="date"], time');
      let timestamp = 0;
      
      if (timeElements.length > 0) {
        const timeText = timeElements[0].textContent;
        // Simple heuristic: prefer recent messages
        timestamp = Date.now() - (timeText.includes('min') ? 60000 : 
                                  timeText.includes('hour') ? 3600000 : 
                                  86400000);
      } else {
        // Use position in DOM as proxy for recency
        const allItems = Array.from(element.parentElement?.children || []);
        timestamp = Date.now() - (allItems.indexOf(element) * 1000);
      }
      
      if (timestamp > latestTimestamp) {
        latestTimestamp = timestamp;
        latestCode = code;
      }
      
      console.log('[Pulse OTP] Found code:', code, 'in element:', element);
    }
  }
  
  if (latestCode && latestCode !== detectedCode) {
    console.log('[Pulse OTP] New code detected:', latestCode);
    updateOTPButton(latestCode);
  }
}

/**
 * Initialize the extension
 */
function initialize() {
  console.log('[Pulse OTP] Initializing extension');
  
  // Create button
  createOTPButton();
  
  // Initial scan
  setTimeout(() => scanConversations(), 1000);
  
  // Watch for DOM changes (new messages)
  const observer = new MutationObserver((mutations) => {
    // Debounce: only scan if there were text changes
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        shouldScan = true;
        break;
      }
    }
    
    if (shouldScan) {
      scanConversations();
    }
  });
  
  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  
  console.log('[Pulse OTP] MutationObserver started');
  
  // Periodic scan as backup (every 5 seconds)
  setInterval(() => {
    scanConversations();
  }, 5000);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
