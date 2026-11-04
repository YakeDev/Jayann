const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const { CodexAppServer } = require('../out/codexAppServer.js');

function mockCodex() {
  const proc = new EventEmitter();
  proc.stdin = new PassThrough();
  proc.stdout = new PassThrough();
  proc.stderr = new PassThrough();
  proc.kill = () => { proc.emit('exit', 0, null); return true; };
  const methods = [];
  let pending = '';
  proc.stdin.setEncoding('utf8');
  proc.stdin.on('data', data => {
    pending += data;
    let index;
    while ((index = pending.indexOf('\n')) >= 0) {
      const line = pending.slice(0, index);
      pending = pending.slice(index + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      methods.push(msg.method);
      if (msg.method === 'initialize') {
        assert.equal(msg.params.clientInfo.name, 'jayann_vscode');
        proc.stdout.write(JSON.stringify({ id: msg.id, result: { userAgent: 'fake' } }) + '\n');
      }
      if (msg.method === 'account/read') {
        proc.stdout.write(JSON.stringify({ id: msg.id, result: { account: {
          type: 'chatgpt', email: 'test@example.invalid', planType: 'plus'
        } } }) + '\n');
      }
      if (msg.method === 'account/login/start') {
        assert.equal(msg.params.type, 'chatgpt');
        proc.stdout.write(JSON.stringify({ id: msg.id, result: {
          type: 'chatgpt', loginId: 'login-1',
          authUrl: 'https://auth.openai.com/authorize?test=1'
        } }) + '\n');
      }
      if (msg.method === 'account/logout') {
        proc.stdout.write(JSON.stringify({ id: msg.id, result: {} }) + '\n');
      }
    }
  });
  return { proc, methods };
}

test('Codex client initializes, reads account, starts browser login and logs out', async () => {
  const fake = mockCodex();
  const client = new CodexAppServer(() => fake.proc);
  try {
    const account = await client.account();
    assert.equal(account.type, 'chatgpt');
    assert.equal(account.planType, 'plus');
    const login = await client.beginChatGptLogin();
    assert.equal(login.loginId, 'login-1');
    assert.match(login.authUrl, /^https:\/\/auth\.openai\.com\//);
    await client.logout();
    assert.deepEqual(fake.methods, [
      'initialize', 'initialized', 'account/read', 'account/login/start', 'account/logout'
    ]);
  } finally {
    client.dispose();
  }
});

test('Codex client propagates a server disconnect to in-flight requests', async () => {
  const fake = mockCodex();
  const client = new CodexAppServer(() => fake.proc);
  try {
    await client.start();
    const wait = client.request('never/replies');
    fake.proc.emit('exit', 1, null);
    await assert.rejects(wait, /arrêté/i);
  } finally {
    client.dispose();
  }
});
