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
  blue: { bg: 'bg-[#DEEBFF]', icon: 'text-[#0747A6]' },
  violet: { bg: 'bg-status-review/12', icon: 'text-status-review' },
  emerald: { bg: 'bg-success/10', icon: 'text-[#006644]' },
  green: { bg: 'bg-success/10', icon: 'text-[#006644]' },
  amber: { bg: 'bg-[#FFF0B3]', icon: 'text-content' },
  orange: { bg: 'bg-[#FFE2E2]', icon: 'text-[#BF2600]' },
  cyan: { bg: 'bg-primary-subtle', icon: 'text-primary' },
  pink: { bg: 'bg-status-review/12', icon: 'text-status-review' },
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
            className="bg-surface rounded border border-line p-4 hover:border-line-strong hover:bg-surface-sunken/50 transition-all duration-200 cursor-default group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded ${colors.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-4 h-4 ${colors.icon}`} />
              </div>
              {!isNeutral && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPositive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(card.change)}%
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-content tracking-tight">{card.value}</div>
            <div className="text-[11px] text-content-tertiary mt-1 font-medium uppercase tracking-wider">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}
