'use client';

import { useState } from 'react';
import type { Task } from '@/types/tasks';
import TaskDetailsDialog from './TaskDetailsDialog';
import { Activity } from 'lucide-react';

interface RecentUpdatesProps {
  tasks: Task[];
  orgId: string;
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function getUpdateDescription(status: Task['status']): string {
  switch (status) {
    case 'done':
      return 'Task marked as completed.';
    case 'in-progress':
      return 'Work is currently in progress.';
    case 'review':
      return 'Task is under review.';
    case 'testing':
      return 'Task is in testing phase.';
    case 'blocked':
      return 'Task is currently blocked.';
    default:
      return 'Task status updated.';
  }
}

export default function RecentUpdates({ tasks, orgId }: RecentUpdatesProps): React.JSX.Element {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const updates = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Recent Updates</h3>
          <p className="text-xs text-slate-400 dark:text-slate-450 mt-0.5">Real-time status updates</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <Activity className="w-4 h-4" />
          <span>Live feed</span>
        </div>
      </div>

      {updates.length === 0 ? (
        <p className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">No recent updates yet.</p>
      ) : (
        <ul className="space-y-3.5">
          {updates.map((task) => (
            <li
              key={task._id}
              onClick={() => setSelectedTaskId(task._id)}
              className="flex flex-col gap-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/70 dark:hover:bg-slate-850/40 transition-colors border border-transparent dark:border-slate-850 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-205 hover:text-blue-650 transition-colors line-clamp-1">
                  {task.title}
                </p>
                <span className="shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                  {formatShortDate(task.updatedAt)}
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {getUpdateDescription(task.status)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {selectedTaskId && (
        <TaskDetailsDialog
          taskId={selectedTaskId}
          isOpen={true}
          onClose={() => setSelectedTaskId(null)}
          orgId={orgId}
        />
      )}
    </div>
  );
}
