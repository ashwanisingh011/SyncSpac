import {
  Users,
  Building2,
  CheckSquare,
  Zap,
  AlertTriangle,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { IAdminStats } from '@/api/admin';

interface StatCardsProps {
  stats?: IAdminStats | null;
  loading?: boolean;
}

export default function StatCards({ stats, loading = false }: StatCardsProps) {
  const cards = [
    {
      id: 'users',
      label: 'Total Users',
      value: stats?.totalUsers !== undefined ? stats.totalUsers.toLocaleString() : stats?.usersCount !== undefined ? stats.usersCount.toLocaleString() : '...',
      icon: Users,
      color: { bg: 'bg-violet-50 dark:bg-violet-950/20', icon: 'text-violet-600 dark:text-violet-400' },
      change: '+8.7%',
    },
    {
      id: 'orgs',
      label: 'Active Orgs',
      value: stats?.activeOrgs !== undefined ? stats.activeOrgs.toLocaleString() : stats?.orgsCount !== undefined ? stats.orgsCount.toLocaleString() : '...',
      icon: Building2,
      color: { bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-600 dark:text-blue-400' },
      change: '+12.4%',
    },
    {
      id: 'tasks-today',
      label: 'Tasks Created Today',
      value: stats?.tasksToday !== undefined ? stats.tasksToday.toLocaleString() : '...',
      icon: CheckSquare,
      color: { bg: 'bg-indigo-50 dark:bg-indigo-950/20', icon: 'text-indigo-600 dark:text-indigo-400' },
      change: '+18.2%',
    },
    {
      id: 'active-sprints',
      label: 'Active Sprints',
      value: stats?.activeSprints !== undefined ? stats.activeSprints.toLocaleString() : '...',
      icon: Zap,
      color: { bg: 'bg-amber-50 dark:bg-amber-950/20', icon: 'text-amber-600 dark:text-amber-400' },
      change: 'Stable',
    },
    {
      id: 'flagged-issues',
      label: 'Flagged Issues',
      value: stats?.flaggedIssues !== undefined ? stats.flaggedIssues.toLocaleString() : '...',
      icon: AlertTriangle,
      color: { bg: 'bg-red-50 dark:bg-red-950/20', icon: 'text-red-650 dark:text-red-400' },
      change: '-4.2%',
    },
    {
      id: 'mrr',
      label: 'Revenue MRR',
      value: stats?.revenueMRR !== undefined ? `$${stats.revenueMRR.toLocaleString()}` : stats?.monthlyRevenue !== undefined ? `$${stats.monthlyRevenue.toLocaleString()}` : '...',
      icon: DollarSign,
      color: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: 'text-emerald-600 dark:text-emerald-400' },
      change: '+15.3%',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-750 transition-all duration-200 cursor-default group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${card.color.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5 h-5 ${card.color.icon}`} />
              </div>
              <div
                className={`flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400`}
              >
                <TrendingUp className="w-2.5 h-2.5" />
                {card.change}
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{card.value}</div>
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}
