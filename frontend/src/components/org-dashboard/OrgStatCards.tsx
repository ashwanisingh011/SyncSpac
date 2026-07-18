'use client';

import {
  FolderOpen,
  CheckSquare,
  Users,
  CheckCircle2,
  Zap,
  AlertCircle,
  TrendingUp,
  Clock,
  TrendingDown,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  folder: FolderOpen,
  'check-square': CheckSquare,
  users: Users,
  'check-circle': CheckCircle2,
  zap: Zap,
  'alert-circle': AlertCircle,
  'trending-up': TrendingUp,
  clock: Clock,
};

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-[#DEEBFF] dark:bg-blue-950/40', icon: 'text-[#0747A6] dark:text-blue-300' },
  violet: { bg: 'bg-[#EAE6FF] dark:bg-purple-950/40', icon: 'text-[#403294] dark:text-purple-300' },
  emerald: { bg: 'bg-[#E3FCEF] dark:bg-emerald-950/40', icon: 'text-[#006644] dark:text-emerald-300' },
  green: { bg: 'bg-[#E3FCEF] dark:bg-green-950/40', icon: 'text-[#006644] dark:text-green-300' },
  amber: { bg: 'bg-[#FFF0B3] dark:bg-amber-950/40', icon: 'text-[#172B4D] dark:text-amber-300' },
  orange: { bg: 'bg-[#FFE2E2] dark:bg-red-950/40', icon: 'text-[#BF2600] dark:text-red-300' },
  cyan: { bg: 'bg-[#DEEBFF] dark:bg-cyan-950/40', icon: 'text-[#0747A6] dark:text-cyan-300' },
  pink: { bg: 'bg-[#EAE6FF] dark:bg-pink-950/40', icon: 'text-[#403294] dark:text-pink-300' },
};

interface OrgStatCardsProps {
  projectsCount: number;
  tasksCount: number;
  membersCount: number;
  completedCount: number;
  activeSprintsCount: number;
  pendingCount: number;
  overdueCount?: number;
  managersCount?: number;
  leadsCount?: number;
  developersCount?: number;
  guestsCount?: number;
}

export default function OrgStatCards({
  projectsCount,
  tasksCount,
  membersCount,
  completedCount,
  activeSprintsCount,
  pendingCount,
  overdueCount = 0,
  managersCount = 0,
  leadsCount = 0,
  developersCount = 0,
  guestsCount = 0,
}: OrgStatCardsProps) {
  const productivity = tasksCount > 0 ? Math.round((completedCount / tasksCount) * 100) : 0;
  // Mock tracking hours based on completed tasks
  const hoursTracked = completedCount * 4;

  const cards = [
    { id: 'projects', label: 'Total Projects', value: String(projectsCount), change: +5.0, icon: 'folder', color: 'blue' },
    { id: 'tasks', label: 'Total Tasks', value: String(tasksCount), change: +8.5, icon: 'check-square', color: 'violet' },
    { id: 'members', label: 'Active Members', value: String(membersCount), change: +2.0, icon: 'users', color: 'emerald' },
    { id: 'completed', label: 'Completed Tasks', value: String(completedCount), change: +15.2, icon: 'check-circle', color: 'green' },
    { id: 'pending', label: 'Pending Tasks', value: String(pendingCount), change: -4.3, icon: 'alert-circle', color: 'amber' },
    { id: 'overdue', label: 'Overdue Tasks', value: String(overdueCount), change: overdueCount > 0 ? -10.0 : 0, icon: 'clock', color: overdueCount > 0 ? 'orange' : 'cyan' },
    { id: 'productivity', label: 'Completion Rate', value: `${productivity}%`, change: +3.5, icon: 'trending-up', color: 'cyan' },
    { id: 'sprints', label: 'Active Sprints', value: String(activeSprintsCount), change: 0, icon: 'zap', color: 'pink' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        const Icon = iconMap[card.icon] ?? FolderOpen;
        const colors = colorMap[card.color];
        const isPositive = card.change > 0;
        const isNeutral = card.change === 0;
        return (
          <div
            key={card.id}
            className="bg-white dark:bg-slate-900 rounded border border-[#DFE1E6] dark:border-slate-800 p-4 hover:border-slate-350 hover:bg-slate-50/30 dark:hover:border-slate-700 transition-all duration-200 cursor-default group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded ${colors.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-4 h-4 ${colors.icon}`} />
              </div>
              {!isNeutral && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPositive ? 'bg-[#E3FCEF] text-[#006644] dark:bg-emerald-950/40 dark:text-[#E3FCEF]' : 'bg-[#FFE2E2] text-[#BF2600] dark:bg-red-950/40 dark:text-[#FFE2E2]'
                }`}>
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(card.change)}%
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-[#091E42] dark:text-white tracking-tight">{card.value}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wider">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}
