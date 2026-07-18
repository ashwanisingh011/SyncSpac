"use client";

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import { Building2, Users, UsersRound, Network, Settings, CreditCard } from 'lucide-react';
import type { PermissionCode } from '@/lib/rbacMatrix';
import clsx from 'clsx';

const navItems: {
  label: string;
  href: string;
  icon: typeof Building2;
  permission?: PermissionCode;
  capability?: 'members' | 'settings' | 'billing';
}[] = [
  { label: 'Overview', href: '/workspace', icon: Building2 },
  { label: 'Members', href: '/workspace/members', icon: Users, capability: 'members' },
  { label: 'Teams', href: '/workspace/teams', icon: UsersRound, permission: 'manage_team' },
  { label: 'Departments', href: '/workspace/departments', icon: Network, permission: 'manage_departments' },
  { label: 'Settings', href: '/workspace/settings', icon: Settings, capability: 'settings' },
  { label: 'Billing', href: '/workspace/billing', icon: CreditCard, permission: 'manage_billing' },
];

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { currentOrg } = useOrganization();
  const { hasPermission, hasRole } = usePermission();

  const canSeeNavItem = (item: (typeof navItems)[number]): boolean => {
    if (
      hasRole('developer') ||
      hasRole('qa_tester') ||
      hasRole('qa') ||
      hasRole('team_lead')
    ) {
      if (item.href === '/workspace/teams' || item.href === '/workspace/members') {
        return true;
      }
    }

    if (item.permission) {
      return hasPermission(item.permission);
    }
    if (item.capability === 'members') {
      return (
        hasPermission('invite_members') ||
        hasPermission('manage_members')
      );
    }
    if (item.capability === 'settings') {
      return hasPermission('manage_workspace');
    }
    return true;
  };

  const visibleNavItems = navItems.filter(canSeeNavItem);

  const orgInitials = currentOrg
    ? currentOrg.name.slice(0, 2).toUpperCase()
    : 'TB';

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Desktop only */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <WorkspaceSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
        {/* Workspace Sub-Navbar - Mobile/Tablet only */}
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800/50">
            {currentOrg?.logoUrl ? (
              <img
                src={currentOrg.logoUrl}
                alt=""
                className="w-6 h-6 rounded object-cover shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {orgInitials}
              </div>
            )}
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {currentOrg?.name ?? 'Workspace'}
            </span>
          </div>
          <nav className="flex overflow-x-auto no-scrollbar scroll-smooth px-3 py-1.5 gap-1.5 flex-nowrap">
            {visibleNavItems.map((item) => {
              const isActive =
                item.href === '/workspace'
                  ? pathname === '/workspace'
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200",
                    isActive
                      ? "bg-blue-600 text-white shadow-xs dark:bg-blue-500"
                      : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
