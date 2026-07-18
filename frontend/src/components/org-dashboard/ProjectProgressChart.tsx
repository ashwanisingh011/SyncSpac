'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import type { Project } from '@/types/projects';

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.08) return null;
  // If it's 100% (or very close), render it in the center of the donut hole
  if (percent > 0.99) {
    return (
      <text x={cx} y={cy} fill="currentColor" className="text-slate-800 dark:text-slate-100" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={800}>
        100%
      </text>
    );
  }
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface ProjectProgressChartProps {
  projects: Project[];
}

export default function ProjectProgressChart({ projects }: ProjectProgressChartProps) {
  const projectStatusData = useMemo(() => {
    const counts = {
      'Completed':   projects.filter((p) => p.status === 'completed').length,
      'In Progress': projects.filter((p) => p.status === 'active').length,
      'On Hold':     projects.filter((p) => p.status === 'on-hold').length,
      'Archived':    projects.filter((p) => p.isArchived).length,
    };

    return [
      { name: 'Completed',   value: counts['Completed'],   fill: '#00875A' },
      { name: 'In Progress', value: counts['In Progress'], fill: '#0052CC' },
      { name: 'On Hold',     value: counts['On Hold'],     fill: '#FFAB00' },
      { name: 'Archived',    value: counts['Archived'],    fill: '#42526E' },
    ].filter((d) => d.value > 0);
  }, [projects]);

  const total = projectStatusData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded border border-[#DFE1E6] dark:border-slate-800 p-5 flex flex-col items-center justify-center h-[230px]">
        <p className="text-sm font-semibold text-[#091E42] dark:text-slate-100 mb-1 font-sans">Project Status</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">No projects yet. Create one to see distribution.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-[#DFE1E6] dark:border-slate-800 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#091E42] dark:text-slate-105 font-sans">Project Status</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Distribution of {total} total projects</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-[140px] h-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderLabel}
              >
                {projectStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: unknown) => [`${v} projects`, '']}
                contentStyle={{ borderRadius: '4px', border: '1px solid #DFE1E6', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2.5">
          {projectStatusData.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm" style={{ background: item.fill }} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 font-sans">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 font-sans">{item.value}</span>
              </div>
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(item.value / total) * 100}%`, background: item.fill }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
