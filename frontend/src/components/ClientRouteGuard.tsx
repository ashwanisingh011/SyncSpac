'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { CLIENT_DASHBOARD_ROUTE, isClientUser } from '@/lib/clientAccess';
import { DASHBOARD_ROUTE } from '@/lib/postAuth';

interface ClientRouteGuardProps {
  children: ReactNode;
}

export default function ClientRouteGuard({ children }: ClientRouteGuardProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthReady } = useAuth();
  const { currentOrg, isOrgReady } = useOrganization();

  const isClientDashboard = pathname?.startsWith(CLIENT_DASHBOARD_ROUTE) ?? false;
  const isProfileOrSettings = pathname === '/profile' || pathname === '/settings';
  const isClient = isClientUser(user, currentOrg);

  useEffect(() => {
    if (!isAuthReady || !isOrgReady) return;

    if (isClient && !isClientDashboard && !isProfileOrSettings) {
      router.replace(CLIENT_DASHBOARD_ROUTE);
      return;
    }

    if (!isClient && isClientDashboard) {
      router.replace(DASHBOARD_ROUTE);
    }
  }, [isAuthReady, isOrgReady, isClient, isClientDashboard, router]);

  if (!isAuthReady || !isOrgReady) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        Loading…
      </div>
    );
  }

  if (isClient && !isClientDashboard && !isProfileOrSettings) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        Redirecting to your dashboard…
      </div>
    );
  }

  if (!isClient && isClientDashboard) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
