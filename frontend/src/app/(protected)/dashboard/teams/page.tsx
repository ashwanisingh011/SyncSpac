'use client';

/**
 * /dashboard/teams — Teams page for org-owners.
 */

import { useRouter } from 'next/navigation';
import TeamsPage from '@/app/(protected)/workspace/teams/page';

export default function DashboardTeamsPage() {
  const router = useRouter();

  return (
    <div className="bg-surface rounded-2xl border border-line p-6">
      <TeamsPage
        onTeamSelect={(teamId) => router.push(`/dashboard/teams/${teamId}`)}
      />
    </div>
  );
}
