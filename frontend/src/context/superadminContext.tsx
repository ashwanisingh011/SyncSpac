'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getPlatformStats,
  getPlatformUsers,
  getPlatformOrganizations,
  getPlatformAuditLogs,
  toggleBanUser,
  toggleSuspendOrganization,
  changeOrganizationPlan,
  type IAdminStats,
  type IAdminUser,
  type IAdminOrganization,
  type IAdminAuditLog,
} from '@/api/admin';

interface SuperAdminContextValue {
  // Data state
  stats: IAdminStats | null;
  usersList: IAdminUser[];
  orgsList: IAdminOrganization[];
  auditLogs: IAdminAuditLog[];
  loading: boolean;
  actionLoadingId: string | null;
  error: string;
  setError: (err: string) => void;

  // Derived state
  activeItem: string;
  setActiveItem: (item: string) => void;

  // Modal selection states
  selectedUser: IAdminUser | null;
  setSelectedUser: (user: IAdminUser | null) => void;
  selectedOrg: IAdminOrganization | null;
  setSelectedOrg: (org: IAdminOrganization | null) => void;

  // Filters State
  userSearch: string;
  setUserSearch: (s: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (s: string) => void;
  userStatusFilter: string;
  setUserStatusFilter: (s: string) => void;
  userOrgFilter: string;
  setUserOrgFilter: (s: string) => void;

  orgSearch: string;
  setOrgSearch: (s: string) => void;
  orgPlanFilter: string;
  setOrgPlanFilter: (s: string) => void;
  orgStatusFilter: string;
  setOrgStatusFilter: (s: string) => void;

  auditActionFilter: string;
  setAuditActionFilter: (s: string) => void;
  auditFromFilter: string;
  setAuditFromFilter: (s: string) => void;
  auditToFilter: string;
  setAuditToFilter: (s: string) => void;

  // Handlers
  loadStats: () => Promise<void>;
  loadTabData: () => Promise<void>;
  handleToggleBanUser: (userId: string) => Promise<void>;
  handleToggleSuspendOrg: (orgId: string) => Promise<void>;
  handleChangePlan: (orgId: string, plan: 'free' | 'pro' | 'business' | 'enterprise') => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextValue | null>(null);

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Derive activeItem from pathname
  const getActiveItem = useCallback(() => {
    if (pathname === '/superadmin') return 'dashboard';
    if (pathname.startsWith('/superadmin/users')) return 'users';
    if (pathname.startsWith('/superadmin/organizations')) return 'organizations';
    if (pathname.startsWith('/superadmin/subscriptions')) return 'subscriptions';
    if (pathname.startsWith('/superadmin/create-plan')) return 'create-plan';
    if (pathname.startsWith('/superadmin/activity')) return 'activity';
    if (pathname.startsWith('/superadmin/system')) return 'system';
    if (pathname.startsWith('/superadmin/profile')) return 'profile';
    if (pathname.startsWith('/superadmin/settings')) return 'settings';
    return 'dashboard';
  }, [pathname]);

  const activeItem = getActiveItem();

  const setActiveItem = useCallback((itemId: string) => {
    if (itemId === 'dashboard') {
      router.push('/superadmin');
    } else {
      router.push(`/superadmin/${itemId}`);
    }
  }, [router]);

  // Real data state
  const [stats, setStats] = useState<IAdminStats | null>(null);
  const [usersList, setUsersList] = useState<IAdminUser[]>([]);
  const [orgsList, setOrgsList] = useState<IAdminOrganization[]>([]);
  const [auditLogs, setAuditLogs] = useState<IAdminAuditLog[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<IAdminUser | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<IAdminOrganization | null>(null);

  // Filters State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userOrgFilter, setUserOrgFilter] = useState('');

  const [orgSearch, setOrgSearch] = useState('');
  const [orgPlanFilter, setOrgPlanFilter] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState('');

  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditFromFilter, setAuditFromFilter] = useState('');
  const [auditToFilter, setAuditToFilter] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const statsRes = await getPlatformStats();
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to reload metrics:', err);
    }
  }, []);

  const loadTabData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeItem === 'dashboard') {
        const [statsRes, logsRes] = await Promise.all([
          getPlatformStats(),
          getPlatformAuditLogs().catch(() => ({ success: false, data: [] }))
        ]);
        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (logsRes.success) {
          setAuditLogs(logsRes.data);
        }
      } else if (activeItem === 'users') {
        const [usersResponse, orgsResponse] = await Promise.all([
          getPlatformUsers({
            search: userSearch,
            role: userRoleFilter,
            isActive: userStatusFilter,
            organization: userOrgFilter,
          }),
          getPlatformOrganizations().catch(() => ({ success: false, data: [] }))
        ]);
        if (usersResponse.success) {
          setUsersList(usersResponse.data);
        }
        if (orgsResponse.success) {
          setOrgsList(orgsResponse.data);
        }
      } else if (activeItem === 'organizations') {
        const response = await getPlatformOrganizations({
          search: orgSearch,
          plan: orgPlanFilter,
          status: orgStatusFilter
        });
        if (response.success) {
          setOrgsList(response.data);
        }
      } else if (activeItem === 'activity') {
        const response = await getPlatformAuditLogs({
          action: auditActionFilter,
          from: auditFromFilter,
          to: auditToFilter
        });
        if (response.success) {
          setAuditLogs(response.data);
        }
      }
    } catch (err: any) {
      console.error('Failed to load superadmin data:', err);
      setError(err.response?.data?.message || 'Unauthorized or failed to connect to server.');
    } finally {
      setLoading(false);
    }
  }, [
    activeItem,
    userSearch,
    userRoleFilter,
    userStatusFilter,
    userOrgFilter,
    orgSearch,
    orgPlanFilter,
    orgStatusFilter,
    auditActionFilter,
    auditFromFilter,
    auditToFilter,
  ]);

  useEffect(() => {
    loadTabData();
  }, [
    activeItem,
    userRoleFilter,
    userStatusFilter,
    userOrgFilter,
    orgPlanFilter,
    orgStatusFilter,
    auditActionFilter,
    auditFromFilter,
    auditToFilter,
    loadTabData,
  ]);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadTabData();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearch, orgSearch, loadTabData]);

  const handleToggleBanUser = useCallback(async (userId: string) => {
    setActionLoadingId(userId);
    try {
      const response = await toggleBanUser(userId);
      if (response.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
        );
        loadStats();
      }
    } catch (err) {
      console.error('Ban action failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  }, [loadStats]);

  const handleToggleSuspendOrg = useCallback(async (orgId: string) => {
    setActionLoadingId(orgId);
    try {
      const response = await toggleSuspendOrganization(orgId);
      if (response.success) {
        setOrgsList((prev) =>
          prev.map((o) =>
            o.id === orgId
              ? { ...o, status: o.status === 'suspended' ? 'active' : 'suspended' }
              : o
          )
        );
        loadStats();
      }
    } catch (err) {
      console.error('Suspension action failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  }, [loadStats]);

  const handleChangePlan = useCallback(async (orgId: string, plan: 'free' | 'pro' | 'business' | 'enterprise') => {
    setActionLoadingId(orgId);
    try {
      const response = await changeOrganizationPlan(orgId, plan);
      if (response.success) {
        setOrgsList((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, plan } : o))
        );
        loadStats();
      }
    } catch (err) {
      console.error('Plan change failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  }, [loadStats]);

  const value: SuperAdminContextValue = {
    stats,
    usersList,
    orgsList,
    auditLogs,
    loading,
    actionLoadingId,
    error,
    setError,
    activeItem,
    setActiveItem,
    selectedUser,
    setSelectedUser,
    selectedOrg,
    setSelectedOrg,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    userStatusFilter,
    setUserStatusFilter,
    userOrgFilter,
    setUserOrgFilter,
    orgSearch,
    setOrgSearch,
    orgPlanFilter,
    setOrgPlanFilter,
    orgStatusFilter,
    setOrgStatusFilter,
    auditActionFilter,
    setAuditActionFilter,
    auditFromFilter,
    setAuditFromFilter,
    auditToFilter,
    setAuditToFilter,
    loadStats,
    loadTabData,
    handleToggleBanUser,
    handleToggleSuspendOrg,
    handleChangePlan,
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (!context) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}
