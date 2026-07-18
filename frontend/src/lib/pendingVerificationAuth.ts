const STORAGE_KEY = 'pendingVerificationAuth';

interface PendingVerificationAuth {
  token: string;
  user: Record<string, unknown>;
}

/**
 * Saves the token + user payload returned by /auth/register so the
 * verify-email page can auto-login the user when they click the link
 * in the same browser session (sessionStorage is tab-group scoped).
 */
export function savePendingVerificationAuth(
  token: string,
  user: Record<string, unknown>,
): void {
  if (!token || !user) return;
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

export function getPendingVerificationAuth(): PendingVerificationAuth | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingVerificationAuth;
    if (parsed?.token && parsed?.user) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearPendingVerificationAuth(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
