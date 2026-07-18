'use client';

import { Monitor, Calendar, ArrowUpRight, Sparkles } from 'lucide-react';
import type { Project } from '@/types/projects';

interface ProjectOverviewCardProps {
  project: Project | null;
  progressPercent: number;
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusBadge(status?: Project['status']): { label: string; className: string } {
  switch (status) {
    case 'completed':
      return { label: 'Completed', className: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30' };
    case 'on-hold':
      return { label: 'On Hold', className: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30' };
    default:
      return { label: 'In Progress', className: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-450 border border-indigo-200/50 dark:border-indigo-900/30' };
  }
}

export default function ProjectOverviewCard({
  project,
  progressPercent,
}: ProjectOverviewCardProps): React.JSX.Element {
  const name = project?.name ?? 'No Project Assigned';
  const description =
    project?.description ??
    'Select a project from the header to display details, timelines, and files.';
  const startDate = project?.createdAt ? formatDisplayDate(project.createdAt) : '—';

  // Calculate expected delivery date dynamically (creation + 30 days)
  const expectedDelivery = project?.createdAt
    ? formatDisplayDate(new Date(new Date(project.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())
    : '—';

  const statusBadge = getStatusBadge(project?.status);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/60 to-blue-50/40 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950/40 p-6 shadow-[0_4px_24px_rgba(59,130,246,0.04)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(59,130,246,0.08)] hover:-translate-y-0.5">
      {/* Decorative background blur blobs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-indigo-100/30 dark:bg-indigo-900/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {/* Active project badge indicator */}
          <div className="mb-3.5 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 font-mono">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Active Project Context
            </span>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm">
              <Monitor className="h-5.5 w-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {name}
                </h2>
                {project && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {description}
              </p>

              {project && (
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-450 dark:text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-semibold text-slate-600 dark:text-slate-450">Start Date:</span> {startDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span className="font-semibold text-slate-600 dark:text-slate-450">Expected Delivery:</span> {expectedDelivery}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {project && (
          <div className="w-full shrink-0 lg:w-60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-sm">
            <div className="mb-2 flex items-end justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-450">Overall Progress</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450">{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-850">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450">Project On Track</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
