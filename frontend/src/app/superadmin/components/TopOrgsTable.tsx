'use client';

import { useState, useEffect } from 'react';
import { getPlatformOrganizations, IAdminOrganization } from '@/api/admin';
import { TrendingUp, ExternalLink, Loader2, Building2 } from 'lucide-react';

const planBadge: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pro: 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400',
  business: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  enterprise: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
};

const planRevenue: Record<string, string> = {
  free: '$0',
  pro: '$49',
  business: '$99',
  enterprise: '$299',
};

const statusBadge: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450',
  trial: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450',
  suspended: 'bg-red-50 text-red-655 dark:bg-red-950/20 dark:text-red-450',
};

interface TopOrgsTableProps {
  onNavigateToOrgs?: () => void;
}

export default function TopOrgsTable({ onNavigateToOrgs }: TopOrgsTableProps) {
  const [orgs, setOrgs] = useState<IAdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await getPlatformOrganizations();
        if (res.success) {
          // Sort by user counts descending, select top 5
          const sorted = [...res.data].sort((a, b) => b.users - a.users);
          setOrgs(sorted.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load top organizations list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const getAvatarColor = (name: string) => {
    const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Top Organizations</h3>
          <p className="text-xs text-slate-400 dark:text-slate-450 mt-0.5">By headcount activity and plan tier</p>
        </div>
        <button
          onClick={onNavigateToOrgs}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
        >
          View all <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-white dark:bg-slate-900">
          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
          <span className="text-sm font-semibold">No active workspaces.</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-850">
                  {['Organization', 'Plan', 'Users', 'Est. Revenue', 'Status', 'Growth'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-6 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => {
                  const avatarColor = getAvatarColor(org.name);
                  const initials = org.name.substring(0, 2).toUpperCase();
                  return (
                    <tr
                      key={org.id}
                      className="border-b border-slate-50 dark:border-slate-850 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/10 transition-colors cursor-pointer group"
                    >
                      {/* Org name */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                            style={{ background: avatarColor }}
                          >
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-450 transition-colors">
                            {org.name}
                          </span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-6 py-3.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${planBadge[org.plan] ?? 'bg-slate-100 text-slate-600'}`}>
                          {org.plan}
                        </span>
                      </td>

                      {/* Users */}
                      <td className="px-6 py-3.5">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{org.users.toLocaleString()}</span>
                      </td>

                      {/* Revenue */}
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {planRevenue[org.plan] || '$0'} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/mo</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${statusBadge[org.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {org.status}
                        </span>
                      </td>

                      {/* Growth */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-450">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{(org.projects * 1.5 + 2).toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {orgs.map((org) => {
              const avatarColor = getAvatarColor(org.name);
              const initials = org.name.substring(0, 2).toUpperCase();
              return (
                <div key={org.id} className="p-4 space-y-3 hover:bg-slate-50/70 dark:hover:bg-slate-850/20 transition-colors">
                  {/* Name and plan */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                        style={{ background: avatarColor }}
                      >
                        {initials}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {org.name}
                      </span>
                    </div>

                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${planBadge[org.plan] ?? 'bg-slate-100 text-slate-600'}`}>
                      {org.plan}
                    </span>
                  </div>

                  {/* Stats and metadata */}
                  <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-50 dark:border-slate-800/30 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">Users</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">{org.users.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">Est. Revenue</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-350">
                        {planRevenue[org.plan] || '$0'} <span className="text-[10px] text-slate-450 dark:text-slate-500 font-normal">/mo</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">Status</span>
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${statusBadge[org.status] ?? 'bg-slate-100'}`}>
                        {org.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">Growth</span>
                      <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-450 mt-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{(org.projects * 1.5 + 2).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
