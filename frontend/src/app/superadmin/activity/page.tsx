'use client';

import { useSuperAdmin } from '@/context/superadminContext';
import {
  ScrollText,
  Loader2,
} from 'lucide-react';

export default function SuperAdminActivityPage() {
  const {
    auditLogs,
    loading,
    auditActionFilter,
    setAuditActionFilter,
    auditFromFilter,
    setAuditFromFilter,
    auditToFilter,
    setAuditToFilter,
  } = useSuperAdmin();

  return (
    <div className="bg-transparent sm:bg-white dark:bg-slate-900 border-transparent sm:border sm:border-slate-100 sm:dark:border-slate-800 rounded-xl p-0 sm:p-5 shadow-none sm:shadow-sm space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 sm:border-none rounded-xl sm:rounded-none p-4 sm:p-0 sm:border-b sm:border-slate-100 sm:dark:border-slate-800 sm:pb-3 shadow-sm sm:shadow-none">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Platform Audit Logs</h2>
        </div>

        {/* Filters block */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={auditActionFilter}
            onChange={(e) => setAuditActionFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="ban_user">Ban User</option>
            <option value="unban_user">Activate User</option>
            <option value="suspend_org">Suspend Org</option>
            <option value="activate_org">Activate Org</option>
            <option value="change_plan">Change Plan</option>
            <option value="seed_superadmin">Seed Database</option>
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase">From</span>
            <input
              type="date"
              value={auditFromFilter}
              onChange={(e) => setAuditFromFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg px-2 py-1 outline-none text-slate-655 dark:text-slate-350 cursor-pointer"
            />
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase">To</span>
            <input
              type="date"
              value={auditToFilter}
              onChange={(e) => setAuditToFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg px-2 py-1 outline-none text-slate-655 dark:text-slate-350 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-white rounded-xl border border-slate-100 sm:border-none p-5 shadow-sm sm:shadow-none">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <span className="text-xs mt-1">Loading audit logs...</span>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 sm:border-none p-5 shadow-sm sm:shadow-none mt-4 sm:mt-0">
          <ScrollText className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
          <span className="text-sm font-semibold">No audit logs recorded matching this criteria.</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-black text-xs">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Performed By</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => {
                  const actor = log.performedBy?.name || 'Superadmin';
                  const targetText = log.targetUserId?.name 
                    ? `User: ${log.targetUserId.name}` 
                    : log.targetOrgId?.name 
                    ? `Organization: ${log.targetOrgId.name}` 
                    : '';
                  return (
                    <tr key={log._id || log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          log.action.includes('ban') || log.action.includes('suspend')
                            ? 'bg-red-50 text-red-655 dark:bg-red-950/20 dark:text-red-450'
                            : log.action.includes('unban') || log.action.includes('activate')
                            ? 'bg-emerald-50 text-emerald-655 dark:bg-emerald-950/20 dark:text-emerald-450'
                            : 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400'
                        }`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {actor}
                        <span className="text-[10px] text-slate-450 dark:text-slate-550 font-normal block">{log.performedBy?.email}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-655 dark:text-slate-350 max-w-xs md:max-w-md truncate">
                        <span className="font-semibold block">{log.reason}</span>
                        {targetText && <span className="text-[10px] text-slate-450 dark:text-slate-500">{targetText}</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-550">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4 mt-4">
            {auditLogs.map((log) => {
              const actor = log.performedBy?.name || 'Superadmin';
              const targetText = log.targetUserId?.name 
                ? `User: ${log.targetUserId.name}` 
                : log.targetOrgId?.name 
                ? `Organization: ${log.targetOrgId.name}` 
                : '';
              return (
                <div key={log._id || log.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
                  {/* Action Header */}
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      log.action.includes('ban') || log.action.includes('suspend')
                        ? 'bg-red-50 text-red-655 dark:bg-red-950/20 dark:text-red-450'
                        : log.action.includes('unban') || log.action.includes('activate')
                        ? 'bg-emerald-50 text-emerald-655 dark:bg-emerald-950/20 dark:text-emerald-450'
                        : 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400'
                    }`}>
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Description / Reason */}
                  <div className="text-xs text-slate-700 dark:text-slate-205 leading-relaxed">
                    <span className="font-semibold block text-slate-800 dark:text-white mb-0.5">{log.reason}</span>
                    {targetText && <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{targetText}</span>}
                  </div>

                  {/* Performed By Panel */}
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-2.5 text-[11px] flex justify-between items-center gap-2">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-semibold">Performed By</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{actor}</span>
                    </div>
                    <span className="text-slate-450 dark:text-slate-550 text-[10px]">{log.performedBy?.email}</span>
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
