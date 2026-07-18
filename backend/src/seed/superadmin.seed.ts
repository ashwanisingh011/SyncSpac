import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import { UserRole } from '../types/roles.js';
import {
  PERMISSION_CODES,
  ROLE_DEFINITIONS,
  SEEDED_ROLE_CODES,
  getAllowedPermissionCodes,
} from '../utils/rbacMatrix.js';

dotenv.config();

type RequiredEnvName =
  | 'SUPERADMIN_FIRST_NAME'
  | 'SUPERADMIN_LAST_NAME'
  | 'SUPERADMIN_USERNAME'
  | 'SUPERADMIN_EMAIL'
  | 'SUPERADMIN_PASSWORD'
  | 'MONGODB_URI';

const getRequiredEnv = (name: RequiredEnvName): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const PERMISSION_LABELS: Record<string, { label: string; module: string }> = {
  create_workspace: { label: 'Create a new organization workspace', module: 'workspace' },
  manage_workspace: { label: 'Edit workspace settings, branding, billing', module: 'workspace' },
  delete_workspace: { label: 'Delete the entire workspace', module: 'workspace' },
  invite_members: { label: 'Invite users to workspace', module: 'workspace' },
  manage_members: { label: 'Change member roles, remove members', module: 'workspace' },
  create_project: { label: 'Create new projects', module: 'project' },
  edit_project: { label: 'Edit project details and settings', module: 'project' },
  delete_project: { label: 'Archive or delete a project', module: 'project' },
  manage_project_members: { label: 'Add/remove members from a project', module: 'project' },
  view_reports: { label: 'Access analytics and reports', module: 'project' },
  create_task: { label: 'Create tasks / issues', module: 'task' },
  edit_task: { label: 'Edit task fields (title, description, etc.)', module: 'task' },
  delete_task: { label: 'Delete any task in the project', module: 'task' },
  assign_task: { label: 'Assign tasks to team members', module: 'task' },
  change_task_status: { label: 'Move tasks across status columns', module: 'task' },
  manage_sprint: { label: 'Create, start, complete sprints', module: 'sprint' },
  manage_team: { label: 'Create teams, assign leads', module: 'team' },
  manage_departments: { label: 'Create/edit departments', module: 'team' },
  manage_billing: { label: 'View and modify subscription plans', module: 'billing' },
  view_audit_logs: { label: 'View audit and activity logs', module: 'admin' },
  manage_roles: { label: 'Create custom roles, assign permissions', module: 'admin' },
  admin_panel_access: { label: 'Access the superadmin control panel', module: 'admin' },
};

const bootstrapRBACAndSuperadmin = async (): Promise<void> => {
  try {
    const firstName = getRequiredEnv('SUPERADMIN_FIRST_NAME');
    const lastName = getRequiredEnv('SUPERADMIN_LAST_NAME');
    const username = getRequiredEnv('SUPERADMIN_USERNAME');
    const email = getRequiredEnv('SUPERADMIN_EMAIL').toLowerCase();
    const password = getRequiredEnv('SUPERADMIN_PASSWORD');
    const mongodbUri = getRequiredEnv('MONGODB_URI');

    await mongoose.connect(mongodbUri);

    // 1. Seed Permissions
    const permissionsMap: Record<string, mongoose.Types.ObjectId> = {};
    const allPermissionCodes = [...PERMISSION_CODES, 'delete_workspace'];
    for (const code of allPermissionCodes) {
      const meta = PERMISSION_LABELS[code];
      const permission = await Permission.findOneAndUpdate(
        { code },
        { $set: { code, label: meta.label, module: meta.module } },
        { upsert: true, new: true },
      );
      permissionsMap[code] = permission._id as mongoose.Types.ObjectId;
    }

    // 2. Seed Roles
    const rolesMap: Record<string, mongoose.Types.ObjectId> = {};
    for (const roleDef of ROLE_DEFINITIONS) {
      const role = await Role.findOneAndUpdate(
        { code: roleDef.code },
        {
          $set: {
            code: roleDef.code,
            name: roleDef.name,
            description: roleDef.description,
            isDefault: roleDef.isDefault ?? true,
          },
        },
        { upsert: true, new: true },
      );
      rolesMap[roleDef.code] = role._id as mongoose.Types.ObjectId;
    }

    // 3. Seed RolePermissions mappings from RBAC matrix
    await RolePermission.deleteMany({});

    const rolePermissionDocs = [];
    for (const roleCode of SEEDED_ROLE_CODES) {
      const roleId = rolesMap[roleCode];
      const permissionCodes = getAllowedPermissionCodes(roleCode);

      for (const pCode of permissionCodes) {
        const permissionId = permissionsMap[pCode];
        if (roleId && permissionId) {
          rolePermissionDocs.push({ roleId, permissionId });
        }
      }
    }

    // Superadmin also gets delete_workspace
    const superadminRoleId = rolesMap.superadmin;
    const deleteWorkspacePermId = permissionsMap.delete_workspace;
    if (superadminRoleId && deleteWorkspacePermId) {
      rolePermissionDocs.push({ roleId: superadminRoleId, permissionId: deleteWorkspacePermId });
    }

    await RolePermission.insertMany(rolePermissionDocs);

    // 4. Seed Superadmin User
    const existingSuperadmin = await User.findOne({
      $or: [{ role: UserRole.SUPER_ADMIN }, { role: 'superadmin' }],
    })
      .select('_id')
      .lean()
      .exec();

    if (existingSuperadmin) {
      console.warn('Superadmin user account already exists. Skipping user creation.');
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);
      const name = `${firstName} ${lastName}`.trim();

      const superadmin = new User({
        name,
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isVerified: true,
        isActive: true,
      });

      await superadmin.save();
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: unknown) {
    console.error('Failed to bootstrap RBAC and superadmin account:', error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  }
};

void bootstrapRBACAndSuperadmin();
