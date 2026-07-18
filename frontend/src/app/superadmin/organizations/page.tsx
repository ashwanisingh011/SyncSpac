'use client';

import { useSuperAdmin } from '@/context/superadminContext';
import {
  Building2,
  Loader2,
  Eye,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function SuperAdminOrganizationsPage() {
  const {
    orgsList,
    loading,
    actionLoadingId,
    setSelectedOrg,
    handleToggleSuspendOrg,
    handleChangePlan,
    orgSearch,
    setOrgSearch,
    orgPlanFilter,
    setOrgPlanFilter,
    orgStatusFilter,
    setOrgStatusFilter,
  } = useSuperAdmin();

  return (
    <div className="bg-transparent sm:bg-white dark:bg-slate-900 border-transparent sm:border sm:border-slate-100 sm:dark:border-slate-800 rounded-xl p-0 sm:p-5 shadow-none sm:shadow-sm space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 sm:border-none rounded-xl sm:rounded-none p-4 sm:p-0 sm:border-b sm:border-slate-100 sm:dark:border-slate-800 sm:pb-3 shadow-sm sm:shadow-none">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Workspace Organizations</h2>
        </div>
        
        {/* Filters block */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orgs..."
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-blue-500 w-44"
            />
          </div>
          <select
            value={orgPlanFilter}
            onChange={(e) => setOrgPlanFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg px-2 py-2 outline-none"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={orgStatusFilter}
            onChange={(e) => setOrgStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-lg px-2 py-2 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {loading && orgsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-white rounded-xl border border-slate-100 sm:border-none p-5 shadow-sm sm:shadow-none">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <span className="text-xs mt-1">Retrieving platform organizations...</span>
        </div>
      ) : orgsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 sm:border-none p-5 shadow-sm sm:shadow-none mt-4 sm:mt-0">
          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
          <span className="text-sm font-semibold">No organizations found.</span>
          <span className="text-xs text-slate-400">Registered platform workspaces will show here.</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-black text-xs">
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Plan Subscription</th>
                  <th className="px-4 py-3">Stats</th>
                  <th className="px-4 py-3">Billing Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orgsList.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-205 block leading-tight">{org.name}</span>
                      <span className="text-xs text-slate-400">slug: {org.slug} &bull; Owner: {org.owner}</span>
                    </td>
                    
                    {/* Plan Change Selector */}
                    <td className="px-4 py-3.5">
                      <select
                        value={org.plan}
                        onChange={(e) => handleChangePlan(org.id, e.target.value as any)}
                        disabled={actionLoadingId === org.id}
                        className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="block font-medium">Users: {org.users}</span>
                      <span className="block">Projects: {org.projects}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        org.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                          : org.status === 'suspended'
                          ? 'bg-red-50 text-red-655 dark:bg-red-950/20 dark:text-red-450'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450'
                      }`}>
                        {org.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedOrg(org)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleToggleSuspendOrg(org.id)}
                        disabled={actionLoadingId === org.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors border cursor-pointer ${
                          org.status === 'suspended'
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-655 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400'
                            : 'bg-red-50 hover:bg-red-100 border-red-100 text-red-655 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400'
                        }`}
                      >
                        {actionLoadingId === org.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : org.status === 'suspended' ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                        {org.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4 mt-4">
            {orgsList.map((org) => (
              <div key={org.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
                {/* Organization Details */}
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-205 block leading-tight text-sm">{org.name}</span>
                  <span className="text-xs text-slate-400 mt-1 block">slug: {org.slug} &bull; Owner: {org.owner}</span>
                </div>

                {/* Plan change & stats row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Plan Subscription</span>
                    <select
                      value={org.plan}
                      onChange={(e) => handleChangePlan(org.id, e.target.value as any)}
                      disabled={actionLoadingId === org.id}
                      className="px-2 py-0.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none cursor-pointer outline-none"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="business">Business</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stats</span>
                    <span className="text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                      Users: {org.users} &bull; Proj: {org.projects}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">Billing Status</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      org.status === 'active'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                        : org.status === 'suspended'
                        ? 'bg-red-50 text-red-655 dark:bg-red-950/20 dark:text-red-450'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450'
                    }`}>
                      {org.status}
                    </span>
                  </div>
                </div>

                {/* Actions Button Bar */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedOrg(org)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-355 cursor-pointer flex-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleToggleSuspendOrg(org.id)}
                    disabled={actionLoadingId === org.id}
                    className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors border cursor-pointer flex-1 ${
                      org.status === 'suspended'
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-655 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400'
                        : 'bg-red-50 hover:bg-red-100 border-red-100 text-red-655 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-450'
                    }`}
                  >
                    {actionLoadingId === org.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : org.status === 'suspended' ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    )}
                    {org.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
