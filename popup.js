// Pulse SMS OTP Helper - Popup

const autocopyStatus = document.getElementById('autocopy-status');
const openOptionsBtn = document.getElementById('open-options');

// Load and display current settings
chrome.storage.sync.get(['autocopy'], (result) => {
  const enabled = result.autocopy !== false; // default true
  autocopyStatus.textContent = enabled ? '✓ Enabled' : '✗ Disabled';
  autocopyStatus.style.color = enabled ? '#4CAF50' : '#FF5252';
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.autocopy) {
    const enabled = changes.autocopy.newValue;
    autocopyStatus.textContent = enabled ? '✓ Enabled' : '✗ Disabled';
    autocopyStatus.style.color = enabled ? '#4CAF50' : '#FF5252';
  }
});

// Open options page
openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
