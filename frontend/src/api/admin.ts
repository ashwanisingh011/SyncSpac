import api from './axios';

export interface IAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel?: string;
  status: 'active' | 'inactive';
  orgName?: string;
  orgId?: string;
  avatar?: string;
  createdAt: string;
}

export interface IAdminOrganization {
  id: string;
  name: string;
  slug: string;
  owner: string;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  status: 'trial' | 'active' | 'suspended';
  users: number;
  projects: number;
  createdAt: string;
}

export interface IAdminStats {
  orgsCount: number;
  usersCount: number;
  projectsCount: number;
  tasksCount: number;
  activeSubs: number;
  monthlyRevenue: number;

  // Refactored KPI metrics
  totalUsers?: number;
  activeOrgs?: number;
  tasksToday?: number;
  activeSprints?: number;
  flaggedIssues?: number;
  revenueMRR?: number;
  planDistribution?: {
    free: number;
    pro: number;
    business: number;
    enterprise: number;
  };
}

export interface IAdminAuditLog {
  id?: string;
  _id?: string;
  action: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  targetUserId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  targetOrgId?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  reason?: string;
  meta?: any;
  createdAt: string;
}

export interface IUserGrowthData {
  month: string;
  signups: number;
}

export interface ISystemHealthData {
  uptime: string;
  dbLatency: string;
  bullJobsCount: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
  };
}

/**
 * Fetch all platform users (excluding superadmins)
 */
export const getPlatformUsers = async (params?: { search?: string; role?: string; isActive?: string; organization?: string }) => {
  const response = await api.get<{ success: boolean; data: IAdminUser[] }>('/admin/platform-users', { params });
  return response.data;
};

/**
 * Toggle user ban status
 */
export const toggleBanUser = async (userId: string, reason?: string) => {
  const response = await api.patch<{ success: boolean; message: string; data: Partial<IAdminUser> }>(
    `/admin/users/${userId}/toggle-ban`,
    { reason }
  );
  return response.data;
};

/**
 * Get all organizations in the platform
 */
export const getPlatformOrganizations = async (params?: { search?: string; plan?: string; status?: string }) => {
  const response = await api.get<{ success: boolean; data: IAdminOrganization[] }>('/admin/organizations', { params });
  return response.data;
};

/**
 * Create new organization directly
 */
export const createOrganizationByAdmin = async (data: { name: string; ownerEmail: string; plan?: string }) => {
  const response = await api.post<{ success: boolean; message: string; data: any }>('/admin/organizations', data);
  return response.data;
};

/**
 * Toggle suspension status of an organization
 */
export const toggleSuspendOrganization = async (orgId: string, reason?: string) => {
  const response = await api.patch<{ success: boolean; message: string; data: Partial<IAdminOrganization> }>(
    `/admin/organizations/${orgId}/toggle-suspend`,
    { reason }
  );
  return response.data;
};

/**
 * Change subscription plan of an organization
 */
export const changeOrganizationPlan = async (orgId: string, plan: 'free' | 'pro' | 'business' | 'enterprise', reason?: string) => {
  const response = await api.patch<{ success: boolean; message: string; data: Partial<IAdminOrganization> }>(
    `/admin/organizations/${orgId}/plan`,
    { plan, reason }
  );
  return response.data;
};

/**
 * Get platform-wide statistics
 */
export const getPlatformStats = async () => {
  const response = await api.get<{ success: boolean; data: IAdminStats }>('/admin/stats');
  return response.data;
};

/**
 * Get platform-wide audit logs
 */
export const getPlatformAuditLogs = async (params?: { action?: string; from?: string; to?: string }) => {
  const response = await api.get<{ success: boolean; data: IAdminAuditLog[] }>('/admin/audit-logs', { params });
  return response.data;
};

/**
 * Get user registrations daily growth
 */
export const getUserGrowthData = async () => {
  const response = await api.get<{ success: boolean; data: IUserGrowthData[] }>('/admin/user-growth');
  return response.data;
};

/**
 * Get system health metrics
 */
export const getSystemHealthData = async () => {
  const response = await api.get<{ success: boolean; data: ISystemHealthData }>('/admin/system/health');
  return response.data;
};
