'use client';

/**
 * /dashboard/projects/[projectKey] — Project detail page for org-owners.
 * Wraps the same ProjectDetailWrapper tabs (Board, Backlog, Files, Reports, Recurring, Settings)
 * that were previously shown inline in OrgDashboard.
 */

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  KanbanSquare,
  ListTodo,
  Settings as SettingsIcon,
  ArrowLeft,
  FileText,
  RefreshCw,
  BarChart2,
} from 'lucide-react';

import BoardPageContent from '@/app/(protected)/projects/[projectKey]/board/BoardPageContent';
import BacklogPageContent from '@/app/(protected)/projects/[projectKey]/backlog/BacklogPageContent';
import ProjectSettingsPageContent from '@/app/(protected)/projects/[projectKey]/settings/ProjectSettingsPageContent';
import ProjectFilesPageContent from '@/app/(protected)/projects/[projectKey]/files/ProjectFilesPageContent';
import RecurringPageContent from '@/app/(protected)/projects/[projectKey]/recurring/RecurringPageContent';
import ProjectReportsPageContent from '@/app/(protected)/projects/[projectKey]/reports/ProjectReportsPageContent';
import { ProjectDataProvider } from '@/context/projectDataContext';

interface ProjectDetailPageProps {
  params: Promise<{ projectKey: string }>;
}

type ProjectTab = 'board' | 'backlog' | 'files' | 'reports' | 'recurring' | 'settings';

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectKey } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProjectTab>('board');

  const tabs = [
    { id: 'board',     label: 'Board',     icon: KanbanSquare },
    { id: 'backlog',   label: 'Backlog',   icon: ListTodo },
    { id: 'files',     label: 'Files',     icon: FileText },
    { id: 'reports',   label: 'Reports',   icon: BarChart2 },
    { id: 'recurring', label: 'Recurring', icon: RefreshCw },
    { id: 'settings',  label: 'Settings',  icon: SettingsIcon },
  ];

  return (
    <div className="space-y-4">
      {/* Sub Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="p-1.5 rounded-lg border border-line hover:bg-surface-hover text-content-tertiary hover:text-content transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-content">{projectKey} Project Space</h2>
            <p className="text-xs text-content-tertiary">Full project management — board, backlog, files, reports, recurring tasks &amp; settings.</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as ProjectTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface text-indigo-700 shadow-sm'
                    : 'text-content-tertiary hover:text-content'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main tab panel */}
      <div className="mt-2 bg-surface rounded-2xl p-4 border border-line">
        <ProjectDataProvider projectKey={projectKey}>
          {activeTab === 'board'     && <BoardPageContent projectKey={projectKey} issueUrlPrefix="/dashboard/projects" />}
          {activeTab === 'backlog'   && <BacklogPageContent projectKey={projectKey} issueUrlPrefix="/dashboard/projects" />}
          {activeTab === 'settings'  && <ProjectSettingsPageContent projectKey={projectKey} />}
          {activeTab === 'recurring' && <RecurringPageContent projectKey={projectKey} />}
        </ProjectDataProvider>
        {/* Files and Reports don't require ProjectDataProvider */}
        {activeTab === 'files'   && <ProjectFilesPageContent projectKey={projectKey} />}
        {activeTab === 'reports' && <ProjectReportsPageContent projectKey={projectKey} />}
      </div>
    </div>
  );
}
