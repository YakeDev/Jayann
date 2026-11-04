/** Only open authorization URLs pointing to OpenAI-owned HTTPS hosts. */
export function isTrustedAuthUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return host === 'openai.com' || host.endsWith('.openai.com')
      || host === 'chatgpt.com' || host.endsWith('.chatgpt.com');
  } catch {
    return false;
  }
}
