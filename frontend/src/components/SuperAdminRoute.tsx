"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/useAuth';
import { isSuperAdmin } from '@/lib/userRoles';
import { DASHBOARD_ROUTE } from '@/lib/postAuth';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

const SuperAdminRoute = ({ children }: SuperAdminRouteProps): React.JSX.Element => {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isAuthReady) {
      if (!user) {
        router.push('/login');
      } else if (!isSuperAdmin(user.role)) {
        router.push(DASHBOARD_ROUTE);
      }
    }
  }, [user, router, isMounted, isAuthReady]);

  if (!isMounted || !isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Loading...
      </div>
    );
  }

  if (!user || !isSuperAdmin(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Redirecting...
      </div>
    );
  }

  return <>{children}</>;
};

export default SuperAdminRoute;
