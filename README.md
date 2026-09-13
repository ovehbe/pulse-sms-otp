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

A code is only recognised when one of these keywords appears within 40
characters of the digits, in either direction. That keeps ordinary messages from
growing a button: a bank alert like "1881 ile biten banka kartinizla" or a
tracking number has no keyword, so no button appears. Dates, clock times, money
amounts, and digit runs outside 4-8 characters are rejected as well.

### Examples from Screenshot

- **MIGROS**: "041495 dogrulama kodu ile islem yapabilirsiniz..." → `041495`
- **TRENDYOL GO**: "...onay kodunuz 007282..." → `007282`  
- **Amazon**: "Amazon tek seferlik şifreniz: 881793..." → `881793`
- **AKBANK**: "Degerli Akbankli, 1881 ile biten banka kartinizla..." → no button

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
- `otp.js` - Code detection, shared with the test suite
- `content.js` - Row lookup and button injection
- `styles.css` - Button styling to match Pulse SMS dark theme
- `icons/` - Extension icons

### How the button is placed

Conversation rows are found by geometry rather than by class name: an element
qualifies when it is roughly avatar-height and full-width, which excludes both
the scrolling list container and the individual text nodes inside a row. Nested
matches are then reduced to the outermost element, so a row and its inner
content wrapper cannot each receive a button.

Placement depends on the row's own layout. On a horizontal flex row the button
is appended as the last flex child with `margin-left: auto`, claiming its own
40px track so the preview text shrinks rather than being covered. Otherwise the
button is positioned absolutely against the row with matching `padding-right`
reserved, which produces the same gutter without relying on flex.

### Tests

```bash
npm test        # or: node test/otp.test.js
```

`test/otp.test.js` covers the previews from the screenshots, including the ones
that must *not* produce a button. `test/fixture.html` reproduces the Pulse SMS
row markup - nested wrappers and a column-direction inner flex container - and
can be opened directly in a browser to check placement without signing in.

## Privacy

- No data is sent to external servers
- No data is stored or persisted
- Only copies to clipboard when you explicitly click a button
- No automatic clipboard access

## License

MIT
