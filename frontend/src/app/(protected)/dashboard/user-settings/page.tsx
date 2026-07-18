'use client';

/**
 * /dashboard/user-settings — User profile/settings page for org-owners.
 * Accessible via the profile button in OrgHeader.
 */

import SettingsPage from '@/app/(protected)/settings/page';

export default function DashboardUserSettingsPage() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 sm:p-4">
      <SettingsPage />
    </div>
  );
}
