'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  Settings,
  CreditCard,
  Plus,
  ChevronRight,
  ChevronDown,
  Network,
  ChevronLeft,
  UsersRound,
} from 'lucide-react';
import clsx from 'clsx';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import OrgRoleBadge from '@/components/workspace/OrgRoleBadge';
import { useState } from 'react';
import type { PermissionCode } from '@/lib/rbacMatrix';

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

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
};

export default function WorkspaceSidebar() {
  const pathname = usePathname();
  const { currentOrg, organizations, setCurrentOrg } = useOrganization();
  const { hasPermission, hasRole } = usePermission();
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const initials = currentOrg
    ? currentOrg.name.slice(0, 2).toUpperCase()
    : 'TB';

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



  return (
    <aside
      className={clsx(
        'shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col transition-all duration-300 dark:border-slate-800 dark:bg-slate-950',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Workspace identity / org switcher */}
      <div className="relative border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-5 z-50 h-6 w-6 rounded-full border bg-white shadow flex items-center justify-center dark:bg-slate-900 dark:border-slate-700"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>

        <button
          onClick={() => !collapsed && setShowOrgPicker((v) => !v)}
          className={clsx(
            'w-full p-4 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors',
            collapsed
              ? 'flex justify-center'
              : 'flex items-center gap-3'
          )}
          aria-expanded={showOrgPicker}
        >
          {currentOrg?.logoUrl ? (
            <img
              src={currentOrg.logoUrl}
              alt={currentOrg.name}
              className="w-9 h-9 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {initials}
            </div>
          )}

          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-sm font-semibold text-slate-900 truncate dark:text-slate-100">
                  {currentOrg?.name ?? 'No organization'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentOrg
                    ? `${PLAN_LABELS[currentOrg.plan]} · ${currentOrg.memberCount} member${currentOrg.memberCount !== 1 ? 's' : ''}`
                    : 'Select one →'}
                </p>
              </div>

              <ChevronDown
                className={clsx(
                  'w-4 h-4 text-slate-400 shrink-0 transition-transform',
                  showOrgPicker && 'rotate-180',
                )}
              />
            </>
          )}
        </button>

        {!collapsed && showOrgPicker && (
          <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 shadow-lg dark:bg-slate-900 dark:border-slate-800">
            {currentOrg && (
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Your role</p>
                <OrgRoleBadge
                  role={currentOrg.myRole}
                  label={currentOrg.myRoleName}
                  size="sm"
                />
              </div>
            )}

            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setCurrentOrg(org);
                  setShowOrgPicker(false);
                }}
                className={clsx(
                  'flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors',
                  org.id === currentOrg?.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="w-7 h-7 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {org.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <span className="truncate flex-1 text-left">
                  <span className="block font-medium">{org.name}</span>
                  <span className="text-xs text-slate-400">
                    {org.memberCount} member
                    {org.memberCount !== 1 ? 's' : ''}
                  </span>
                </span>

                {org.id === currentOrg?.id && (
                  <span className="text-xs text-blue-500 shrink-0">
                    ✓
                  </span>
                )}
              </button>
            ))}

            {hasPermission('create_workspace') && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-2">
                <Link
                  href="/onboarding/create-org"
                  onClick={() => setShowOrgPicker(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-slate-400 dark:hover:bg-blue-950/20 dark:hover:text-blue-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New organization
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {visibleNavItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/workspace'
              ? pathname === '/workspace'
              : pathname?.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center px-3 py-2 rounded-md text-sm transition-colors',
                collapsed ? 'justify-center' : 'gap-3',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-950/40 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100',
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 shrink-0',
                  isActive ? 'text-blue-600 dark:text-blue-400' : '',
                )}
              />
              <>
                {!collapsed && (
                  <span className="flex-1">{label}</span>
                )}
              </>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer CTA */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/onboarding/join-org"
          className={clsx(
            'flex items-center w-full px-3 py-2 text-sm text-slate-500 hover:bg-slate-200/40 hover:text-slate-900 rounded-md transition-colors dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100',
            collapsed ? 'justify-center' : 'gap-2'
          )}
        >
          <Plus className="w-4 h-4" />
          {!collapsed && 'Join another org'}
        </Link>
      </div>
    </aside>
  );
}
