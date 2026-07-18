'use client';

/**
 * /dashboard/workspace-settings — Workspace settings page for org-owners.
 */

import WorkspaceSettingsPage from '@/app/(protected)/workspace/settings/page';

export default function DashboardWorkspaceSettingsPage() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 p-6">
      <WorkspaceSettingsPage />
    </div>
  );
}
