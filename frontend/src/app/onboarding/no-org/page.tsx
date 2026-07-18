'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Link2 } from 'lucide-react';
import { useOrganization } from '@/context/useOrganization';
import { DASHBOARD_ROUTE } from '@/lib/postAuth';
import { getPendingInviteAcceptPath } from '@/lib/inviteFlow';

export default function NoOrgPage() {
  const router = useRouter();
  const { organizations, setCurrentOrg, isOrgReady } = useOrganization();

  // ── Route guard: if user already has org(s), redirect them ──────────────────
  useEffect(() => {
    if (!isOrgReady) return;
    const pendingInvitePath = getPendingInviteAcceptPath();
    if (pendingInvitePath) {
      router.replace(pendingInvitePath);
      return;
    }
    if (organizations.length === 1) {
      setCurrentOrg(organizations[0]);
      router.replace(DASHBOARD_ROUTE);
    } else if (organizations.length > 1) {
      router.replace('/onboarding/select-org');
    }
  }, [isOrgReady, organizations, router, setCurrentOrg]);

  return (
    <div className="w-full max-w-lg">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome to TaskBridge
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          You&apos;re not part of any organization yet. Create a new one or join an
          existing one with an invite link.
        </p>
      </div>

      {/* Option cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Create */}
        <button
          onClick={() => router.push('/onboarding/create-org')}
          className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-7 text-center transition-all hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-600"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 transition-colors group-hover:bg-blue-100 dark:bg-blue-950/50 dark:group-hover:bg-blue-950">
            <Plus className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Create organization
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Start fresh with your own workspace and invite your team.
            </p>
          </div>
          <span className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-blue-700">
            Get started →
          </span>
        </button>

        {/* Join */}
        <button
          onClick={() => router.push('/onboarding/join-org')}
          className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-7 text-center transition-all hover:border-slate-400 hover:shadow-lg hover:shadow-slate-200/60 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-600"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 transition-colors group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700">
            <Link2 className="w-7 h-7 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Join organization
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Have an invite link? Paste it here to join an existing workspace.
            </p>
          </div>
          <span className="mt-1 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors group-hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:group-hover:bg-slate-900">
            Use invite link →
          </span>
        </button>
      </div>

      {/* Decorative progress hint */}
      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
        Step 1 of 3 — Set up your organization
      </p>
    </div>
  );
}
