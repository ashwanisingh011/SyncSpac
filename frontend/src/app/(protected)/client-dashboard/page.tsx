'use client';

import { useMemo } from 'react';
import { useClientDashboard } from './layout';
import { useOrganization } from '@/context/useOrganization';
import { FolderOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

import ProjectOverviewCard from './components/ProjectOverviewCard';
import TaskStatCards from './components/TaskStatCards';
import ProjectTimeline from './components/ProjectTimeline';
import ProgressDonutChart from './components/ProgressDonutChart';
import RecentUpdates from './components/RecentUpdates';
import DeliverablesSection from './components/DeliverablesSection';
import DocumentsSection from './components/DocumentsSection';

import { getCompletedTaskCount, getTaskStatusCounts } from '@/lib/taskStatus';
import type { Task } from '@/types/tasks';

function computeTaskStats(tasks: Task[]) {
  const completed = getCompletedTaskCount(tasks);
  const total = tasks.length;
  const active = total - completed;
  const progressPercent = total ? Math.round((completed / total) * 100) : 0;
  const statusOverview = getTaskStatusCounts(tasks);

  return { total, completed, active, progressPercent, statusOverview };
}

export default function ClientDashboardOverviewPage(): React.JSX.Element {
  const { currentOrg } = useOrganization();
  const {
    projects,
    selectedProject,
    tasks,
    sprints,
    recentFiles,
  } = useClientDashboard();
  const router = useRouter();

  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpen className="h-12 w-12 text-slate-355 mb-3 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-800">No Active Projects</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Your organization has not assigned any active projects to your workspace yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Project Overview Banner */}
      <ProjectOverviewCard
        project={selectedProject}
        progressPercent={stats.progressPercent}
      />

      {/* 2. Key Metrics Cards */}
      <TaskStatCards stats={stats} />

      {/* 3. Task Status Overview */}
      {/* <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-805 dark:text-white">Task Status Overview</h3>
          <p className="text-xs text-slate-400 dark:text-slate-455 mt-0.5">Summary of task progress in the current cycle</p>
        </div>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
          {stats.statusOverview.map((item) => (
            <div key={item.status} className={`rounded-xl border border-slate-100/50 dark:border-slate-800 border-l-4 px-4 py-3.5 hover:shadow-sm transition-all ${item.color}`}>
              <p className="text-xl font-black">{item.count}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div> */}

      {/* 4. Timeline, Charts & Updates */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ProjectTimeline sprints={sprints} />
        <ProgressDonutChart stats={stats} progressPercent={stats.progressPercent} />
        <RecentUpdates tasks={tasks} orgId={currentOrg?.id || ''} />
      </div>

      {/* 5. Deliverables & Files */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DeliverablesSection tasks={tasks} />
        <DocumentsSection files={recentFiles} onTabChange={() => router.push('/client-dashboard/documents')} />
      </div>
    </div>
  );
}
