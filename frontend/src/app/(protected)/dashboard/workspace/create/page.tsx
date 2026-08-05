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
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Card */}
      <div className="rounded-2xl border border-line bg-surface p-7 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-content">
              Create your organization
            </h1>
            <p className="text-xs text-content-tertiary">
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
      <p className="text-xs text-content-tertiary">
        By creating a workspace, you agree to the{' '}
        <span className="text-primary hover:underline cursor-pointer">
          Terms of Service
        </span>
        . You will be the workspace owner.
      </p>
    </div>
  );
}
