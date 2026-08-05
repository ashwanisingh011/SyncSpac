'use client';

/**
 * /dashboard/user-settings — User profile/settings page for org-owners.
 * Accessible via the profile button in OrgHeader.
 */

import SettingsPage from '@/app/(protected)/settings/page';

export default function DashboardUserSettingsPage() {
  return (
    <div className="bg-surface rounded-2xl border border-line p-2 sm:p-4">
      <SettingsPage />
    </div>
  );
}
