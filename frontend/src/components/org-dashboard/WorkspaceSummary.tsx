'use client';

import { Database, Plug2, Zap, HeartPulse } from 'lucide-react';
import { useMemo } from 'react';
import { useOrganization } from '@/context/useOrganization';
import type { Project } from '@/types/projects';
import type { Task } from '@/types/tasks';
import type { WorkspaceMember } from '@/types/workspace';
import Link from 'next/link';

interface WorkspaceSummaryProps {
  projects: Project[];
  allTasks: Task[];
  members: WorkspaceMember[];
  onManageSettings?: () => void;
}

function UsageBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  );
}

export default function WorkspaceSummary({ projects, allTasks, members, onManageSettings }: WorkspaceSummaryProps) {
  const { currentOrg } = useOrganization();

  const planColors: Record<string, string> = {
    free:       'bg-[#DFE1E6] text-[#42526E] dark:bg-slate-800 dark:text-slate-355',
    basic:      'bg-[#DEEBFF] text-[#0747A6] dark:bg-blue-950/30 dark:text-blue-300',
    pro:        'bg-[#DEEBFF] text-[#0747A6] dark:bg-blue-950/30 dark:text-blue-300',
    enterprise: 'bg-[#E3FCEF] text-[#006644] dark:bg-emerald-950/30 dark:text-emerald-300',
  };

  const plan = (currentOrg?.plan ?? 'free').toLowerCase();
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const wsInitials = currentOrg?.name ? currentOrg.name.substring(0, 2).toUpperCase() : 'AC';

  // Dynamic "storage used" proxy: (projects count / max_projects) * 100
  const maxProjects = plan === 'free' ? 5 : plan === 'basic' ? 15 : 100;
  const storageUsed = Math.min(Math.round((projects.length / maxProjects) * 100), 100);

  // Compute dynamic health score based on task completion and overdue rates
  const healthScore = useMemo(() => {
    const total = allTasks.length;
    if (total === 0) return 100;
    const completed = allTasks.filter((t) => t.status === 'done' || t.status === 'completed').length;
    const overdue = allTasks.filter((t) => {
      return t.dueDate && t.status !== 'done' && t.status !== 'completed'
        && new Date(t.dueDate) < new Date();
    }).length;
    const completionScore = (completed / total) * 70;
    const overdueScore = Math.max(0, 30 - (overdue / total) * 30);
    return Math.round(completionScore + overdueScore);
  }, [allTasks]);

  // AI credits proxy: pending tasks vs total
  const pendingCount = allTasks.filter((t) => t.status !== 'done' && t.status !== 'completed').length;
  const aiCreditsUsed = allTasks.length > 0 ? Math.round((pendingCount / allTasks.length) * 80) : 20;

  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-[#DFE1E6] dark:border-slate-800 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#091E42] dark:text-slate-105 font-sans">Workspace Summary</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Usage, plan &amp; health</p>
      </div>

      {/* Plan pill */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded border border-[#DFE1E6] bg-[#F4F5F7]/50 dark:bg-slate-800/40 dark:border-slate-800">
        <div className="w-9 h-9 rounded bg-[#0052CC] flex items-center justify-center text-white text-[11px] font-bold">
          {wsInitials}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#091E42] dark:text-slate-202 font-sans">
            {currentOrg?.name || 'Workspace'}
          </p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full font-sans ${planColors[plan] ?? planColors.free}`}>
            {planLabel} Plan
          </span>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">Members</p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans">{members.length}</p>
        </div>
      </div>

      {/* Usage bars */}
      <div className="space-y-3.5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-slate-450" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans">Projects Used</span>
            </div>
            <span className={`text-xs font-bold font-sans ${storageUsed > 80 ? 'text-red-600 dark:text-red-400' : 'text-[#0052CC] dark:text-blue-400'}`}>
              {projects.length}/{maxProjects}
            </span>
          </div>
          <UsageBar value={storageUsed} color={storageUsed > 80 ? '#BF2600' : '#0052CC'} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-slate-450" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans">Pending Tasks</span>
            </div>
            <span className={`text-xs font-bold font-sans ${aiCreditsUsed > 80 ? 'text-amber-600 dark:text-amber-400' : 'text-[#6554C0] dark:text-purple-400'}`}>
              {pendingCount}/{allTasks.length}
            </span>
          </div>
          <UsageBar value={aiCreditsUsed} color={aiCreditsUsed > 80 ? '#FFAB00' : '#6554C0'} />
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-[#DFE1E6] dark:border-slate-800">
        <div className="flex items-center gap-2.5 p-2.5 rounded border border-[#DFE1E6] bg-[#F4F5F7]/30 dark:bg-slate-800/40 dark:border-slate-800">
          <Plug2 className="w-4 h-4 text-[#0052CC] shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#091E42] dark:text-white font-sans">{members.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-450 font-sans">Members</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 rounded border border-[#DFE1E6] bg-[#F4F5F7]/30 dark:bg-slate-800/40 dark:border-slate-800">
          <HeartPulse className="w-4 h-4 text-[#006644] shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#091E42] dark:text-white font-sans">{healthScore}%</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-455 font-sans">Health Score</p>
          </div>
        </div>
      </div>

      {onManageSettings ? (
        <button
          onClick={onManageSettings}
          className="mt-4 w-full flex items-center justify-center py-2 rounded border border-[#DFE1E6] bg-[#F4F5F7] hover:bg-[#EBECF0] text-xs font-semibold text-[#42526E] transition-colors font-sans cursor-pointer"
        >
          Manage Workspace Settings
        </button>
      ) : (
        <Link
          href="/dashboard/workspace-settings"
          className="mt-4 w-full flex items-center justify-center py-2 rounded border border-[#DFE1E6] bg-[#F4F5F7] hover:bg-[#EBECF0] text-xs font-semibold text-[#42526E] transition-colors font-sans"
        >
          Manage Workspace Settings
        </Link>
      )}
    </div>
  );
}
