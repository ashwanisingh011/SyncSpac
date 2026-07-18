'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingOrgForm from '@/components/onboarding/OnboardingOrgForm';
import type { WorkspaceFormData } from '@/types/workspace';
import { createWorkspace } from '@/api/workspace';
import { useOrganization } from '@/context/useOrganization';
import { useToast } from '@/context/useToast';
import type { OrganizationSummary, OrgRole } from '@/types/workspace';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { addOrganization } = useOrganization();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: WorkspaceFormData) => {
    setIsLoading(true);
    try {
      const { organization: org } = await createWorkspace(data);
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
      showToast('Workspace created successfully!', 'success');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create workspace.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-xl">
      {/* Back link */}
      <Link
        href="/workspace"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to workspace
      </Link>

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
          submitLabel="Create organization"
          isLoading={isLoading}
        />
      </div>

      {/* Info note */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        By creating a workspace, you agree to the{' '}
        <span className="text-blue-600 hover:underline cursor-pointer dark:text-blue-400">
          Terms of Service
        </span>
        . You will be the workspace owner.
      </p>
    </div>
  );
}
