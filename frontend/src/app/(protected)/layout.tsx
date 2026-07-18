"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import OrgGate from '@/components/OrgGate';
import ClientRouteGuard from '@/components/ClientRouteGuard';
import TopNavbar from '@/components/TopNavbar';
import { NotificationProvider } from '@/context/NotificationContext';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { isClientUser } from '@/lib/clientAccess';
import { isSuperAdmin } from '@/lib/userRoles';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  
  const isClient = isClientUser(user, currentOrg);
  const isClientDashboard = pathname?.startsWith('/client-dashboard') ?? false;
  const isGlobalSuperAdmin = isSuperAdmin(user?.role);
  
  const isOrgAdmin = currentOrg?.myRole === 'owner' || currentOrg?.myRole === 'admin' || currentOrg?.myRole === 'org_admin';
  const isOrgDashboard = isOrgAdmin && (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/')
  );
  const isWorkspaceCreate = pathname === '/workspace/create';
  const isCheckout = pathname?.startsWith('/checkout') ?? false;
  
  const showTopNavbar = !isClient && !isClientDashboard && !isOrgDashboard && !isCheckout;

  useEffect(() => {
    if (isGlobalSuperAdmin) {
      router.replace('/superadmin');
    } else if (isOrgAdmin && pathname === '/workspace/create') {
      router.replace('/dashboard/workspace/create');
    } else if (isOrgAdmin && !isOrgDashboard && !isWorkspaceCreate && !isCheckout) {
      router.replace('/dashboard');
    }
  }, [isGlobalSuperAdmin, isOrgAdmin, isOrgDashboard, isWorkspaceCreate, isCheckout, router, pathname]);

  if (isGlobalSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Redirecting to Admin Dashboard...
      </div>
    );
  }

  if (isOrgAdmin && !isOrgDashboard && !isWorkspaceCreate && !isCheckout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Redirecting to dashboard...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <OrgGate>
        <ClientRouteGuard>
          <NotificationProvider>
            <div className="min-h-screen flex flex-col bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
              {showTopNavbar && <TopNavbar />}
              <main className="flex-1 flex overflow-hidden">
                {children}
              </main>
            </div>
          </NotificationProvider>
        </ClientRouteGuard>
      </OrgGate>
    </ProtectedRoute>
  );
}
