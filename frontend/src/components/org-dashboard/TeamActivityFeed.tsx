'use client';

import {
  CheckCircle2,
  Zap,
  MessageCircle,
  RefreshCw,
  Clock,
  PlusCircle,
} from 'lucide-react';
import { useMemo } from 'react';
import type { Task } from '@/types/tasks';

interface TeamActivityFeedProps {
  allTasks: Task[];
}

// Simple palette of colors for member avatars
const colorPalette = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ec4899', '#8b5cf6', '#ef4444', '#22d3ee',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function formatTimeAgo(dateStr: string): string {
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TeamActivityFeed({ allTasks }: TeamActivityFeedProps) {
  // Build a synthetic activity feed from recent task events
  const activities = useMemo(() => {
    const sorted = [...allTasks]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8);

    return sorted.map((task) => {
      const isCompleted = task.status === 'done' || task.status === 'completed';
      const assignee = task.assignedTo;
      let userName = 'Team member';
      if (typeof assignee === 'object' && assignee !== null) {
        userName = (assignee as { name?: string }).name || 'Team member';
      }

      const projectName = typeof task.project === 'object'
        ? (task.project as { name?: string }).name || ''
        : '';

      return {
        id: task._id,
        icon: isCompleted ? 'check-circle' : task.status === 'in-progress' ? 'zap' : 'refresh-cw',
        color: isCompleted ? 'emerald' : task.status === 'in-progress' ? 'violet' : 'blue',
        user: userName,
        userInitials: getInitials(userName),
        userColor: getAvatarColor(userName),
        message: isCompleted ? 'completed task' : task.status === 'in-progress' ? 'started working on' : 'updated',
        detail: task.title,
        project: projectName,
        time: formatTimeAgo(task.updatedAt),
      };
    });
  }, [allTasks]);

  const iconMap: Record<string, React.ElementType> = {
    'check-circle':   CheckCircle2,
    'zap':            Zap,
    'message-circle': MessageCircle,
    'refresh-cw':     RefreshCw,
    'plus-circle':    PlusCircle,
  };

  const colorMap: Record<string, { bg: string; icon: string }> = {
    emerald: { bg: 'bg-[#E3FCEF] dark:bg-emerald-950/40', icon: 'text-[#006644] dark:text-emerald-300' },
    violet:  { bg: 'bg-[#EAE6FF] dark:bg-purple-950/40',   icon: 'text-[#403294] dark:text-purple-300'   },
    blue:    { bg: 'bg-[#DEEBFF] dark:bg-blue-950/40',       icon: 'text-[#0747A6] dark:text-blue-300'       },
    indigo:  { bg: 'bg-[#DEEBFF] dark:bg-indigo-950/40',   icon: 'text-[#0747A6] dark:text-indigo-300'   },
    amber:   { bg: 'bg-[#FFF0B3] dark:bg-amber-950/40',     icon: 'text-[#172B4D] dark:text-amber-300'     },
    green:   { bg: 'bg-[#E3FCEF] dark:bg-green-950/40',     icon: 'text-[#006644] dark:text-green-300'     },
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-[#DFE1E6] dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#091E42] dark:text-slate-105 font-sans">Team Activity</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Latest workspace events</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">No recent activity yet.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[#DFE1E6] dark:bg-slate-800" />
          <ul className="space-y-4">
            {activities.map((activity) => {
              const Icon = iconMap[activity.icon] ?? CheckCircle2;
              const colors = colorMap[activity.color] ?? colorMap.blue;
              return (
                <li key={activity.id} className="flex gap-3 relative">
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ background: activity.userColor }}
                      >
                        {activity.userInitials}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-sans">
                        {activity.user}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-450 font-sans">
                        {activity.message}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-350 mt-0.5 truncate font-medium font-sans">
                      {activity.detail}
                    </p>
                    {activity.project && (
                      <p className="text-[10px] text-[#0052CC] dark:text-blue-400 mt-0.5 font-sans">
                        {activity.project}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                        {activity.time}
                      </span>
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
