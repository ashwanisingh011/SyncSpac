'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSuperAdmin } from '@/context/superadminContext';
import Sidebar from './Sidebar';
import Header from './Header';
import {
  Users as UsersIcon,
  Building2,
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface SuperAdminLayoutShellProps {
  children: React.ReactNode;
}

export default function SuperAdminLayoutShell({ children }: SuperAdminLayoutShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    stats,
    error,
    activeItem,
    selectedUser,
    setSelectedUser,
    selectedOrg,
    setSelectedOrg,
    actionLoadingId,
  } = useSuperAdmin();

  const handleActiveItemChange = (itemId: string) => {
    if (itemId === 'dashboard') {
      router.push('/superadmin');
    } else {
      router.push(`/superadmin/${itemId}`);
    }
  };

  const getPageTitleAndSubtitle = () => {
    switch (activeItem) {
      case 'dashboard':
        return { title: 'Platform Monitor', subtitle: 'Global server KPIs & registration statistics' };
      case 'organizations':
        return { title: 'Workspace Organizations', subtitle: 'Manage organization subscription plan tiers and account suspension' };
      case 'users':
        return { title: 'Platform Users', subtitle: 'Inspect, manage, and soft-ban platform user accounts' };
      case 'activity':
        return { title: 'Platform Audit Trail', subtitle: 'Timeline of administrative modifications and seeding logs' };
      case 'system':
        return { title: 'System Metrics & Health', subtitle: 'Uptime indicators, database latency, and BullMQ queue details' };
      case 'subscriptions':
        return { title: 'Subscription Plans', subtitle: 'Manage platform subscription options and pricing tiers' };
      case 'create-plan':
        return { title: 'Create Plan', subtitle: 'Define a new subscription offering for workspaces' };
      case 'profile':
        return { title: 'Super Admin Profile', subtitle: 'Manage your personal account details and security' };
      case 'settings':
        return { title: 'Platform Settings', subtitle: 'Configure global platform preferences' };
      default:
        return { title: 'Super Admin Control Panel', subtitle: 'TaskBridge Operations' };
    }
  };

  const { title, subtitle } = getPageTitleAndSubtitle();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={activeItem}
        onActiveItemChange={handleActiveItemChange}
        stats={stats}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          pageTitle={title}
          pageSubtitle={subtitle}
        />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-955">
          <div className="mx-auto max-w-screen-2xl px-4 py-6 space-y-6 lg:px-6">
            
            {/* Error notifications */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-655" />
                <span>{error}</span>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-blue-600" />
                User Account Profile
              </h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-350 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2.5 py-2">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-650 dark:text-blue-400 flex items-center justify-center font-bold text-2xl border border-blue-200 dark:border-slate-700 overflow-hidden">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  selectedUser.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="text-center">
                <h4 className="font-bold text-slate-800 dark:text-white text-base leading-snug">{selectedUser.name}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-450">{selectedUser.email}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Account ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-350">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Current Workspace</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedUser.orgName || 'None'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Administrative Role</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{selectedUser.roleLabel || selectedUser.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Registration Date</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date(selectedUser.createdAt).toLocaleDateString()} at {new Date(selectedUser.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Status</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedUser.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-655'
                }`}>
                  {selectedUser.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORGANIZATION DETAILS MODAL */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Workspace Organization Profile
              </h3>
              <button onClick={() => setSelectedOrg(null)} className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-350 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Organization Name</span>
                <span className="font-bold text-slate-850 dark:text-white">{selectedOrg.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Slug Identifier</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedOrg.slug}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Organization ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedOrg.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-405 dark:text-slate-500 font-bold uppercase">Owner</span>
                <span className="font-semibold text-slate-705 dark:text-slate-300">{selectedOrg.owner}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-405 dark:text-slate-500 font-bold uppercase">Subscription Tier</span>
                <span className="font-semibold text-slate-755 dark:text-slate-300 capitalize">{selectedOrg.plan}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Workspace Members</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedOrg.users} accounts</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Active Projects</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedOrg.projects} projects</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Created On</span>
                <span className="text-slate-707 dark:text-slate-300">{new Date(selectedOrg.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-850">
                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase">Subscription Status</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${
                  selectedOrg.status === 'active' ? 'bg-emerald-50 text-emerald-650' : 'bg-red-50 text-red-655'
                }`}>
                  {selectedOrg.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrg(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
