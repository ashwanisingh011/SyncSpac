import { resolvePostAuthRedirect } from '@/lib/postAuth';

export const PENDING_INVITE_TOKEN_KEY = 'pendingInviteToken';
export const PENDING_INVITE_EMAIL_KEY = 'pendingInviteEmail';
export const POST_AUTH_REDIRECT_KEY = 'postAuthRedirect';

const storage = {
  set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

export function savePendingInviteToken(token: string): void {
  storage.set(PENDING_INVITE_TOKEN_KEY, token);
}

export function getPendingInviteToken(): string | null {
  return storage.get(PENDING_INVITE_TOKEN_KEY);
}

export function clearPendingInviteToken(): void {
  storage.remove(PENDING_INVITE_TOKEN_KEY);
}

export function savePendingInviteEmail(email: string): void {
  storage.set(PENDING_INVITE_EMAIL_KEY, email.toLowerCase().trim());
}

export function getPendingInviteEmail(): string | null {
  return storage.get(PENDING_INVITE_EMAIL_KEY);
}

export function clearPendingInviteEmail(): void {
  storage.remove(PENDING_INVITE_EMAIL_KEY);
}

export function getAcceptInvitePath(token: string): string {
  return `/accept-invite/${encodeURIComponent(token)}`;
}

export function getPendingInviteAcceptPath(): string | null {
  const pendingToken = getPendingInviteToken();
  if (!pendingToken) return null;
  return getAcceptInvitePath(pendingToken);
}

export function savePostAuthRedirect(path: string): void {
  storage.set(POST_AUTH_REDIRECT_KEY, path);
}

export function getPostAuthRedirect(): string | null {
  return storage.get(POST_AUTH_REDIRECT_KEY);
}

export function clearPostAuthRedirect(): void {
  storage.remove(POST_AUTH_REDIRECT_KEY);
}

/**
 * After login, registration, or email verification — prefer invite accept
 * when a pending token or explicit redirect is stored.
 */
export function resolveInvitePostAuthRedirect(
  explicitRedirect?: string | null,
): string {
  if (explicitRedirect?.trim().startsWith('/')) {
    return explicitRedirect.trim();
  }

  const storedRedirect = getPostAuthRedirect();
  if (storedRedirect?.startsWith('/')) {
    return storedRedirect;
  }

  const pendingToken = getPendingInviteToken();
  if (pendingToken) {
    return getAcceptInvitePath(pendingToken);
  }

  return resolvePostAuthRedirect(explicitRedirect ?? null);
}
