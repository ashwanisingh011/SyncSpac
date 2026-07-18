/**
 * Frontend mirror of backend RBAC matrix.
 * Keep in sync with backend/src/utils/rbacMatrix.ts
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
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  { code: 'superadmin', name: 'SuperAdmin', description: 'Platform-wide administrator.' },
  { code: 'org_admin', name: 'OrgAdmin', description: 'Organization administrator.' },
  { code: 'project_manager', name: 'ProjectManager', description: 'Coordinates projects and delivery.' },
  { code: 'team_lead', name: 'TeamLead', description: 'Leads a delivery team.' },
  { code: 'developer', name: 'Developer', description: 'Builds and advances work items.' },
  { code: 'qa_tester', name: 'QA', description: 'Validates quality and testing.' },
  // { code: 'hr', name: 'HR', description: 'Manages members and departments.' },
  { code: 'client', name: 'Client', description: 'Stakeholder visibility role.' },
  // { code: 'admin', name: 'Admin', description: 'Legacy workspace administrator.' },
  // { code: 'member', name: 'Member', description: 'General contributor.' },
  { code: 'owner', name: 'Owner', description: 'Workspace creator.' },
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
  return normalizeRoleCode(roleCode) === 'superadmin';
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

export function getRoleLabel(roleCode: string | undefined | null): string {
  if (!roleCode) return 'Member';
  const code = normalizeRoleCode(roleCode);
  const def = ROLE_DEFINITIONS.find((r) => r.code === code || r.code === roleCode);
  return def?.name ?? roleCode;
}

export interface TaskOwnershipContext {
  createdBy?: string | { _id?: string };
  assignedTo?: string | { _id?: string } | null;
}

export function resolveUserId(userId: string | undefined | null): string | null {
  if (!userId) return null;
  return String(userId);
}

export function userOwnsTask(
  userId: string | undefined | null,
  task: TaskOwnershipContext,
): boolean {
  const uid = resolveUserId(userId);
  if (!uid) return false;

  const creatorId =
    typeof task.createdBy === 'object'
      ? resolveUserId(task.createdBy?._id)
      : resolveUserId(task.createdBy);

  const assigneeId =
    typeof task.assignedTo === 'object' && task.assignedTo !== null
      ? resolveUserId(task.assignedTo._id)
      : resolveUserId(task.assignedTo as string | undefined);

  return uid === creatorId || uid === assigneeId;
}

export function canPerformPermission(
  roleCode: string | undefined | null,
  permissionCode: PermissionCode,
  context?: { task?: TaskOwnershipContext; userId?: string },
): boolean {
  const level = getAccessLevel(roleCode, permissionCode);
  if (level === 'DENY') return false;
  if (level === 'ALLOW' || level === 'READ_ONLY') return true;
  if (level === 'OWN' && context?.task && context?.userId) {
    return userOwnsTask(context.userId, context.task);
  }
  return false;
}
