'use client';

import {
  Building2, ArrowUp, UserPlus, CheckCircle2, Flag,
  ShieldX, UserCog, Clock, Loader2
} from 'lucide-react';
import { IAdminAuditLog } from '@/api/admin';

const iconMap: Record<string, React.ElementType> = {
  building: Building2,
  'arrow-up': ArrowUp,
  'user-plus': UserPlus,
  'check-circle': CheckCircle2,
  flag: Flag,
  'shield-x': ShieldX,
  'user-cog': UserCog,
};

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue:    { bg: 'bg-blue-100 dark:bg-blue-950/40',    icon: 'text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', icon: 'text-emerald-600 dark:text-emerald-400' },
  violet:  { bg: 'bg-violet-100 dark:bg-violet-950/40',  icon: 'text-violet-600 dark:text-violet-400' },
  green:   { bg: 'bg-green-100 dark:bg-green-950/40',   icon: 'text-green-600 dark:text-green-400' },
  amber:   { bg: 'bg-amber-100 dark:bg-amber-950/40',   icon: 'text-amber-600 dark:text-amber-400' },
  red:     { bg: 'bg-red-100 dark:bg-red-950/40',     icon: 'text-red-600 dark:text-red-400' },
  indigo:  { bg: 'bg-indigo-100 dark:bg-indigo-950/40',  icon: 'text-indigo-600 dark:text-indigo-400' },
};

const getLogMeta = (action: string) => {
  switch (action) {
    case 'ban_user':
      return { icon: 'shield-x', color: 'red' };
    case 'unban_user':
      return { icon: 'check-circle', color: 'emerald' };
    case 'suspend_org':
      return { icon: 'shield-x', color: 'red' };
    case 'activate_org':
      return { icon: 'check-circle', color: 'emerald' };
    case 'change_plan':
      return { icon: 'arrow-up', color: 'emerald' };
    case 'seed_superadmin':
      return { icon: 'user-cog', color: 'indigo' };
    default:
      return { icon: 'building', color: 'blue' };
  }
};

const formatLogMessage = (log: IAdminAuditLog) => {
  const actor = log.performedBy?.name || 'Superadmin';
  const targetUser = log.targetUserId?.name || 'User';
  const targetOrg = log.targetOrgId?.name || 'Workspace';

  switch (log.action) {
    case 'ban_user':
      return `${actor} banned user account of ${targetUser}`;
    case 'unban_user':
      return `${actor} activated user account of ${targetUser}`;
    case 'suspend_org':
      return `${actor} suspended workspace organization ${targetOrg}`;
    case 'activate_org':
      return `${actor} reactivated workspace organization ${targetOrg}`;
    case 'change_plan':
      const newPlan = String(log.meta?.newPlan || 'new tier');
      return `${actor} changed plan of ${targetOrg} to ${newPlan.toUpperCase()}`;
    case 'seed_superadmin':
      return `${actor} seeded system platform roles & admin`;
    default:
      return log.reason || `${actor} executed admin action: ${log.action}`;
  }
};

interface ActivityFeedProps {
  logs?: IAdminAuditLog[] | null;
  onNavigateToActivity?: () => void;
}

export default function ActivityFeed({ logs, onNavigateToActivity }: ActivityFeedProps) {
  const displayLogs = logs && logs.length > 0 ? logs.slice(0, 5) : [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Recent Activity</h3>
          <p className="text-xs text-slate-400 dark:text-slate-450 mt-0.5">Latest platform events</p>
        </div>
        <button
          onClick={onNavigateToActivity}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
        >
          View all logs
        </button>
      </div>

      <div className="relative">
        {displayLogs.length > 0 && (
          /* Vertical line */
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
        )}

        {displayLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-white dark:bg-slate-900">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
            <span className="text-sm font-semibold">No recent activity logs.</span>
          </div>
        ) : (
          <ul className="space-y-4">
            {displayLogs.map((log) => {
              const key = log._id || log.id || '';
              const meta = getLogMeta(log.action);
              const Icon = iconMap[meta.icon] || CheckCircle2;
              const colors = colorMap[meta.color] || colorMap.green;

              const title = formatLogMessage(log);
              const subtitle = log.reason || 'No description provided';
              const timeText = new Date(log.createdAt).toLocaleString();

              return (
                <li key={key} className="flex gap-4 relative">
                  <div className={`relative z-10 w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-205 leading-tight">{title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 truncate">{subtitle}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-2.5 h-2.5 text-slate-350 dark:text-slate-600" />
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">{timeText}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
