'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/useOrganization';
import { DASHBOARD_ROUTE } from '@/lib/postAuth';
import type { OrganizationSummary } from '@/types/workspace';
import OrgRoleBadge from '@/components/workspace/OrgRoleBadge';
import { Users, ChevronRight, Plus, Building2, Loader2, Link2 } from 'lucide-react';
import Link from 'next/link';

const PLAN_BADGE: Record<OrganizationSummary['plan'], string> = {
  free: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pro: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  business: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  enterprise: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
};

function OrgCard({
  org,
  onSelect,
}: {
  org: OrganizationSummary;
  onSelect: (org: OrganizationSummary) => void;
}) {
  return (
    <button
      onClick={() => onSelect(org)}
      className="group w-full flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-700"
    >
      {/* Logo */}
      {org.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={org.logoUrl}
          alt={org.name}
          className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
        />
      ) : (
        <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {org.name.slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 truncate dark:text-slate-100">
            {org.name}
          </p>
          <span
            className={`shrink-0 hidden sm:inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLAN_BADGE[org.plan]}`}
          >
            {org.plan}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Users className="w-3.5 h-3.5" />
            {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
          </span>
          <OrgRoleBadge role={org.myRole} label={org.myRoleName} />
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
    </button>
  );
}

export default function SelectOrgPage() {
  const router = useRouter();
  const { organizations, setCurrentOrg, isOrgReady } = useOrganization();

  // ── Route guard: redirect if user shouldn't be on this page ──────────────────
  useEffect(() => {
    if (!isOrgReady) return;
    if (organizations.length === 0) {
      // No orgs → go to create/join flow
      router.replace('/onboarding/no-org');
    } else if (organizations.length === 1) {
      // Only 1 org → auto-select and go to dashboard
      const activeOrg = organizations[0];
      setCurrentOrg(activeOrg);
      const isOrgAdmin = activeOrg?.myRole === 'owner' || activeOrg?.myRole === 'admin' || activeOrg?.myRole === 'org_admin';
      const target = isOrgAdmin ? '/dashboard' : DASHBOARD_ROUTE;
      router.replace(target);
    }
  }, [isOrgReady, organizations, router, setCurrentOrg]);

  const handleSelect = (org: OrganizationSummary) => {
    setCurrentOrg(org);
    const isOrgAdmin = org.myRole === 'owner' || org.myRole === 'admin' || org.myRole === 'org_admin';
    const target = isOrgAdmin ? '/dashboard' : DASHBOARD_ROUTE;
    router.push(target);
  };

  // Show spinner while org context loads OR while redirecting
  if (!isOrgReady || organizations.length <= 1) {
    return (
      <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm">Setting up your workspace…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Choose an organization
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          You belong to multiple organizations. Select the one you want to work in.
        </p>
      </div>

      {/* Org list */}
      <div className="space-y-3">
        {organizations.map((org) => (
          <OrgCard key={org.id} org={org} onSelect={handleSelect} />
        ))}
      </div>

      {/* Create or Join */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/onboarding/create-org"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-slate-300 py-3 px-4 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-700 dark:hover:text-blue-400 dark:hover:bg-blue-950/20"
        >
          <Plus className="w-4 h-4 text-slate-400" />
          Create a new organization
        </Link>
        <Link
          href="/onboarding/join-org"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-slate-300 py-3 px-4 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-700 dark:hover:text-blue-400 dark:hover:bg-blue-950/20"
        >
          <Link2 className="w-4 h-4 text-slate-400" />
          Join another organization
        </Link>
      </div>
    </div>
  );
}
