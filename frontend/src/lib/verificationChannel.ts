/**
 * Cross-tab communication for the email verification flow.
 *
 * When the user opens the email link in a new tab (Tab B), and Tab A is
 * still showing /verify-email-sent, we use BroadcastChannel to notify Tab A
 * immediately so it can redirect and close the stale waiting page.
 *
 * Fallback: a localStorage flag is also written so that when the user
 * manually switches back to Tab A (after Tab B has already navigated away),
 * a visibilitychange listener can still pick up the completed state.
 *
 * BroadcastChannel is Baseline Widely Available (Chrome 54+, Firefox 38+,
 * Safari 15.4+) — no polyfill required.
 */

export const VERIFICATION_CHANNEL_NAME = 'taskbridge_email_verified';
export const VERIFICATION_LS_KEY = 'taskbridge_email_verified_at';

export interface VerificationCompletePayload {
  /** The route Tab A should navigate to (e.g. /onboarding, /login). */
  destination: string;
  /** The authenticated user object, if auto-login succeeded in Tab B. */
  user?: Record<string, unknown> | null;
  /** The JWT access token, if auto-login succeeded in Tab B. */
  token?: string | null;
}

/**
 * Broadcasts a "verification complete" event to all other same-origin tabs.
 * Also writes a localStorage flag as a fallback for tabs that missed the event.
 */
export function broadcastVerified(payload: VerificationCompletePayload): void {
  if (typeof window === 'undefined') return;

  // Write the localStorage fallback signal first (tab-switch detection)
  try {
    localStorage.setItem(
      VERIFICATION_LS_KEY,
      JSON.stringify({ ...payload, ts: Date.now() }),
    );
  } catch {
    // localStorage unavailable — continue with BroadcastChannel only
  }

  // Primary: BroadcastChannel (instant, real-time)
  try {
    const bc = new BroadcastChannel(VERIFICATION_CHANNEL_NAME);
    bc.postMessage(payload);
    // Close immediately — we only need to send once
    bc.close();
  } catch {
    // BroadcastChannel unavailable — localStorage fallback is already set
  }
}

/**
 * Subscribes to verification-complete events from other tabs.
 * Returns a cleanup function — call it in useEffect's return to unsubscribe.
 *
 * @param onVerified - Called when another tab signals that verification is done.
 * @param maxAgeMs   - Ignore localStorage signals older than this (default 10 s).
 *                     Prevents stale signals from previous sessions from firing.
 */
export function onVerified(
  onVerifiedCb: (payload: VerificationCompletePayload) => void,
  maxAgeMs = 10_000,
): () => void {
  if (typeof window === 'undefined') return () => {};

  // ── 1. BroadcastChannel listener (real-time, primary) ──────────────────────
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(VERIFICATION_CHANNEL_NAME);
    bc.onmessage = (event: MessageEvent<VerificationCompletePayload>) => {
      onVerifiedCb(event.data);
    };
  } catch {
    // BroadcastChannel unavailable; rely on the storage event fallback below
  }

  // ── 2. localStorage "storage" event (cross-tab, fires when another tab writes) ─
  const onStorage = (event: StorageEvent) => {
    if (event.key !== VERIFICATION_LS_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as VerificationCompletePayload & {
        ts?: number;
      };
      if (typeof parsed.ts === 'number' && Date.now() - parsed.ts > maxAgeMs) return;
      onVerifiedCb(parsed);
    } catch {
      // Malformed JSON — ignore
    }
  };
  window.addEventListener('storage', onStorage);

  // ── 3. visibilitychange — fires when user switches back to Tab A ────────────
  //    Reads the localStorage flag set by Tab B (handles the case where the
  //    BroadcastChannel message was missed because Tab A was suspended/throttled).
  const onVisibility = () => {
    if (document.visibilityState !== 'visible') return;
    try {
      const raw = localStorage.getItem(VERIFICATION_LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as VerificationCompletePayload & { ts?: number };
      if (typeof parsed.ts === 'number' && Date.now() - parsed.ts > maxAgeMs) return;
      // Clear the flag so we don't fire again on subsequent tab switches
      localStorage.removeItem(VERIFICATION_LS_KEY);
      onVerifiedCb(parsed);
    } catch {
      // Ignore
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    bc?.close();
    window.removeEventListener('storage', onStorage);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

/**
 * Clears the localStorage fallback signal.
 * Call this after consuming the event so it doesn't trigger again.
 */
export function clearVerificationSignal(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(VERIFICATION_LS_KEY);
  } catch {
    // Ignore
  }
}
