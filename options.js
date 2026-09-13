// Pulse SMS OTP Helper - Options Page

const autocopyToggle = document.getElementById('autocopy-toggle');
const statusMessage = document.getElementById('status-message');

// Load saved settings
chrome.storage.sync.get(['autocopy'], (result) => {
  autocopyToggle.checked = result.autocopy !== false; // default true
});

// Save settings
autocopyToggle.addEventListener('change', () => {
  const enabled = autocopyToggle.checked;
  
  chrome.storage.sync.set({ autocopy: enabled }, () => {
    showStatus(`Auto-copy ${enabled ? 'enabled' : 'disabled'}`, 'success');
  });
});

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} show`;
  
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}
