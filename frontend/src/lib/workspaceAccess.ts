import type { OrganizationSummary, WorkspaceRoleCapabilities } from '@/types/workspace';
import { EMPTY_WORKSPACE_CAPABILITIES } from '@/lib/rolePresentation';

export function getWorkspaceCapabilities(
  organization: OrganizationSummary | null | undefined,
): WorkspaceRoleCapabilities {
  if (!organization) return EMPTY_WORKSPACE_CAPABILITIES;
  return organization.capabilities ?? EMPTY_WORKSPACE_CAPABILITIES;
}

export function canManageWorkspaceMembers(
  organization: OrganizationSummary | null | undefined,
): boolean {
  return getWorkspaceCapabilities(organization).canManageMembers;
}

export function canManageWorkspaceSettings(
  organization: OrganizationSummary | null | undefined,
): boolean {
  return getWorkspaceCapabilities(organization).canManageWorkspace;
}

export function canDeleteWorkspace(
  organization: OrganizationSummary | null | undefined,
): boolean {
  return getWorkspaceCapabilities(organization).canDeleteWorkspace;
}

export function canCreateWorkspaceProjects(
  organization: OrganizationSummary | null | undefined,
): boolean {
  return getWorkspaceCapabilities(organization).canCreateProject;
}

export function canManageWorkspaceProjects(
  organization: OrganizationSummary | null | undefined,
): boolean {
  return getWorkspaceCapabilities(organization).canManageProjects;
}
