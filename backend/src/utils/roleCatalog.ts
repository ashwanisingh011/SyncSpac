import Role, { type IRole } from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import { OrgRole } from '../models/OrganizationMember.js';
import {
  ROLE_DEFINITIONS,
  getAllowedPermissionCodes,
  getEffectivePermissionCodes,
  getRoleLabel as getMatrixRoleLabel,
  getRoleDefinition,
  normalizeRoleCode,
} from './rbacMatrix.js';

export interface WorkspaceRoleCapabilities {
  canManageMembers: boolean;
  canManageWorkspace: boolean;
  canDeleteWorkspace: boolean;
  canCreateProject: boolean;
  canManageProjects: boolean;
  canManageBilling: boolean;
}

export interface RoleDescriptor {
  code: string;
  name: string;
  description: string;
  isAssignable: boolean;
  isSystem: boolean;
  permissions: string[];
}

const WORKSPACE_ASSIGNABLE_EXCLUDED_CODES = new Set([
  'superadmin',
  'super_admin',
  'org_admin',
  OrgRole.OWNER,
]);

const toTitleCase = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getRoleLabel = (code: string, roleDoc?: Pick<IRole, 'name'> | null): string =>
  roleDoc?.name?.trim() ||
  getMatrixRoleLabel(code) ||
  getRoleDefinition(code)?.name ||
  toTitleCase(code);

export const getRoleDescription = (
  code: string,
  roleDoc?: Pick<IRole, 'description'> | null,
): string =>
  roleDoc?.description?.trim() ||
  getRoleDefinition(code)?.description ||
  'Custom role configured in the TaskBridge role directory.';

export async function ensureSystemRoles(): Promise<void> {
  await Role.bulkWrite(
    ROLE_DEFINITIONS.map((role) => ({
      updateOne: {
        filter: { code: role.code },
        update: {
          $setOnInsert: {
            code: role.code,
            name: role.name,
            description: role.description,
            isDefault: role.isDefault ?? true,
            orgId: null,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}

async function getPermissionCodeMap(roleCodes: string[]): Promise<Map<string, string[]>> {
  const uniqueCodes = [...new Set(roleCodes.filter(Boolean).map(normalizeRoleCode))];
  if (uniqueCodes.length === 0) {
    return new Map();
  }

  const roles = await Role.find({ code: { $in: uniqueCodes } }).select('_id code').lean();
  if (roles.length === 0) {
    return new Map();
  }

  const roleIdToCode = new Map(roles.map((role) => [String(role._id), role.code]));
  const mappings = await RolePermission.find({
    roleId: { $in: roles.map((role) => role._id) },
  })
    .select('roleId permissionId')
    .lean();

  const permissionIds = [...new Set(mappings.map((mapping) => String(mapping.permissionId)))];
  const permissions = await Permission.find({ _id: { $in: permissionIds } })
    .select('_id code')
    .lean();

  const permissionCodeById = new Map(
    permissions.map((permission) => [String(permission._id), permission.code]),
  );

  const result = new Map<string, string[]>();
  for (const mapping of mappings) {
    const roleCode = roleIdToCode.get(String(mapping.roleId));
    const permissionCode = permissionCodeById.get(String(mapping.permissionId));
    if (!roleCode || !permissionCode) continue;
    const existing = result.get(roleCode) ?? [];
    existing.push(permissionCode);
    result.set(roleCode, existing);
  }

  return result;
}

export function capabilitiesFromPermissionCodes(permissionCodes: string[]): WorkspaceRoleCapabilities {
  const permissions = new Set(permissionCodes);
  return {
    canManageMembers:
      permissions.has('manage_members') || permissions.has('invite_members'),
    canManageWorkspace: permissions.has('manage_workspace'),
    canDeleteWorkspace: permissions.has('delete_workspace'),
    canCreateProject: permissions.has('create_project'),
    canManageProjects:
      permissions.has('create_project') ||
      permissions.has('edit_project') ||
      permissions.has('delete_project') ||
      permissions.has('manage_project_members'),
    canManageBilling: permissions.has('manage_billing'),
  };
}

function getMatrixPermissionCodes(roleCode: string): string[] {
  return getAllowedPermissionCodes(roleCode);
}

export async function getWorkspaceCapabilitiesForRole(
  roleCode: string,
): Promise<WorkspaceRoleCapabilities> {
  const normalized = normalizeRoleCode(roleCode);

  const permissionMap = await getPermissionCodeMap([normalized]);
  const dbPermissions = permissionMap.get(normalized) ?? [];

  const matrixPermissions = getMatrixPermissionCodes(normalized);
  const merged = [...new Set([...dbPermissions, ...matrixPermissions])];

  if (merged.length === 0) {
    return capabilitiesFromPermissionCodes([]);
  }

  return capabilitiesFromPermissionCodes(merged);
}

export async function getWorkspaceCapabilitiesForRoles(
  roleCodes: string[],
): Promise<Map<string, WorkspaceRoleCapabilities>> {
  const normalizedCodes = roleCodes.map(normalizeRoleCode);
  const permissionMap = await getPermissionCodeMap(normalizedCodes);
  const result = new Map<string, WorkspaceRoleCapabilities>();

  for (const [index, originalCode] of roleCodes.entries()) {
    const normalized = normalizedCodes[index];
    const dbPermissions = permissionMap.get(normalized) ?? [];
    const matrixPermissions = getMatrixPermissionCodes(normalized);
    const merged = [...new Set([...dbPermissions, ...matrixPermissions])];
    result.set(
      originalCode,
      capabilitiesFromPermissionCodes(merged),
    );
  }

  return result;
}

export async function getPermissionsForRole(roleCode: string): Promise<string[]> {
  const normalized = normalizeRoleCode(roleCode);
  const permissionMap = await getPermissionCodeMap([normalized]);
  const dbPermissions = permissionMap.get(normalized) ?? [];
  const effective = getEffectivePermissionCodes(normalized);
  return [...new Set([...dbPermissions, ...effective])];
}

export async function listWorkspaceAssignableRoles(): Promise<RoleDescriptor[]> {
  await ensureSystemRoles();

  const roles = await Role.find({
    code: { $nin: [...WORKSPACE_ASSIGNABLE_EXCLUDED_CODES] },
  })
    .select('code name description isDefault')
    .sort({ isDefault: -1, name: 1 })
    .lean();

  const permissionMap = await getPermissionCodeMap(roles.map((role) => role.code));

  const preferredOrder = [
    'project_manager',
    'team_lead',
    'developer',
    'qa_tester',
    'hr',
    OrgRole.MEMBER,
    'client',
    OrgRole.GUEST,
    OrgRole.ADMIN,
  ];

  return roles
    .map((role) => ({
      code: role.code,
      name: getRoleLabel(role.code, role),
      description: getRoleDescription(role.code, role),
      isAssignable: true,
      isSystem: Boolean(role.isDefault),
      permissions: permissionMap.get(role.code) ?? getEffectivePermissionCodes(role.code),
    }))
    .sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.code);
      const bIndex = preferredOrder.indexOf(b.code);
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
          (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
      }
      return a.name.localeCompare(b.name);
    });
}

export async function isWorkspaceAssignableRole(roleCode: string): Promise<boolean> {
  if (!roleCode || WORKSPACE_ASSIGNABLE_EXCLUDED_CODES.has(roleCode)) {
    return false;
  }

  const definition = ROLE_DEFINITIONS.find((role) => role.code === roleCode);
  if (definition) {
    return true;
  }

  await ensureSystemRoles();
  const role = await Role.findOne({ code: roleCode }).select('_id').lean();
  return Boolean(role);
}

export async function getRoleDescriptorMap(
  roleCodes: string[],
): Promise<Map<string, RoleDescriptor>> {
  await ensureSystemRoles();

  const uniqueCodes = [...new Set(roleCodes.filter(Boolean))];
  const docs = await Role.find({ code: { $in: uniqueCodes.map(normalizeRoleCode) } })
    .select('code name description isDefault')
    .lean();
  const docsByCode = new Map(docs.map((doc) => [doc.code, doc]));
  const permissionMap = await getPermissionCodeMap(uniqueCodes);

  const result = new Map<string, RoleDescriptor>();
  for (const code of uniqueCodes) {
    const normalized = normalizeRoleCode(code);
    const doc = docsByCode.get(normalized);
    result.set(code, {
      code,
      name: getRoleLabel(code, doc),
      description: getRoleDescription(code, doc),
      isAssignable: !WORKSPACE_ASSIGNABLE_EXCLUDED_CODES.has(code),
      isSystem: Boolean(doc?.isDefault ?? getRoleDefinition(code)),
      permissions:
        permissionMap.get(normalized) ?? getEffectivePermissionCodes(normalized),
    });
  }
  return result;
}

export async function getPlatformRoleLabel(roleCode: string): Promise<string> {
  const normalized = normalizeRoleCode(roleCode);
  const role = await Role.findOne({ code: normalized }).select('name').lean();
  return getRoleLabel(roleCode, role);
}

export function shouldDisplayPlatformRole(roleCode: string): boolean {
  return Boolean(roleCode);
}
