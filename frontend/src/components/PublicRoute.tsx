"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/useAuth';
import { getPostAuthRouteForUser } from '@/lib/postAuth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps): React.JSX.Element => {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isAuthReady && user !== null) {
      const redirectRoute = getPostAuthRouteForUser(user.role);
      router.replace(redirectRoute);
    }
  }, [user, router, isMounted, isAuthReady]);

  if (!isMounted || !isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8F9] text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Loading…
      </div>
    );
  }

  if (user !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8F9] text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
};

export default PublicRoute;
