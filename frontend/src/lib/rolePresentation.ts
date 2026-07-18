import type { WorkspaceRoleCapabilities, WorkspaceRoleOption } from '@/types/workspace';
import { getRoleLabel as getMatrixRoleLabel } from '@/lib/rbacMatrix';

export const EMPTY_WORKSPACE_CAPABILITIES: WorkspaceRoleCapabilities = {
  canManageMembers: false,
  canManageWorkspace: false,
  canDeleteWorkspace: false,
  canCreateProject: false,
  canManageProjects: false,
  canManageBilling: false,
};

export function formatRoleLabel(role: string | undefined | null, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim();
  if (!role) return 'Member';
  return getMatrixRoleLabel(role);
}

export function describeRole(
  role: string | undefined | null,
  fallback?: string,
): string {
  if (fallback?.trim()) return fallback.trim();
  if (!role) return 'No role specified.';
  return `${formatRoleLabel(role)} role in the workspace.`;
}

export function findRoleOption(
  roles: WorkspaceRoleOption[],
  roleCode: string | undefined | null,
): WorkspaceRoleOption | undefined {
  if (!roleCode) return undefined;
  return roles.find((role) => role.code === roleCode);
}
