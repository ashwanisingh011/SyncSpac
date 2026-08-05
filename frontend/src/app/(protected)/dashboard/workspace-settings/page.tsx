'use client';

/**
 * /dashboard/workspace-settings — Workspace settings page for org-owners.
 */

import WorkspaceSettingsPage from '@/app/(protected)/workspace/settings/page';

export default function DashboardWorkspaceSettingsPage() {
  return (
    <div className="bg-surface rounded-2xl border border-line p-6">
      <WorkspaceSettingsPage />
    </div>
  );
}
