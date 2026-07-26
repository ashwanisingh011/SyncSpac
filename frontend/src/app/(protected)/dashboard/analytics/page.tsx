'use client';

/**
 * /dashboard/analytics — Analytics view for org-owners.
 */

import { useOrgDashboard } from '@/context/orgDashboardContext';
import { useOrganization } from '@/context/useOrganization';
import OrgAnalyticsView from '@/components/org-dashboard/OrgAnalyticsView';

export default function AnalyticsPage() {
  const { allTasks, projects, members } = useOrgDashboard();
  const { currentOrg } = useOrganization();

  const isAnalyticsIncluded = currentOrg?.subscriptionStatus?.limits?.analytics ?? true;

  if (!isAnalyticsIncluded) {
    return (
      <div className="bg-surface rounded-3xl p-8 border border-line text-center space-y-6 max-w-xl mx-auto mt-10 font-sans shadow-xl">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-md">
          📊
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-content">Advanced Analytics &amp; Reports</h2>
          <p className="text-xs text-content-tertiary leading-relaxed max-w-md mx-auto">
            Advanced analytics, performance charts, and sprint velocity reports are not available on your current plan ({currentOrg?.subscriptionStatus?.planName || 'Free'}).
          </p>
        </div>
        <a
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 py-2.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-xs transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
        >
          Upgrade Subscription
        </a>
      </div>
    );
  }

  return (
    <OrgAnalyticsView
      allTasks={allTasks}
      projects={projects}
      members={members}
    />
  );
}

