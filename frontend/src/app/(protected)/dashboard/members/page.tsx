'use client';

/**
 * /dashboard/members — Members page for org-owners.
 */

import MembersPage from '@/app/(protected)/workspace/members/page';

export default function DashboardMembersPage() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
      <MembersPage />
    </div>
  );
}
