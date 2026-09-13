# Pulse SMS OTP Copy

Chrome extension that adds per-conversation OTP copy buttons to Pulse SMS web interface.

## Features

- **Per-row copy buttons**: Each conversation with an OTP code gets its own circular copy button at the right side
- **Smart OTP detection**: Detects 4-8 digit codes in Turkish and English SMS previews
- **No auto-copy**: Only copies when you click a button (never automatically)
- **Visual feedback**: Button shows checkmark briefly after copying

## Supported OTP Formats

The extension detects OTP codes from SMS messages in both Turkish and English, including:

- Turkish: "dogrulama kodu", "onay kodunuz", "şifreniz"
- English: "verification code", "OTP", "passcode"

### Examples from Screenshot

- **MIGROS**: "041495 dogrulama kodu ile islem yapabilirsiniz..." → `041495`
- **TRENDYOL GO**: "...onay kodunuz 007282..." → `007282`  
- **Amazon**: "Amazon tek seferlik şifreniz: 881793..." → `881793`

## Installation

Since this extension is not published to the Chrome Web Store, you'll need to load it manually:

1. **Download/Clone** this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the extension folder (the folder containing `manifest.json`)
6. Navigate to any Pulse SMS domain (pulsesms.app, home.pulsesms.app)

## Supported Domains

- `pulsesms.app`
- `home.pulsesms.app`
- `*.pulsesms.app`

## Permissions

- **clipboardWrite**: Required to copy OTP codes to clipboard when you click a button
- **host_permissions**: Access to Pulse SMS domains to inject buttons and detect OTPs

## Usage

1. Open Pulse SMS in Chrome
2. Navigate to your conversations list
3. Conversations containing OTP codes will show a circular copy button on the right side
4. Click the button to copy the OTP code
5. The button will briefly show a checkmark to confirm the copy

## Technical Details

- **Manifest Version**: 3
- **Content Script**: Runs on Pulse SMS domains to detect OTPs and inject buttons
- **No Background Scripts**: Minimal resource usage
- **No External Dependencies**: Pure JavaScript, no frameworks

## Development

The extension consists of:
- `manifest.json` - Extension configuration
- `content.js` - Main logic for OTP detection and button injection
- `styles.css` - Button styling to match Pulse SMS dark theme
- `icons/` - Extension icons

## Privacy

- No data is sent to external servers
- No data is stored or persisted
- Only copies to clipboard when you explicitly click a button
- No automatic clipboard access

## License

MIT
