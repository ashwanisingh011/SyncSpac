'use client';

import { useMemo } from 'react';
import type { Task } from '@/types/tasks';
import { Layers } from 'lucide-react';

interface DeliverablesSectionProps {
  tasks: Task[];
}

const statusStyles = {
  completed: { label: 'Completed', className: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30' },
  'in-progress': { label: 'In Progress', className: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200/30' },
  upcoming: { label: 'Upcoming', className: 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800' },
} as const;

export default function DeliverablesSection({ tasks }: DeliverablesSectionProps): React.JSX.Element {
  const deliverables = useMemo(() => {
    const groups: Record<string, { total: number; completed: number }> = {};

    tasks.forEach((task) => {
      const type = task.type || 'task';
      if (!groups[type]) {
        groups[type] = { total: 0, completed: 0 };
      }
      groups[type].total += 1;
      if (task.status === 'done') {
        groups[type].completed += 1;
      }
    });

    return Object.entries(groups).map(([type, counts]) => {
      const pct = Math.round((counts.completed / counts.total) * 100);
      let status: 'completed' | 'in-progress' | 'upcoming' = 'upcoming';

      if (counts.completed === counts.total && counts.total > 0) {
        status = 'completed';
      } else if (counts.completed > 0) {
        status = 'in-progress';
      }

      return {
        id: type,
        title: type.toUpperCase() + 'S',
        status,
        total: counts.total,
        completed: counts.completed,
        pct,
      };
    });
  }, [tasks]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-850 pb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
          <Layers className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-805 dark:text-white">Deliverables Progress</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Track milestones by task types</p>
        </div>
      </div>

      {deliverables.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">No deliverables tracked.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {deliverables.map((item) => {
            const status = statusStyles[item.status];
            return (
              <div key={item.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  <span>Progress: {item.completed} / {item.total}</span>
                  <span className="text-slate-700 dark:text-slate-300 font-black">{item.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
