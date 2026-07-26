'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Link2 } from 'lucide-react';
import { motion } from 'motion/react';
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
          Welcome to SyncSpac
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18, ease: [0.25, 1, 0.5, 1] }}
          className="mt-2 text-sm text-content-tertiary max-w-xs mx-auto"
        >
          You&apos;re not part of any organization yet. Create a new one or join an
          existing one with an invite link.
        </motion.p>
      </div>

      {/* Option cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Create */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26, ease: [0.25, 1, 0.5, 1] }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/onboarding/create-org')}
          className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-line bg-surface p-7 text-center shadow-card transition-colors hover:border-primary hover:shadow-raised cursor-pointer"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle transition-transform group-hover:scale-110">
            <Plus className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-content">
              Create organization
            </p>
            <p className="mt-1 text-xs text-content-tertiary">
              Start fresh with your own workspace and invite your team.
            </p>
          </div>
          <span className="mt-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-content transition-colors group-hover:bg-primary-hover">
            Get started →
          </span>
        </motion.button>

        {/* Join */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.34, ease: [0.25, 1, 0.5, 1] }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/onboarding/join-org')}
          className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-line bg-surface p-7 text-center shadow-card transition-colors hover:border-line-strong hover:shadow-raised cursor-pointer"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-hover transition-transform group-hover:scale-110">
            <Link2 className="w-7 h-7 text-content-secondary" />
          </div>
          <div>
            <p className="font-semibold text-content">
              Join organization
            </p>
            <p className="mt-1 text-xs text-content-tertiary">
              Have an invite link? Paste it here to join an existing workspace.
            </p>
          </div>
          <span className="mt-1 rounded-lg border border-line px-4 py-2 text-xs font-semibold text-content-secondary transition-colors group-hover:bg-surface-hover">
            Use invite link →
          </span>
        </motion.button>
      </div>

      {/* Decorative progress hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-8 text-center text-xs text-content-tertiary"
      >
        Step 1 of 3 — Set up your organization
      </motion.p>
    </div>
  );
}
