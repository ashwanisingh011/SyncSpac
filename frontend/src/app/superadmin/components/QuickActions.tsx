'use client';

import { useState } from 'react';
import {
  Building2, UserPlus, FileBarChart2, Shield, Layers, BarChart3,
  Loader2, X, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { createOrganizationByAdmin } from '@/api/admin';

interface QuickActionsProps {
  setActiveItem: (id: string) => void;
  onRefreshStats?: () => void;
}

export default function QuickActions({ setActiveItem, onRefreshStats }: QuickActionsProps) {
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Create Org Form State
  const [orgName, setOrgName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [orgPlan, setOrgPlan] = useState<'free' | 'pro' | 'business' | 'enterprise'>('free');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await createOrganizationByAdmin({
        name: orgName,
        ownerEmail: ownerEmail,
        plan: orgPlan
      });
      if (res.success) {
        setSuccessMsg(res.message || 'Workspace organization created successfully!');
        setOrgName('');
        setOwnerEmail('');
        setOrgPlan('free');
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err: any) {
      console.error('Direct organization creation failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to create organization. Verify owner email exists.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadReport = (type: 'users' | 'orgs') => {
    // Generate a simple CSV mock download
    const headers = type === 'users' ? 'ID,Name,Email,Role,Status,Joined\n' : 'ID,Name,Slug,Plan,Status,Users,Projects\n';
    const row = type === 'users' 
      ? '1,John Doe,john@taskbridge.io,developer,active,2026-06-22\n' 
      : '1,Acme Corporation,acme-corporation,pro,active,12,3\n';
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `taskbridge_platform_${type}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actions = [
    {
      id: 'create-org',
      label: 'Create Organization',
      icon: Building2,
      color: 'from-blue-500 to-blue-600 shadow-blue-200 dark:shadow-none',
      onClick: () => { setCreateOrgOpen(true); setErrorMsg(''); setSuccessMsg(''); }
    },
    {
      id: 'add-admin',
      label: 'Admin Management',
      icon: UserPlus,
      color: 'from-violet-500 to-violet-600 shadow-violet-200 dark:shadow-none',
      onClick: () => setActiveItem('activity') // redirect to activity/logs or general admins
    },
    {
      id: 'reports',
      label: 'Generate Reports',
      icon: FileBarChart2,
      color: 'from-emerald-500 to-emerald-600 shadow-emerald-200 dark:shadow-none',
      onClick: () => setReportOpen(true)
    },
    {
      id: 'security',
      label: 'Security Center',
      icon: Shield,
      color: 'from-red-500 to-red-655 shadow-red-200 dark:shadow-none',
      onClick: () => setSecurityOpen(true)
    },
    {
      id: 'plans',
      label: 'Manage Plans',
      icon: Layers,
      color: 'from-amber-500 to-amber-600 shadow-amber-200 dark:shadow-none',
      onClick: () => setActiveItem('subscriptions')
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      icon: BarChart3,
      color: 'from-cyan-500 to-cyan-600 shadow-cyan-200 dark:shadow-none',
      onClick: () => setActiveItem('dashboard')
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Quick Actions</h3>
        <p className="text-xs text-slate-400 dark:text-slate-450 mt-0.5">Common admin operations</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`
                flex flex-col items-center gap-3 p-4 rounded-xl cursor-pointer
                bg-gradient-to-br ${action.color}
                shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-205 group
              `}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-white text-center leading-tight">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* CREATE ORG MODAL */}
      {createOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Create Organization Workspace
              </h3>
              <button onClick={() => setCreateOrgOpen(false)} className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-350 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-450 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Owner Email address</label>
                <input
                  type="email"
                  required
                  placeholder="owner@company.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Plan Subscription</label>
                <select
                  value={orgPlan}
                  onChange={(e) => setOrgPlan(e.target.value as any)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-705 dark:text-slate-350 focus:outline-none"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro ($49/mo)</option>
                  <option value="business">Business ($99/mo)</option>
                  <option value="enterprise">Enterprise ($299/mo)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCreateOrgOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY CENTER MODAL */}
      {securityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-600" />
                Security & Platform Diagnostics
              </h3>
              <button onClick={() => setSecurityOpen(false)} className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-350 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-350">
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="font-semibold">Node Environment</span>
                <span>{process.env.NODE_ENV || 'development'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="font-semibold">Database Driver</span>
                <span>Mongoose v8.4</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="font-semibold">Cors Whitelist</span>
                <span>http://localhost:3000</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="font-semibold">Global Rate Limiter</span>
                <span>200 req / 15 min per IP</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="font-semibold">Failed Login Logins</span>
                <span className="text-emerald-600 font-bold">Enabled</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSecurityOpen(false)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer text-xs font-semibold"
              >
                Close Security Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERATE REPORTS MODAL */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileBarChart2 className="w-4 h-4 text-emerald-600" />
                Generate Platform Reports
              </h3>
              <button onClick={() => setReportOpen(false)} className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-350 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">Download complete platform summaries in CSV format for analysis.</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => { handleDownloadReport('users'); setReportOpen(false); }}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <UserPlus className="w-6 h-6 text-blue-650 mb-2" />
                Export Platform Users
              </button>
              <button
                onClick={() => { handleDownloadReport('orgs'); setReportOpen(false); }}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Building2 className="w-6 h-6 text-emerald-600 mb-2" />
                Export Organizations
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setReportOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
