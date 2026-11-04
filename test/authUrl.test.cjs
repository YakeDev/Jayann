const test = require('node:test');
const assert = require('node:assert/strict');
const { isTrustedAuthUrl } = require('../out/authUrl.js');

test('only OpenAI-owned HTTPS login hosts are accepted', () => {
  assert.equal(isTrustedAuthUrl('https://auth.openai.com/authorize?x=1'), true);
  assert.equal(isTrustedAuthUrl('https://chatgpt.com/login'), true);
  assert.equal(isTrustedAuthUrl('https://evil-openai.com/steal'), false);
  assert.equal(isTrustedAuthUrl('https://openai.com.evil.example/'), false);
  assert.equal(isTrustedAuthUrl('javascript:alert(1)'), false);
  assert.equal(isTrustedAuthUrl('http://auth.openai.com'), false);
  assert.equal(isTrustedAuthUrl('https://user:pass@auth.openai.com/login'), false);
  assert.equal(isTrustedAuthUrl('not a url'), false);
});
