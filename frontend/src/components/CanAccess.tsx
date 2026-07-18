'use client';

import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import type { PermissionCode, TaskOwnershipContext } from '@/lib/rbacMatrix';

interface CanAccessProps {
  permission?: PermissionCode;
  role?: string;
  task?: TaskOwnershipContext;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditional rendering component that displays children only if the authenticated user
 * has the required permission code or matches the allowed role.
 */
export const CanAccess: React.FC<CanAccessProps> = ({
  permission,
  role,
  task,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasRole } = usePermission();

  let isAllowed = false;

  if (permission && role) {
    isAllowed = hasPermission(permission, task ? { task } : undefined) || hasRole(role);
  } else if (permission) {
    isAllowed = hasPermission(permission, task ? { task } : undefined);
  } else if (role) {
    isAllowed = hasRole(role);
  } else {
    isAllowed = true;
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default CanAccess;
