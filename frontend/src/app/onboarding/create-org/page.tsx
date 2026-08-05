'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/useOrganization';
import { useToast } from '@/context/useToast';
import { createOrganization } from '@/api/workspace';
import OnboardingOrgForm from '@/components/onboarding/OnboardingOrgForm';
import StepIndicator from '@/components/onboarding/StepIndicator';
import type { WorkspaceFormData, OrgRole, OrganizationSummary } from '@/types/workspace';
import { ArrowLeft, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function CreateOrgPage() {
  const router = useRouter();
  const { addOrganization } = useOrganization();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: WorkspaceFormData) => {
    setIsLoading(true);
    try {
      const { organization: org } = await createOrganization(data);

      const summary: OrganizationSummary = {
        id: org._id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl ?? (org as { logo?: string }).logo,
        plan: org.plan ?? 'free',
        memberCount: 1,
        myRole: 'owner' as OrgRole,
      };

      addOrganization(summary);
      showToast(`"${org.name}" created! You are the workspace owner.`, 'success');
      router.push('/onboarding/invite-team');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      const message =
        status === 429
          ? 'Too many requests — please wait a moment and try again.'
          : apiMsg ?? (err instanceof Error ? err.message : 'Failed to create organization.');

      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      {/* Back */}
      <Link
        href="/onboarding/no-org"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Step indicator */}
      <StepIndicator current={0} className="mb-6" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="rounded-2xl border border-line bg-surface p-7 shadow-raised"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.12 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle"
          >
            <Building2 className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-lg font-semibold text-content">
              Create your organization
            </h1>
            <p className="text-xs text-content-tertiary">
              This is your team&apos;s home in SyncSpac.
            </p>
          </div>
        </div>

        <OnboardingOrgForm
          onSubmit={handleCreate}
          submitLabel="Create & continue →"
          isLoading={isLoading}
        />
      </motion.div>
    </div>
  );
}
