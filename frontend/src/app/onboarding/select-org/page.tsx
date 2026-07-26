'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/useOrganization';
import { DASHBOARD_ROUTE } from '@/lib/postAuth';
import type { OrganizationSummary } from '@/types/workspace';
import OrgRoleBadge from '@/components/workspace/OrgRoleBadge';
import { Users, ChevronRight, Plus, Building2, Loader2, Link2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

const PLAN_BADGE: Record<OrganizationSummary['plan'], string> = {
  free: 'bg-surface-hover text-content-secondary',
  pro: 'bg-primary-subtle text-primary',
  business: 'bg-status-review/12 text-status-review',
  enterprise: 'bg-warning/12 text-warning',
};

function OrgCard({
  org,
  index,
  onSelect,
}: {
  org: OrganizationSummary;
  index: number;
  onSelect: (org: OrganizationSummary) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 + index * 0.08, ease: [0.25, 1, 0.5, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(org)}
      className="group w-full flex items-center gap-4 rounded-xl border border-line bg-surface p-4 text-left shadow-card transition-colors hover:border-primary hover:shadow-raised cursor-pointer"
    >
      {/* Logo */}
      {org.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={org.logoUrl}
          alt={org.name}
          className="w-11 h-11 rounded-xl object-cover border border-line shrink-0"
        />
      ) : (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-card">
          {org.name.slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-content truncate">
            {org.name}
          </p>
          <span
            className={`shrink-0 hidden sm:inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLAN_BADGE[org.plan]}`}
          >
            {org.plan}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-content-tertiary">
            <Users className="w-3.5 h-3.5" />
            {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
          </span>
          <OrgRoleBadge role={org.myRole} label={org.myRoleName} />
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-content-tertiary shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </motion.button>
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
      <div className="flex flex-col items-center gap-4 text-content-tertiary">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Setting up your workspace…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      {/* Hero */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-raised"
        >
          <Building2 className="w-8 h-8 text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
          className="text-2xl font-bold text-content"
        >
          Choose an organization
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease: [0.25, 1, 0.5, 1] }}
          className="mt-2 text-sm text-content-tertiary max-w-sm mx-auto"
        >
          You belong to multiple organizations. Select the one you want to work in.
        </motion.p>
      </div>

      {/* Org list */}
      <div className="space-y-3">
        {organizations.map((org, index) => (
          <OrgCard key={org.id} org={org} index={index} onSelect={handleSelect} />
        ))}
      </div>

      {/* Create or Join */}
      <div className="mt-6 pt-5 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/onboarding/create-org"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-line-strong py-3 px-4 text-sm text-content-tertiary hover:border-primary hover:text-primary hover:bg-primary-subtle/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create a new organization
        </Link>
        <Link
          href="/onboarding/join-org"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-dashed border-line-strong py-3 px-4 text-sm text-content-tertiary hover:border-primary hover:text-primary hover:bg-primary-subtle/50 transition-all"
        >
          <Link2 className="w-4 h-4" />
          Join another organization
        </Link>
      </div>
    </div>
  );
}
