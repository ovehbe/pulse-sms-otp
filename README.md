# 🔑 Pulse SMS OTP Helper

A Chrome extension that automatically detects and copies OTP/SMS verification codes from your Pulse SMS conversation list — no need to open individual conversations!

## ✨ Features

- **🎯 Smart OTP Detection** — Automatically detects 4-8 digit OTP codes from message previews on the conversation list page
- **📋 Auto-Copy (Optional)** — Instantly copies detected OTP codes to your clipboard (can be toggled on/off)
- **🎨 Clean UI Button** — Prominent, easy-to-find button injected into the Pulse SMS interface showing the detected code
- **⚡ Real-time Monitoring** — Uses MutationObserver to detect new messages as they arrive
- **🔒 Privacy-First** — Runs entirely client-side with minimal permissions, no data leaves your browser

## 🚀 Installation

### Load as Unpacked Extension (Development/Testing)

1. **Download or clone this repository**
   ```bash
   git clone <repo-url>
   cd pulse-sms-otp
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Or click the Extensions menu (puzzle icon) → "Manage Extensions"

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `pulse-sms-otp` folder (this directory)

5. **Verify installation**
   - You should see "Pulse SMS OTP Helper" in your extensions list
   - The extension icon (key) will appear in your toolbar

## 🎮 How to Use

### Basic Usage

1. **Open Pulse SMS**
   - Navigate to [https://pulsesms.app](https://pulsesms.app) or [https://home.pulsesms.app](https://home.pulsesms.app)
   - Log in to your account

2. **Look for the OTP button**
   - A blue "Copy OTP" button will appear in the page header/toolbar
   - When an OTP code is detected, it will display: "🔑 Copy OTP: **XXXX**"

3. **Copy codes**
   - **Automatic**: If auto-copy is enabled (default), codes are copied immediately when detected
   - **Manual**: Click the blue "Copy OTP" button to copy the displayed code anytime
   - You'll see "✓ Copied!" confirmation feedback

### Settings

Click the extension icon in your toolbar or right-click → "Options" to access settings:

- **⚡ Auto-Copy OTP Codes** (Default: **ON**)
  - When enabled, OTP codes are automatically copied to clipboard as soon as they're detected
  - When disabled, you'll need to manually click the "Copy OTP" button

## 🔍 How It Works

### Detection Logic

The extension scans message preview text in the conversation list for common OTP patterns:

- **Pure numeric codes**: `123456`, `5789`, etc.
- **With keywords**: "Your code is 123456", "OTP: 5789", "Verification code 4321"
- **Common formats**: `123-456`, `12 34 56`
- **Alphanumeric**: `A1B2C3`, `XY7890`

### Supported Patterns

- 4-8 digit codes (most common)
- Codes with keywords: `code`, `otp`, `verification`, `verify`, `pin`, `token`, `authenticate`
- Avoids false positives: filters out years (2024, 1990), obvious sequences (1234, 0000)

### Technical Details

- **Manifest V3** compliant
- **MutationObserver** monitors DOM changes for new messages
- **Periodic scanning** backup (every 5 seconds) ensures reliability
- **Minimal permissions**: `storage` (for settings), `clipboardWrite` (for copying)
- **Host permissions**: Only for Pulse SMS domains (`*.pulsesms.app`)

## 🏗️ Project Structure

```
pulse-sms-otp/
├── manifest.json       # Extension manifest (Manifest V3)
├── content.js          # Main content script (OTP detection & UI injection)
├── styles.css          # Injected button styles
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── options.html        # Settings page
├── options.js          # Settings logic
├── icons/
│   ├── icon16.png      # Toolbar icon (16x16)
│   ├── icon48.png      # Extension management (48x48)
│   └── icon128.png     # Chrome Web Store (128x128)
└── README.md           # This file
```

## 🎨 Customization

### Adjusting DOM Selectors

If the extension doesn't detect codes correctly (Pulse SMS UI changes), you can modify the selectors in `content.js`:

```javascript
const conversationSelectors = [
  '[class*="conversation"]',
  '[class*="message-item"]',
  // Add your custom selectors here
];
```

### Modifying OTP Patterns

To adjust OTP detection patterns, edit `OTP_PATTERNS` in `content.js`:

```javascript
const OTP_PATTERNS = [
  /\b(\d{4,8})\b/g,  // 4-8 digit codes
  // Add custom patterns here
];
```

## 🐛 Troubleshooting

### Extension not detecting codes

1. **Check the console**
   - Open DevTools (F12) on Pulse SMS page
   - Look for `[Pulse OTP]` log messages
   - Verify the extension is running

2. **Verify permissions**
   - Go to `chrome://extensions/`
   - Click "Details" on Pulse SMS OTP Helper
   - Ensure "Site access" is set to "On specific sites" with Pulse SMS domains

3. **DOM structure changes**
   - Pulse SMS may have updated their UI
   - Check browser console for element detection logs
   - You may need to adjust selectors in `content.js`

### Button not appearing

- The button tries multiple injection strategies (header, nav, toolbar, body)
- If injected to body, it will appear fixed at top-right
- Check console logs to see where injection succeeded

### Auto-copy not working

1. Open extension settings (click icon → "Settings")
2. Verify "Auto-Copy OTP Codes" is enabled
3. Check that the site has clipboard write permissions
4. Try manually clicking the button to test clipboard access

## 📝 Development

### Testing Changes

1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on "Pulse SMS OTP Helper"
4. Reload the Pulse SMS page to test changes

### Console Logging

The extension logs useful information to the console:

```
[Pulse OTP] Initializing extension
[Pulse OTP] Button injected into: header
[Pulse OTP] Scanning 15 conversation elements
[Pulse OTP] Found code: 123456 in element: <div>...
[Pulse OTP] New code detected: 123456
[Pulse OTP] Copied to clipboard: 123456
```

## 🔒 Privacy & Permissions

### Required Permissions

- **`storage`** — Save your auto-copy preference
- **`clipboardWrite`** — Copy OTP codes to clipboard
- **`host_permissions`** — Access Pulse SMS domains only

### Privacy Guarantee

- ✅ All processing happens locally in your browser
- ✅ No data is sent to external servers
- ✅ No tracking or analytics
- ✅ Open source — verify for yourself!

## 📄 License

MIT License - feel free to modify and distribute as needed.

## 🙏 Contributing

Found a bug or want to add a feature? Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with Pulse SMS
5. Submit a pull request

## ⚠️ Disclaimer

This extension is not affiliated with, endorsed by, or connected to Pulse SMS or Klinker Apps. It's an independent tool created to enhance the Pulse SMS web experience.

## 🔗 Links

- Pulse SMS: [https://pulsesms.app](https://pulsesms.app)
- Report issues: Open an issue in this repository
