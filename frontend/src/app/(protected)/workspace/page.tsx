'use client';

import { useState, useEffect } from 'react';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import WorkspaceCard from '@/components/workspace/WorkspaceCard';
import { useOrganization } from '@/context/useOrganization';
import { Plus, Building2, Users, FolderOpen, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getProjects } from '@/api/projects';
import { getProjectTasks } from '@/api/tasks';
import { isCompletedTaskStatus } from '@/lib/taskStatus';
import { usePermission } from '@/hooks/usePermission';

export default function WorkspaceOverviewPage() {
  const { currentOrg, isOrgReady } = useOrganization();
  const { hasPermission } = usePermission();
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [openIssuesCount, setOpenIssuesCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch projects and open issues on mount
  useEffect(() => {
    const fetchWorkspaceStats = async () => {
      if (!currentOrg?.id || isLoadingStats) return;
      
      setIsLoadingStats(true);
      try {
        // Fetch all projects
        const projects = await getProjects(false);
        setProjectsCount(projects.length);

        // Count open issues across all projects
        let openCount = 0;
        for (const project of projects) {
          try {
            const tasks = await getProjectTasks(project._id);
            openCount += tasks.filter((t) => !isCompletedTaskStatus(t.status)).length;
          } catch (err) {
            console.error(`Failed to fetch tasks for project ${project.name}:`, err);
          }
        }
        setOpenIssuesCount(openCount);
      } catch (err) {
        console.error('Failed to fetch workspace stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchWorkspaceStats();
  }, [currentOrg?.id]);

  const stats = [
    {
      label: 'Members',
      value: currentOrg ? String(currentOrg.memberCount) : '—',
      icon: Users,
      color: 'text-primary bg-primary-subtle',
    },
    {
      label: 'Projects',
      value: isLoadingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : String(projectsCount),
      icon: FolderOpen,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400',
    },
    {
      label: 'Open Issues',
      value: isLoadingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : String(openIssuesCount),
      icon: TrendingUp,
      color: 'text-success bg-success/10',
    },
  ];
  const quickActions = [
    ...(hasPermission('invite_members') || hasPermission('manage_members')
      ? [{ label: 'Invite members', href: '/workspace/members', icon: Users, description: 'Grow your team' }]
      : []),
    ...(hasPermission('manage_workspace')
      ? [{ label: 'Workspace settings', href: '/workspace/settings', icon: Building2, description: 'Customize your workspace' }]
      : []),
  ];

  if (!isOrgReady) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-content-tertiary" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Building2 className="w-10 h-10 text-content-tertiary mb-3" />
        <p className="text-sm text-content-tertiary">No organization selected.</p>
        <Link href="/onboarding/create-org" className="mt-4 text-sm text-primary hover:underline">
          Create one →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WorkspaceHeader
        title="Workspace"
        subtitle={`${currentOrg.name} — ${currentOrg.plan} plan`}
        action={
          <Link
            href="/workspace/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-content hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            New workspace
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-content">
                  {typeof s.value === 'string' ? s.value : s.value}
                </p>
                <p className="text-xs text-content-tertiary">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workspace card */}
      <div>
        <h2 className="text-sm font-semibold text-content-tertiary uppercase tracking-wide mb-3">
          Your workspace
        </h2>
        <WorkspaceCard workspace={currentOrg} />
      </div>

      {quickActions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-content-tertiary uppercase tracking-wide mb-3">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-subtle flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-content group-hover:text-blue-700 transition-colors">
                      {q.label}
                    </p>
                    <p className="text-xs text-content-tertiary">{q.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
