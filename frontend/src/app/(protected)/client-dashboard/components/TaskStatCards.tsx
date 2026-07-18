'use client';

import { ListTodo, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface TaskStats {
  total: number;
  completed: number;
  active: number;
}

interface TaskStatCardsProps {
  stats: TaskStats;
}

function pct(value: number, total: number): string {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export default function TaskStatCards({ stats }: TaskStatCardsProps): React.JSX.Element {
  const cards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      sub: 'All project tasks',
      icon: ListTodo,
      color: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600 dark:text-blue-400' },
      change: '100%',
    },
    {
      label: 'Completed Tasks',
      value: stats.completed,
      sub: `${pct(stats.completed, stats.total)} of total`,
      icon: CheckCircle2,
      color: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: 'text-emerald-600 dark:text-emerald-400' },
      change: pct(stats.completed, stats.total),
    },
    {
      label: 'Active Tasks',
      value: stats.active,
      sub: `${pct(stats.active, stats.total)} of total`,
      icon: Clock,
      color: { bg: 'bg-amber-50 dark:bg-amber-950/20', icon: 'text-amber-600 dark:text-amber-450' },
      change: pct(stats.active, stats.total),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-750 transition-all duration-200 cursor-default group"
          >
            <div className="flex items-start justify-between mb-5">
              <div className={`w-10 h-10 rounded-xl ${card.color.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5.5 h-5.5 ${card.color.icon}`} />
              </div>
              <div
                className={`flex items-center gap-0.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-950/30 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800`}
              >
                <TrendingUp className="w-3 h-3 text-slate-400" />
                {card.change}
              </div>
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{card.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">{card.label}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
