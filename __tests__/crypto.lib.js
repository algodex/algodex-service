const crypto = require('../lib/crypto');
const atob = require('atob');
const btoa = require('btoa');
describe('Crypto', () => {
  test('atob', () => {
    for (let i = 0; i < 10; i++) {
      const s = Math.random()
          .toString(36)
          .substring(2, 15) +
        Math.random()
            .toString(36)
            .substring(2, 15);
      expect(crypto.recode(s, 'atob'))
          .toEqual(atob(s));
    }
  });
  test('btoa', () => {
    for (let i = 0; i < 10; i++) {
      const s = Math.random()
          .toString(36)
          .substring(2, 15) +
        Math.random()
            .toString(36)
            .substring(2, 15);
      const a = crypto.recode(s, 'btoa');
      const b = btoa(s);
      expect(a).toEqual(b);
    }
  });
});

