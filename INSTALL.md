# Quick Installation Guide

## For Users

### Step 1: Get the Extension Files
Download or clone this repository to your computer.

### Step 2: Open Chrome Extensions
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)

### Step 3: Load Extension
1. Click "Load unpacked" button
2. Select the `pulse-sms-otp` folder
3. Extension will appear in your list

### Step 4: Use It!
1. Go to https://pulsesms.app
2. Log in to your account
3. Look for the blue "🔑 Copy OTP" button
4. Codes will be auto-copied (or click button to copy manually)

## Settings
Click the extension icon in your toolbar to:
- Toggle auto-copy on/off
- Open settings page
- Open Pulse SMS

## Testing Without Pulse SMS Account

If you want to test the extension without a Pulse SMS account:

1. Load the extension as described above
2. Open Chrome DevTools (F12) on any page
3. Check the console for `[Pulse OTP]` messages
4. The extension will attempt to inject the button and scan for codes

Note: Full functionality requires access to Pulse SMS web app.
