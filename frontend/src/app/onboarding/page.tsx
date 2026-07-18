'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { DASHBOARD_ROUTE } from '@/lib/postAuth';
import { isSuperAdmin } from '@/lib/userRoles';
import { Loader2 } from 'lucide-react';
import { getPendingInviteAcceptPath } from '@/lib/inviteFlow';

/**
 * /onboarding – entry point after login.
 * Reads org context and routes to the right step.
 *
 * Flow:
 *   no token      → /login
 *   0 orgs        → /onboarding/no-org
 *   1 org         → /workspace  (auto-select done by OrganizationProvider)
 *   >1 org        → /onboarding/select-org
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const { organizations, isOrgReady } = useOrganization();

  useEffect(() => {
    if (!isAuthReady || !isOrgReady) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (isSuperAdmin(user.role)) {
      router.replace('/superadmin');
      return;
    }

    if (organizations.length === 0) {
      const pendingInvitePath = getPendingInviteAcceptPath();
      if (pendingInvitePath) {
        router.replace(pendingInvitePath);
        return;
      }
      router.replace('/onboarding/no-org');
    } else if (organizations.length === 1) {
      const activeOrg = organizations[0];
      const isOrgAdmin = activeOrg?.myRole === 'owner' || activeOrg?.myRole === 'admin' || activeOrg?.myRole === 'org_admin';
      const target = isOrgAdmin ? '/dashboard' : DASHBOARD_ROUTE;
      router.replace(target);
    } else {
      router.replace('/onboarding/select-org');
    }
  }, [isAuthReady, isOrgReady, user, organizations, router]);

  return (
    <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-sm">Setting up your workspace…</p>
    </div>
  );
}
