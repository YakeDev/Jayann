/** A conservative, UI-only summary of top-level workspace entries. */
export interface TopLevelEntry {
  name: string;
  isDirectory: boolean;
}

const excluded = new Set([
  'node_modules', 'vendor', 'dist', 'build', 'out', 'coverage',
  '.git', '.env', '.ssh', 'secrets', 'credentials'
]);

export function safeTopLevelEntries(entries: readonly TopLevelEntry[]): TopLevelEntry[] {
  return entries
    .filter(({ name }) => {
      const n = name.toLowerCase();
      return !name.startsWith('.')
        && !excluded.has(n)
        && !n.includes('secret')
        && !n.includes('credential')
        && !n.endsWith('.pem')
        && !n.endsWith('.key');
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 50);
}
