'use client';

import { CalendarClock, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useMemo } from 'react';
import type { Task } from '@/types/tasks';

interface DeadlinesWidgetProps {
  allTasks: Task[];
}

const statusConfig = {
  'on-track': { label: 'On Track',  badge: 'bg-[#E3FCEF] text-[#006644] dark:bg-emerald-950/30 dark:text-emerald-300', dot: 'bg-[#006644]' },
  'at-risk':  { label: 'At Risk',   badge: 'bg-[#FFF0B3] text-[#172B4D] dark:bg-amber-950/30 dark:text-amber-300',     dot: 'bg-[#FFAB00] animate-pulse' },
  'overdue':  { label: 'Overdue',   badge: 'bg-[#FFE2E2] text-[#BF2600] dark:bg-red-950/30 dark:text-red-300',             dot: 'bg-[#BF2600] animate-pulse' },
};

function classifyDeadline(daysLeft: number): keyof typeof statusConfig {
  if (daysLeft < 0) return 'overdue';
  if (daysLeft <= 3) return 'at-risk';
  return 'on-track';
}

export default function DeadlinesWidget({ allTasks }: DeadlinesWidgetProps) {
  const deadlines = useMemo(() => {
    const tasksWithDue = allTasks.filter(
      (t) => t.dueDate && t.status !== 'done' && t.status !== 'completed'
    );

    return tasksWithDue
      .map((t) => {
        const daysLeft = Math.ceil(
          (new Date(t.dueDate!).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
        );
        const status = classifyDeadline(daysLeft);
        const projectName = typeof t.project === 'object'
          ? (t.project as { name?: string }).name || ''
          : '';

        return {
          id: t._id,
          label: t.title,
          project: projectName,
          dueDate: new Date(t.dueDate!).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          daysLeft,
          status,
          priority: t.priority,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 6);
  }, [allTasks]);

  const TypeIcon = (status: string) => {
    if (status === 'overdue') return AlertTriangle;
    return CalendarClock;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-[#DFE1E6] dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#091E42] dark:text-slate-105 font-sans">Deadlines &amp; Alerts</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Upcoming &amp; overdue tasks</p>
        </div>
        <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-600" />
      </div>

      {deadlines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-[#006644] mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-455 font-sans">No pending deadlines. Great work!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {deadlines.map((d) => {
            const config = statusConfig[d.status];
            const isOverdue = d.daysLeft < 0;
            const Icon = TypeIcon(d.status);

            return (
              <div
                key={d.id}
                className={`flex items-start gap-3 p-3 rounded transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  isOverdue
                    ? 'border border-[#FFE2E2] dark:border-red-900/30 bg-[#FFE2E2]/15 dark:bg-red-950/10'
                    : 'bg-[#F4F5F7]/40 dark:bg-slate-800/30'
                }`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate font-sans ${
                      isOverdue
                        ? 'text-[#BF2600] dark:text-red-400'
                        : 'text-[#091E42] dark:text-slate-200'
                    }`}
                  >
                    {d.label}
                  </p>
                  {d.project && (
                    <p className="text-[10px] text-[#0052CC] dark:text-blue-400 font-sans mt-0.5">
                      {d.project}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span
                      className={`text-[11px] font-medium font-sans ${
                        isOverdue ? 'text-[#BF2600] dark:text-red-400' : 'text-slate-500 dark:text-slate-450'
                      }`}
                    >
                      {isOverdue
                        ? `${Math.abs(d.daysLeft)}d overdue`
                        : `${d.daysLeft}d left`}{' '}
                      &middot; {d.dueDate}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap font-sans ${config.badge}`}
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
