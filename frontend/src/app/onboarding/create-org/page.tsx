'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/useOrganization';
import { useToast } from '@/context/useToast';
import { createOrganization } from '@/api/workspace';
import OnboardingOrgForm from '@/components/onboarding/OnboardingOrgForm';
import type { WorkspaceFormData, OrgRole, OrganizationSummary } from '@/types/workspace';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

const ONBOARDING_STEPS = ['Organization details', 'Invite members', 'Start building'];

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
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {ONBOARDING_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden sm:inline text-xs font-medium ${
                i === 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {step}
            </span>
            {i < ONBOARDING_STEPS.length - 1 && (
              <div className="w-8 h-px bg-slate-200 dark:bg-slate-800" />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Create your organization
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This is your team&apos;s home in TaskBridge.
            </p>
          </div>
        </div>

        <OnboardingOrgForm
          onSubmit={handleCreate}
          submitLabel="Create & continue →"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
