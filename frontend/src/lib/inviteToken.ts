/**
 * Extract the raw invite token from a pasted URL or token string.
 * Handles localhost/production URLs, trailing slashes, and encoded tokens.
 */
export function extractInviteToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const acceptIdx = url.pathname.indexOf('/accept-invite/');
    if (acceptIdx !== -1) {
      const segment = url.pathname.slice(acceptIdx + '/accept-invite/'.length);
      const token = segment.split('/')[0]?.split('?')[0] ?? '';
      return decodeURIComponent(token).trim();
    }
    const parts = url.pathname.split('/').filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] ?? '').trim();
  } catch {
    // Not a URL — treat as bare token (strip accidental quotes)
    return decodeURIComponent(trimmed.replace(/^["']|["']$/g, '')).trim();
  }
}
