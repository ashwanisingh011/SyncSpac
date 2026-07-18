import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { isSuperAdmin as isGlobalSuperAdmin } from '@/lib/userRoles';
import {
  canPerformPermission,
  getAccessLevel,
  isSuperAdminRole,
  normalizeRoleCode,
  type PermissionCode,
  type TaskOwnershipContext,
} from '@/lib/rbacMatrix';

function resolveEffectiveRole(
  globalRole: string | undefined,
  orgRole: string | undefined,
): string {
  if (isGlobalSuperAdmin(globalRole)) return 'superadmin';
  return orgRole || globalRole || '';
}

export const usePermission = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  const effectiveRole = resolveEffectiveRole(user?.role, currentOrg?.myRole);
  const apiPermissions = currentOrg?.permissions ?? [];

  const hasPermission = (
    permissionCode: PermissionCode,
    context?: { task?: TaskOwnershipContext },
  ): boolean => {
    if (!user) return false;
    if (isSuperAdminRole(effectiveRole)) return true;

    if (apiPermissions.includes(permissionCode)) {
      const level = getAccessLevel(effectiveRole, permissionCode);
      if (level === 'DENY') return false;
      if (level === 'OWN' && context?.task) {
        return canPerformPermission(effectiveRole, permissionCode, {
          task: context.task,
          userId: user.id || user._id,
        });
      }
      return true;
    }

    return canPerformPermission(effectiveRole, permissionCode, {
      task: context?.task,
      userId: user.id || user._id,
    });
  };

  const hasRole = (roleCode: string): boolean => {
    return normalizeRoleCode(effectiveRole) === normalizeRoleCode(roleCode);
  };

  const canEditTask = (task: TaskOwnershipContext): boolean =>
    hasPermission('edit_task', { task });

  const canDeleteTask = (): boolean => hasPermission('delete_task');

  const canAssignTask = (): boolean => hasPermission('assign_task');

  const canChangeTaskStatus = (task?: TaskOwnershipContext): boolean => {
    if (task) {
      return hasPermission('change_task_status', { task });
    }
    return hasPermission('change_task_status');
  };

  const getPermissionLevel = (permissionCode: PermissionCode) =>
    getAccessLevel(effectiveRole, permissionCode);

  return {
    hasPermission,
    hasRole,
    canEditTask,
    canDeleteTask,
    canAssignTask,
    canChangeTaskStatus,
    getPermissionLevel,
    effectiveRole,
    user,
    currentOrg,
  };
};
