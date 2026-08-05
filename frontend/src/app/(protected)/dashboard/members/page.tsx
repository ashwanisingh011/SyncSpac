'use client';

/**
 * /dashboard/members — Members page for org-owners.
 */

import MembersPage from '@/app/(protected)/workspace/members/page';

export default function DashboardMembersPage() {
  return (
    <div className="bg-surface rounded-2xl border border-line p-6">
      <MembersPage />
    </div>
  );
}
