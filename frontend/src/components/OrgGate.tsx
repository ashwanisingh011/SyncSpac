'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useOrganization } from '@/context/useOrganization';
import { ONBOARDING_ROUTE } from '@/lib/postAuth';
import { getPendingInviteAcceptPath } from '@/lib/inviteFlow';

/**
 * Ensures protected app routes are only used when the user belongs to an organization.
 * Users with no org are sent through the onboarding flow.
 */
export default function OrgGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { organizations, currentOrg, isOrgReady } = useOrganization();

  useEffect(() => {
    if (!isOrgReady) return;

    if (organizations.length === 0) {
      const pendingInvitePath = getPendingInviteAcceptPath();
      if (pendingInvitePath) {
        router.replace(pendingInvitePath);
        return;
      }
      router.replace(`${ONBOARDING_ROUTE}/no-org`);
      return;
    }

    if (!currentOrg && organizations.length > 1) {
      router.replace(`${ONBOARDING_ROUTE}/select-org`);
    }
  }, [isOrgReady, organizations.length, currentOrg, router]);

  if (!isOrgReady) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        Loading workspace…
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        Setting up your workspace…
      </div>
    );
  }

  if (!currentOrg && organizations.length > 1) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
        Choose an organization…
      </div>
    );
  }

  return <>{children}</>;
}
