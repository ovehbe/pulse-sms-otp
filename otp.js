// Pulse SMS OTP Copy - OTP detection
// Shared by the content script and the Node test suite.

(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.PulseOtp = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ASCII-folded keywords: text is folded before matching, so Turkish
  // diacritics ("doğrulama", "şifreniz") match these entries too.
  const KEYWORDS = [
    'dogrulama',
    'onay',
    'kod',
    'sifre',
    'parola',
    'tek kullanimlik',
    'tek seferlik',
    'aktivasyon',
    'guvenlik',
    'code',
    'otp',
    'passcode',
    'password',
    'pin',
    'verification',
    'verify',
    'one-time',
    'one time',
    'auth'
  ];

  // A digit run this far (in characters) from a keyword is not treated as a code.
  const MAX_KEYWORD_DISTANCE = 40;

  // Single-code-unit replacements only, so folding preserves string indices.
  const FOLD_MAP = {
    'ğ': 'g', 'Ğ': 'g',
    'ş': 's', 'Ş': 's',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ü': 'u', 'Ü': 'u',
    'ç': 'c', 'Ç': 'c',
    'â': 'a', 'Â': 'a',
    'î': 'i', 'Î': 'i',
    'û': 'u', 'Û': 'u'
  };

  function foldLower(text) {
    let out = '';
    for (const ch of text) {
      out += FOLD_MAP[ch] || ch;
    }
    out = out.toLowerCase();
    // Keyword offsets are compared against offsets in the original string, so
    // bail out of folding entirely if a locale rule changed the length.
    return out.length === text.length ? out : text.toLowerCase();
  }

  function findKeywords(folded) {
    const hits = [];
    for (const keyword of KEYWORDS) {
      let index = folded.indexOf(keyword);
      while (index !== -1) {
        hits.push({ start: index, end: index + keyword.length });
        index = folded.indexOf(keyword, index + keyword.length);
      }
    }
    return hits;
  }

  // Maximal digit runs, so a 4-8 digit filter also rejects slices of longer
  // numbers such as an 11-digit national ID.
  function digitRuns(text) {
    const runs = [];
    const re = /\d+/g;
    let match;
    while ((match = re.exec(text)) !== null) {
      if (match[0].length >= 4 && match[0].length <= 8) {
        runs.push({
          value: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
    return runs;
  }

  // Rejects dates, times, and money amounts: "14/09/2026", "01:53", "5,000".
  function isDateOrAmount(text, run) {
    const prev = text[run.start - 1] || '';
    const prevPrev = text[run.start - 2] || '';
    const next = text[run.end] || '';
    const nextNext = text[run.end + 1] || '';

    if (/[/\-.:,]/.test(prev) && /\d/.test(prevPrev)) return true;
    if (/[/\-.:,]/.test(next) && /\d/.test(nextNext)) return true;
    if (next === '%') return true;

    return false;
  }

  function lengthBonus(length) {
    if (length === 6) return 3;
    if (length === 4) return 2;
    if (length === 8) return 1;
    return 0;
  }

  function distanceToKeyword(run, keywords) {
    let best = Infinity;
    for (const keyword of keywords) {
      let distance;
      if (run.start >= keyword.end) {
        distance = run.start - keyword.end;
      } else if (keyword.start >= run.end) {
        distance = keyword.start - run.end;
      } else {
        distance = 0;
      }
      if (distance < best) best = distance;
    }
    return best;
  }

  /**
   * Returns the OTP in `text`, or null when the text is not a code message.
   * A keyword is required, which keeps transaction alerts and delivery
   * notifications from producing buttons.
   */
  function detectOTP(text) {
    if (!text || typeof text !== 'string') return null;

    const runs = digitRuns(text).filter(function (run) {
      return !isDateOrAmount(text, run);
    });
    if (runs.length === 0) return null;

    const keywords = findKeywords(foldLower(text));
    if (keywords.length === 0) return null;

    let best = null;
    for (const run of runs) {
      const distance = distanceToKeyword(run, keywords);
      if (distance > MAX_KEYWORD_DISTANCE) continue;

      const score = distance * 10 - lengthBonus(run.value.length);
      if (best === null || score < best.score) {
        best = { run: run, score: score };
      }
    }

    return best ? best.run.value : null;
  }

  return { detectOTP: detectOTP };
});
