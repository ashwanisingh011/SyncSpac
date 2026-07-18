'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Trophy } from 'lucide-react';
import { useMemo } from 'react';
import type { Task } from '@/types/tasks';
import type { WorkspaceMember } from '@/types/workspace';

interface TeamPerformanceProps {
  allTasks: Task[];
  members: WorkspaceMember[];
}

const colorPalette = [
  '#6366f1', '#0ea5e9', '#f59e0b', '#10b981',
  '#ec4899', '#8b5cf6', '#22d3ee', '#ef4444',
];

function getAvatarColor(name: string, idx: number): string {
  return colorPalette[idx % colorPalette.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export default function TeamPerformance({ allTasks, members }: TeamPerformanceProps) {
  // Aggregate completed task counts per member
  const performers = useMemo(() => {
    const memberMap: Record<string, { name: string; completed: number; pending: number }> = {};

    for (const task of allTasks) {
      const assignee = task.assignedTo;
      if (!assignee) continue;

      let userId: string;
      let userName: string;

      if (typeof assignee === 'object' && assignee !== null) {
        userId = (assignee as { _id: string; name: string })._id;
        userName = (assignee as { _id: string; name: string }).name || 'Unknown';
      } else {
        userId = assignee as string;
        // Try to find member name
        const member = members.find((m) => m.userId === userId);
        userName = member?.name || 'Unknown';
      }

      if (!memberMap[userId]) {
        memberMap[userId] = { name: userName, completed: 0, pending: 0 };
      }

      if (task.status === 'done' || task.status === 'completed') {
        memberMap[userId].completed++;
      } else {
        memberMap[userId].pending++;
      }
    }

    return Object.values(memberMap)
      .filter((m) => m.name !== 'Unknown')
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5)
      .map((m, idx) => {
        const total = m.completed + m.pending;
        const score = total > 0 ? Math.round((m.completed / total) * 100) : 0;
        return { ...m, score, initials: getInitials(m.name), color: getAvatarColor(m.name, idx) };
      });
  }, [allTasks, members]);

  // Workload chart: tasks assigned (pending + in-progress) per member
  const workloadData = useMemo(() => {
    return performers.map((p) => ({
      name: p.name.split(' ')[0] + ' ' + (p.name.split(' ')[1]?.[0] || '') + '.',
      tasks: p.completed + p.pending,
    }));
  }, [performers]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-[#DFE1E6] dark:border-slate-800 p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#091E42] dark:text-slate-105 font-sans">Team Performance</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Top performers &amp; workload distribution</p>
        </div>
        <Trophy className="w-4 h-4 text-amber-400" />
      </div>

      {performers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">
            Assign tasks to team members to see performance data.
          </p>
        </div>
      ) : (
        <>
          {/* Top performers */}
          <div className="space-y-3 mb-5">
            {performers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span
                  className={`text-[11px] font-bold w-4 shrink-0 ${
                    i === 0
                      ? 'text-amber-500'
                      : i === 1
                      ? 'text-slate-400'
                      : i === 2
                      ? 'text-orange-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  #{i + 1}
                </span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: p.color }}
                >
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate font-sans">
                      {p.name}
                    </span>
                    <span className="text-xs font-bold text-[#0052CC] dark:text-blue-400 ml-2 font-sans">
                      {p.score}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0052CC]"
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-sans">
                      {p.completed} done
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workload chart */}
          <div className="border-t border-[#DFE1E6] dark:border-slate-800 pt-4">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 font-sans">
              Team Workload
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={workloadData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" className="dark:stroke-slate-800" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '4px', border: '1px solid #DFE1E6', fontSize: 11 }}
                />
                <Bar dataKey="tasks" fill="#0052CC" radius={[3, 3, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
