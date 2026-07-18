/**
 * Canonical RBAC matrix — single source of truth for role permissions.
 * Access levels: ALLOW (full), OWN (own records only), READ_ONLY (view only), DENY (no access).
 */

export type AccessLevel = 'ALLOW' | 'OWN' | 'READ_ONLY' | 'DENY';

export const PERMISSION_CODES = [
  'create_workspace',
  'manage_workspace',
  'invite_members',
  'manage_members',
  'create_project',
  'edit_project',
  'delete_project',
  'manage_project_members',
  'create_task',
  'edit_task',
  'delete_task',
  'assign_task',
  'change_task_status',
  'manage_sprint',
  'manage_team',
  'manage_departments',
  'view_reports',
  'manage_billing',
  'view_audit_logs',
  'manage_roles',
  'admin_panel_access',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export interface RoleDefinition {
  code: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

/** Role codes and display names aligned with the RBAC matrix. */
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    code: 'superadmin',
    name: 'SuperAdmin',
    description: 'Platform-wide administrator with unrestricted access.',
    isDefault: true,
  },
  {
    code: 'org_admin',
    name: 'OrgAdmin',
    description: 'Organization administrator with full workspace governance.',
    isDefault: true,
  },
  {
    code: 'project_manager',
    name: 'ProjectManager',
    description: 'Coordinates projects, members, and delivery execution.',
    isDefault: true,
  },
  {
    code: 'team_lead',
    name: 'TeamLead',
    description: 'Leads a delivery team and drives active work forward.',
    isDefault: true,
  },
  {
    code: 'developer',
    name: 'Developer',
    description: 'Builds and advances work items through delivery.',
    isDefault: true,
  },
  {
    code: 'qa_tester',
    name: 'QA',
    description: 'Validates quality, testing, and release readiness.',
    isDefault: true,
  },
  {
    code: 'hr',
    name: 'HR',
    description: 'Manages members, invites, and department structure.',
    isDefault: true,
  },
  {
    code: 'client',
    name: 'Client',
    description: 'Stakeholder visibility into progress and reports.',
    isDefault: true,
  },
  // Legacy workspace roles kept for backward compatibility
  {
    code: 'admin',
    name: 'Admin',
    description: 'Legacy workspace administrator (maps to OrgAdmin permissions).',
    isDefault: true,
  },
  {
    code: 'member',
    name: 'Member',
    description: 'General contributor with limited workspace access.',
    isDefault: true,
  },
  {
    code: 'guest',
    name: 'Guest',
    description: 'Limited-access role for external participation.',
    isDefault: true,
  },
];

const ALL_ALLOW = Object.fromEntries(
  PERMISSION_CODES.map((code) => [code, 'ALLOW' as AccessLevel]),
) as Record<PermissionCode, AccessLevel>;

const denyAll = (): Record<PermissionCode, AccessLevel> =>
  Object.fromEntries(PERMISSION_CODES.map((code) => [code, 'DENY' as AccessLevel])) as Record<
    PermissionCode,
    AccessLevel
  >;

const buildMatrix = (
  overrides: Partial<Record<PermissionCode, AccessLevel>>,
): Record<PermissionCode, AccessLevel> => ({
  ...denyAll(),
  ...overrides,
});

/** Full permission matrix per canonical role code. */
export const RBAC_MATRIX: Record<string, Record<PermissionCode, AccessLevel>> = {
  superadmin: ALL_ALLOW,
  org_admin: buildMatrix({
    create_workspace: 'ALLOW',
    manage_workspace: 'ALLOW',
    invite_members: 'ALLOW',
    manage_members: 'ALLOW',
    create_project: 'ALLOW',
    edit_project: 'ALLOW',
    delete_project: 'ALLOW',
    manage_project_members: 'ALLOW',
    create_task: 'ALLOW',
    edit_task: 'ALLOW',
    delete_task: 'ALLOW',
    assign_task: 'ALLOW',
    change_task_status: 'ALLOW',
    manage_sprint: 'ALLOW',
    manage_team: 'ALLOW',
    manage_departments: 'ALLOW',
    view_reports: 'ALLOW',
    manage_billing: 'ALLOW',
    view_audit_logs: 'ALLOW',
    manage_roles: 'ALLOW',
    admin_panel_access: 'DENY',
  }),
  project_manager: buildMatrix({
    invite_members: 'ALLOW',
    manage_members: 'ALLOW',
    create_project: 'ALLOW',
    edit_project: 'ALLOW',
    manage_project_members: 'ALLOW',
    create_task: 'ALLOW',
    edit_task: 'ALLOW',
    delete_task: 'ALLOW',
    assign_task: 'ALLOW',
    change_task_status: 'ALLOW',
    manage_sprint: 'ALLOW',
    manage_team: 'ALLOW',
    view_reports: 'ALLOW',
  }),
  team_lead: buildMatrix({
    create_task: 'ALLOW',
    edit_task: 'ALLOW',
    delete_task: 'ALLOW',
    assign_task: 'ALLOW',
    change_task_status: 'ALLOW',
    manage_sprint: 'ALLOW',
    view_reports: 'ALLOW',
  }),
  developer: buildMatrix({
    create_task: 'ALLOW',
    edit_task: 'OWN',
    change_task_status: 'ALLOW',
    view_reports: 'ALLOW',
  }),
  qa_tester: buildMatrix({
    create_task: 'ALLOW',
    edit_task: 'OWN',
    change_task_status: 'ALLOW',
    view_reports: 'ALLOW',
  }),
  hr: buildMatrix({
    invite_members: 'ALLOW',
    manage_members: 'ALLOW',
    manage_departments: 'ALLOW',
  }),
  client: buildMatrix({
    view_reports: 'READ_ONLY',
  }),
  // Legacy aliases
  admin: buildMatrix({
    create_workspace: 'ALLOW',
    manage_workspace: 'ALLOW',
    invite_members: 'ALLOW',
    manage_members: 'ALLOW',
    create_project: 'ALLOW',
    edit_project: 'ALLOW',
    delete_project: 'ALLOW',
    manage_project_members: 'ALLOW',
    create_task: 'ALLOW',
    edit_task: 'ALLOW',
    delete_task: 'ALLOW',
    assign_task: 'ALLOW',
    change_task_status: 'ALLOW',
    manage_sprint: 'ALLOW',
    manage_team: 'ALLOW',
    manage_departments: 'ALLOW',
    view_reports: 'ALLOW',
    manage_billing: 'ALLOW',
    view_audit_logs: 'ALLOW',
    manage_roles: 'ALLOW',
    admin_panel_access: 'DENY',
  }),
  owner: buildMatrix({
    create_workspace: 'ALLOW',
    manage_workspace: 'ALLOW',
    invite_members: 'ALLOW',
    manage_members: 'ALLOW',
    create_project: 'ALLOW',
    edit_project: 'ALLOW',
    delete_project: 'ALLOW',
    manage_project_members: 'ALLOW',
    create_task: 'ALLOW',
    edit_task: 'ALLOW',
    delete_task: 'ALLOW',
    assign_task: 'ALLOW',
    change_task_status: 'ALLOW',
    manage_sprint: 'ALLOW',
    manage_team: 'ALLOW',
    manage_departments: 'ALLOW',
    view_reports: 'ALLOW',
    manage_billing: 'ALLOW',
    view_audit_logs: 'ALLOW',
    manage_roles: 'ALLOW',
    admin_panel_access: 'DENY',
  }),
  member: denyAll(),
  guest: denyAll(),
};

/** Roles that receive DB RolePermission rows during seeding. */
export const SEEDED_ROLE_CODES = [
  'superadmin',
  'org_admin',
  'project_manager',
  'team_lead',
  'developer',
  'qa_tester',
  'hr',
  'client',
] as const;

/** Map legacy / alias role codes to canonical matrix keys. */
export const ROLE_ALIASES: Record<string, string> = {
  super_admin: 'superadmin',
  owner: 'org_admin',
  admin: 'org_admin',
  qa: 'qa_tester',
};

export function normalizeRoleCode(roleCode: string | undefined | null): string {
  if (!roleCode) return '';
  const normalized = roleCode.toLowerCase().trim();
  return ROLE_ALIASES[normalized] ?? normalized;
}

export function isSuperAdminRole(roleCode: string | undefined | null): boolean {
  const code = normalizeRoleCode(roleCode);
  return code === 'superadmin';
}

export function getAccessLevel(
  roleCode: string | undefined | null,
  permissionCode: PermissionCode,
): AccessLevel {
  const code = normalizeRoleCode(roleCode);
  if (isSuperAdminRole(code)) return 'ALLOW';
  const matrix = RBAC_MATRIX[code];
  if (!matrix) return 'DENY';
  return matrix[permissionCode] ?? 'DENY';
}

/** Permission codes granted at ALLOW level (stored in RolePermission table). */
export function getAllowedPermissionCodes(roleCode: string): string[] {
  const code = normalizeRoleCode(roleCode);
  const matrix = RBAC_MATRIX[code];
  if (!matrix) return [];
  return PERMISSION_CODES.filter((perm) => matrix[perm] === 'ALLOW');
}

/** Permission codes granted at ALLOW or OWN level (user can attempt the action). */
export function getEffectivePermissionCodes(roleCode: string): string[] {
  const code = normalizeRoleCode(roleCode);
  const matrix = RBAC_MATRIX[code];
  if (!matrix) return [];
  return PERMISSION_CODES.filter(
    (perm) => matrix[perm] === 'ALLOW' || matrix[perm] === 'OWN' || matrix[perm] === 'READ_ONLY',
  );
}

export function hasPermissionAccess(
  roleCode: string | undefined | null,
  permissionCode: PermissionCode,
): boolean {
  const level = getAccessLevel(roleCode, permissionCode);
  return level === 'ALLOW' || level === 'OWN' || level === 'READ_ONLY';
}

export function getRoleDefinition(roleCode: string): RoleDefinition | undefined {
  const code = normalizeRoleCode(roleCode);
  return ROLE_DEFINITIONS.find((role) => role.code === code || role.code === roleCode);
}

export function getRoleLabel(roleCode: string): string {
  return getRoleDefinition(roleCode)?.name ?? roleCode;
}
