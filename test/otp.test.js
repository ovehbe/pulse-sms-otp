'use strict';

const assert = require('assert');
const { detectOTP } = require('../otp.js');

// Previews transcribed from the Pulse SMS conversation list screenshots.
const cases = [
  {
    name: 'MIGROS - code before the keyword',
    text: '041495 dogrulama kodu ile islem yapabilirsiniz. Migros Sanal Market Mersis',
    expected: '041495'
  },
  {
    name: 'TRENDYOL GO - code after the keyword',
    text: 'Trendyol Go 2 adımlı doğrulama ile giriş yapmak için onay kodunuz 007282',
    expected: '007282'
  },
  {
    name: 'Amazon - Turkish diacritics in the keyword',
    text: 'Amazon tek seferlik şifreniz: 881793 Bunu hiç kimse ile paylaşmay',
    expected: '881793'
  },
  {
    name: 'AKBANK - transaction alert, card suffix is not a code',
    text: 'Degerli Akbankli, 1881 ile biten banka kartinizla 14/09/2026 saat 01:53 5,00',
    expected: null
  },
  {
    name: 'KOLAYGELSIN - no digits at all',
    text: '-   -',
    expected: null
  },
  {
    name: 'VARIO - 11 digit national ID is out of range',
    text: 'Yeni bir iade talebi gelmiştir; Müşteri: Kubilay özbektaş TCKN: 4051093660',
    expected: null
  },
  {
    name: 'VARIODETECT - campaign text with no code',
    text: 'Meta status update Campaign "Kutu Açılım / Reels ? Soğuk / Potansiyel" is n',
    expected: null
  },
  {
    name: 'English verification code',
    text: 'Your verification code is 483920. Do not share it with anyone.',
    expected: '483920'
  },
  {
    name: 'English OTP keyword',
    text: 'OTP: 5821 expires in 5 minutes',
    expected: '5821'
  },
  {
    name: 'eight digit code',
    text: 'Guvenlik kodunuz 12345678 olarak belirlendi',
    expected: '12345678'
  },
  {
    name: 'prefers the code nearest the keyword',
    text: 'Siparisiniz 998877 numarali magazadan gonderildi, onay kodunuz 445566',
    expected: '445566'
  },
  {
    name: 'ignores a date even when a keyword is present',
    text: 'Sifreniz 654321 tarih 14/09/2026 itibariyle gecerlidir',
    expected: '654321'
  },
  {
    name: 'plain number with no keyword is not a code',
    text: 'Kargonuz 123456 takip numarasi ile yola cikti',
    expected: null
  },
  {
    name: 'empty input',
    text: '',
    expected: null
  },
  {
    name: 'null input',
    text: null,
    expected: null
  }
];

let failures = 0;

for (const testCase of cases) {
  const actual = detectOTP(testCase.text);
  try {
    assert.strictEqual(actual, testCase.expected);
    console.log(`  ok    ${testCase.name} -> ${JSON.stringify(actual)}`);
  } catch (err) {
    failures++;
    console.error(
      `  FAIL  ${testCase.name}\n        expected ${JSON.stringify(
        testCase.expected
      )}, got ${JSON.stringify(actual)}`
    );
  }
}

console.log(`\n${cases.length - failures}/${cases.length} passed`);
process.exit(failures === 0 ? 0 : 1);
