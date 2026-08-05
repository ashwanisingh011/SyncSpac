"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
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
  children?: React.ReactNode;
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
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-content-tertiary">
        Redirecting to Admin Dashboard...
      </div>
    );
  }

  if (isOrgAdmin && !isOrgDashboard && !isWorkspaceCreate && !isCheckout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-content-tertiary">
        Redirecting to dashboard...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <OrgGate>
        <ClientRouteGuard>
          <NotificationProvider>
            <div className="min-h-screen flex flex-col bg-surface text-content">
              {showTopNavbar && <TopNavbar />}
              <main className="flex-1 flex overflow-hidden">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                  className="flex-1 flex min-w-0"
                >
                  {children || <Outlet />}
                </motion.div>
              </main>
            </div>
          </NotificationProvider>
        </ClientRouteGuard>
      </OrgGate>
    </ProtectedRoute>
  );
}

