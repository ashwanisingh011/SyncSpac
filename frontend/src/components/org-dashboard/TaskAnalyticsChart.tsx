'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState, useMemo } from 'react';
import type { Task } from '@/types/tasks';
import type { ISprintData } from '@/types/workspace';

const tabs = ['Task Trend', 'Sprint Performance'];

interface TaskAnalyticsChartProps {
  allTasks: Task[];
  sprints: ISprintData[];
}

export default function TaskAnalyticsChart({ allTasks, sprints }: TaskAnalyticsChartProps) {
  const [tab, setTab] = useState(0);

  // 1. Task Trend (Last 7 Days)
  const taskTrendData = useMemo(() => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = daysOfWeek[date.getDay()];

      // Count tasks created on this day
      const createdCount = allTasks.filter((t) => {
        const createdDate = new Date(t.createdAt);
        return createdDate.toDateString() === date.toDateString();
      }).length;

      // Count tasks completed on this day
      const completedCount = allTasks.filter((t) => {
        if (t.status !== 'done' && t.status !== 'completed') return false;
        const completedDate = new Date(t.updatedAt || t.createdAt);
        return completedDate.toDateString() === date.toDateString();
      }).length;

      return {
        day: dayName,
        created: createdCount,
        completed: completedCount,
      };
    });
  }, [allTasks]);

  // 2. Sprint Performance
  const sprintData = useMemo(() => {
    if (sprints.length === 0) {
      // Fallback baseline mock if no sprints exist yet
      return [
        { sprint: 'S-18', velocity: 42, planned: 50 },
        { sprint: 'S-19', velocity: 48, planned: 50 },
        { sprint: 'S-20', velocity: 51, planned: 52 },
        { sprint: 'S-21', velocity: 45, planned: 48 },
        { sprint: 'S-22', velocity: 54, planned: 55 },
        { sprint: 'S-23', velocity: 39, planned: 55 },
      ];
    }
    return sprints.slice(-6).map((s) => ({
      sprint: s.name,
      planned: s.totalPoints || 10,
      velocity: s.completedPoints || s.velocity || 0,
    }));
  }, [sprints]);

  return (
    <div className="bg-surface rounded border border-line p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-content font-sans">Task Analytics</h3>
          <p className="text-xs text-content-tertiary mt-0.5 font-sans">Weekly completion &amp; sprint velocity</p>
        </div>
        <div className="flex gap-1 bg-surface-hover rounded p-0.5">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-3 py-1 rounded text-xs font-semibold font-sans transition-all ${
                tab === i
                  ? 'bg-surface text-primary shadow-card border border-line'
                  : 'text-content-secondary hover:text-content'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        {tab === 0 ? (
          <AreaChart data={taskTrendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--status-done)" stopOpacity={0.12} />
                <stop offset="95%" stopColor="var(--status-done)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" className="" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--content-tertiary)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--content-tertiary)' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid var(--border-default)', fontSize: 12, backgroundColor: '#ffffff', color: '#1e293b' }} />
            <Area
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#gradCompleted)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="created"
              name="Created"
              stroke="var(--status-done)"
              strokeWidth={2}
              fill="url(#gradCreated)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        ) : (
          <BarChart data={sprintData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" className="" vertical={false} />
            <XAxis dataKey="sprint" tick={{ fontSize: 11, fill: 'var(--content-tertiary)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--content-tertiary)' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '4px', border: '1px solid var(--border-default)', fontSize: 12, backgroundColor: '#ffffff', color: '#1e293b' }} />
            <Bar dataKey="planned" name="Planned" fill="#DEEBFF" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="velocity" name="Velocity" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
