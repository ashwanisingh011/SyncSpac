'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Award } from 'lucide-react';

interface TaskStats {
  total: number;
  completed: number;
  active: number;
}

interface ProgressDonutChartProps {
  stats: TaskStats;
  progressPercent: number;
}

const COLORS = {
  completed: '#22c55e',
  active: '#f97316',
};

export default function ProgressDonutChart({
  stats,
  progressPercent,
}: ProgressDonutChartProps): React.JSX.Element {
  const chartData = [
    { name: 'Completed', value: stats.completed, fill: COLORS.completed },
    { name: 'Active', value: stats.active, fill: COLORS.active },
  ].filter((item) => item.value > 0);

  const displayData = chartData.length > 0 ? chartData : [{ name: 'No Tasks', value: 1, fill: '#e2e8f0' }];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-850 pb-3 mb-4 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
          <Award className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Progress Overview</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Distribution of task completions</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-5 sm:flex-row justify-center">
        <div className="relative h-[150px] w-[150px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{progressPercent}%</span>
            <span className="text-[9px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Completed</span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-3">
          {[
            { label: 'Completed', value: stats.completed, color: COLORS.completed },
            { label: 'Active', value: stats.active, color: COLORS.active },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded" style={{ background: item.color }} />
                <span className="font-semibold text-slate-600 dark:text-slate-400">{item.label}</span>
              </div>
              <span className="font-bold text-slate-850 dark:text-slate-200">
                {item.value}
                {stats.total > 0 && (
                  <span className="ml-1 font-medium text-slate-400 dark:text-slate-500 text-[10px]">
                    ({Math.round((item.value / stats.total) * 100)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/20 px-3.5 py-3 text-xs text-blue-700 dark:text-blue-400 font-medium shrink-0">
        The project is on track. Keep up the great work!
      </div>
    </div>
  );
}
