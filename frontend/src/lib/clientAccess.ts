import type { AuthUser } from '@/context/authContextInstance';
import type { OrganizationSummary } from '@/types/workspace';

export const CLIENT_DASHBOARD_ROUTE = '/client-dashboard';

/** True when the user is a client (global role or org membership role). */
export function isClientUser(
  user: AuthUser | null | undefined,
  org: OrganizationSummary | null | undefined,
): boolean {
  if (org) {
    const orgRole = org.myRole?.toLowerCase();
    return orgRole === 'client';
  }
  const globalRole = user?.role?.toLowerCase();
  return globalRole === 'client';
}

/** True when only the global auth user role is client (used before org context loads). */
export function isClientGlobalRole(role: string | undefined | null): boolean {
  return role?.toLowerCase() === 'client';
}
