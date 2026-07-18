/**
 * Post-authentication navigation for the first-time user flow.
 * All successful auth paths should land on /onboarding unless a specific redirect is provided.
 */

import { isSuperAdmin, SUPERADMIN_ROUTE } from '@/lib/userRoles';
import { CLIENT_DASHBOARD_ROUTE, isClientGlobalRole } from '@/lib/clientAccess';

export const ONBOARDING_ROUTE = '/onboarding';
export const DASHBOARD_ROUTE = '/workspace';
export { SUPERADMIN_ROUTE, CLIENT_DASHBOARD_ROUTE };

/** Default destination after login, register, or 2FA when no explicit redirect is set. */
export function getDefaultPostAuthRoute(): string {
  return ONBOARDING_ROUTE;
}

/**
 * Resolve redirect target after auth.
 * Preserves deep links (e.g. accept-invite) while defaulting to onboarding.
 */
export function resolvePostAuthRedirect(explicitRedirect: string | null): string {
  if (!explicitRedirect) return getDefaultPostAuthRoute();
  const trimmed = explicitRedirect.trim();
  if (!trimmed.startsWith('/')) return getDefaultPostAuthRoute();
  return trimmed;
}

/** Resolve where to send the user immediately after login, 2FA, or email verification. */
export function getPostAuthRouteForUser(
  role: string | undefined | null,
  explicitRedirect?: string | null,
): string {
  if (isSuperAdmin(role)) return SUPERADMIN_ROUTE;
  if (isClientGlobalRole(role)) return CLIENT_DASHBOARD_ROUTE;
  return resolvePostAuthRedirect(explicitRedirect ?? null);
}
