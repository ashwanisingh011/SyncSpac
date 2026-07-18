'use client';

import { CheckCircle2, Calendar, Activity, Zap, Circle } from 'lucide-react';
import type { ISprintData } from '@/types/workspace';

interface ProjectTimelineProps {
  sprints: ISprintData[];
}

export default function ProjectTimeline({ sprints }: ProjectTimelineProps): React.JSX.Element {
  const sortedSprints = [...sprints].sort((a, b) => {
    const da = a.startDate ? new Date(a.startDate).getTime() : 0;
    const db = b.startDate ? new Date(b.startDate).getTime() : 0;
    return da - db;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-5 border-b border-slate-50 dark:border-slate-850 pb-3.5 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Project Timeline</h3>
          <p className="text-xs text-slate-400 mt-0.5">Sprint cycle & phase updates</p>
        </div>
        <Activity className="w-4 h-4 text-indigo-400" />
      </div>

      {sortedSprints.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <p className="text-sm text-slate-500 dark:text-slate-400">No timeline phases scheduled yet.</p>
        </div>
      ) : (
        <div className="relative flex-1">
          {/* Vertical line connector */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800" />

          <ul className="space-y-5">
            {sortedSprints.map((sprint) => {
              const status = sprint.status === 'completed' ? 'completed' : sprint.status === 'active' ? 'active' : 'planned';

              const Icon =
                status === 'completed'
                  ? CheckCircle2
                  : status === 'active'
                    ? Zap
                    : Circle;

              const iconColor =
                status === 'completed'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : status === 'active'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'bg-slate-100 text-slate-450 dark:bg-slate-950/40 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800';

              const dateRange = sprint.startDate && sprint.endDate
                ? `${new Date(sprint.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(sprint.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                : 'Dates unplanned';

              return (
                <li key={sprint._id} className="flex gap-3 relative">
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {sprint.name}
                      </span>
                      {status === 'completed' && (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-950/30">
                          Completed
                        </span>
                      )}
                      {status === 'active' && (
                        <span className="rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-950/30 animate-pulse">
                          In Progress
                        </span>
                      )}
                      {status === 'planned' && (
                        <span className="rounded-full bg-slate-50 dark:bg-slate-850 text-slate-455 dark:text-slate-550 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border border-slate-150 dark:border-slate-800">
                          Scheduled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateRange}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
