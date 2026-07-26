'use client';

/**
 * /dashboard/teams/[teamId] — Team detail page for org-owners.
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import TeamDetailPageContent from '@/app/(protected)/workspace/teams/[teamId]/TeamDetailPageContent';

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>;
}

export default function DashboardTeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = use(params);
  const router = useRouter();

  return (
    <div className="bg-surface rounded-2xl border border-line p-6">
      <TeamDetailPageContent
        teamId={teamId}
        onBack={() => router.push('/dashboard/teams')}
      />
    </div>
  );
}
