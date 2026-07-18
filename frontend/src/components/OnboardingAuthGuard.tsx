'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { isSuperAdmin } from '@/lib/userRoles';

/**
 * Ensures onboarding pages are only reachable when authenticated.
 */
export default function OnboardingAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (isSuperAdmin(user.role)) {
      router.replace('/superadmin');
      return;
    }
  }, [isAuthReady, user, router]);

  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (!user || isSuperAdmin(user.role)) {
    return (
      <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm">{!user ? 'Redirecting to login…' : 'Redirecting to admin dashboard…'}</p>
      </div>
    );
  }

  return <>{children}</>;
}
