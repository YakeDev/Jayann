const test = require('node:test');
const assert = require('node:assert/strict');
const { safeTopLevelEntries } = require('../out/projectOverview.js');

test('omits common sensitive and generated paths', () => {
  const input = ['src', '.env', '.git', 'node_modules', 'private.key', 'package.json', 'credentials.json']
    .map(name => ({ name, isDirectory: name === 'src' }));
  assert.deepEqual(safeTopLevelEntries(input).map(x => x.name), ['package.json', 'src']);
});

test('limits to fifty entries and sorts alphabetically', () => {
  const entries = Array.from({ length: 60 }, (_, i) => ({ name: 'item-' + String(59 - i).padStart(2, '0'), isDirectory: false }));
  const result = safeTopLevelEntries(entries);
  assert.equal(result.length, 50);
  assert.equal(result[0].name, 'item-00');
});
