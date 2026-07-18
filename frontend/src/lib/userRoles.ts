/**
 * Global user roles from backend UserRole enum.
 * Keep the superadmin detection logic here, but derive labels dynamically.
 */

import { getRoleLabel } from '@/lib/rbacMatrix';

export const SUPERADMIN_ROUTE = '/superadmin';

export function getGlobalRoleLabel(role: string | undefined): string {
  if (!role) return 'Member';
  return getRoleLabel(role);
}

/** True for `super_admin` and legacy `superadmin` role values. */
export function isSuperAdmin(role: string | undefined | null): boolean {
  if (!role) return false;
  return role.toLowerCase().replace(/_/g, '') === 'superadmin';
}

/** Normalize user payload from auth/org APIs into stored auth user shape. */
export function normalizeAuthUser(
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!raw) return null;
  const id = (raw.id ?? raw._id) as string | undefined;
  return {
    ...raw,
    id,
    role: raw.role as string | undefined,
    avatar: raw.avatar as string | undefined,
  };
}
