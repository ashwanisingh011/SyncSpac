'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCircle2,
  Settings,
  CreditCard,
  ChevronRight,
  X,
  Grid,
  BarChart2,
  ListTodo,
  FolderOpen,
} from 'lucide-react';

interface OrgSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  membersCount: number;
  projectsCount: number;
  tasksCount: number;
  sprintsCount: number;
  // Legacy props — kept for backward compatibility but no longer used for routing/active state
  activeView?: string;
  onViewChange?: (view: string) => void;
}

export default function OrgSidebar({
  isOpen,
  onClose,
  membersCount,
  projectsCount,
}: OrgSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  const navItems = [
    { id: 'dashboard',          href: '/dashboard',                    label: 'Dashboard',          icon: LayoutDashboard },
    { id: 'projects',           href: '/dashboard/projects',           label: 'Projects',            icon: FolderKanban,  badge: String(projectsCount) },
    { id: 'teams',              href: '/dashboard/teams',              label: 'Teams',               icon: Users },
    { id: 'members',            href: '/dashboard/members',            label: 'Members',             icon: UserCircle2,   badge: String(membersCount) },
    { id: 'all-tasks',          href: '/dashboard/all-tasks',          label: 'All Tasks',           icon: ListTodo },
    { id: 'project-files',      href: '/dashboard/project-files',      label: 'Project Files',       icon: FolderOpen },
    { id: 'analytics',          href: '/dashboard/analytics',          label: 'Analytics',           icon: BarChart2 },
    { id: 'workspace-settings', href: '/dashboard/workspace-settings', label: 'Workspace Settings',  icon: Settings },
    { id: 'billing',            href: '/dashboard/billing',            label: 'Billing & Plans',    icon: CreditCard },
  ];

  const checkActive = (href: string) => {
    // Dashboard is only active on exact /dashboard
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const wsInitials = currentOrg?.name
    ? currentOrg.name.substring(0, 2).toUpperCase()
    : 'AC';
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'AJ';

  const handleNavClick = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-[220px] flex flex-col
          bg-white border-r border-[#DFE1E6] dark:bg-slate-950 dark:border-slate-900
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#DFE1E6] dark:border-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#DEEBFF] flex items-center justify-center dark:bg-slate-900">
              <Grid className="w-3.5 h-3.5 text-[#0052CC] dark:text-blue-400" />
            </div>
            <span className="text-[14px] font-bold text-slate-800 tracking-tight dark:text-white">
              TaskBridge
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace pill */}
        <div className="px-3 py-2.5 border-b border-[#DFE1E6] dark:border-slate-900">
          <button
            onClick={() => handleNavClick('/dashboard')}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-[#F4F5F7] hover:bg-[#EBECF0] transition-colors cursor-pointer dark:bg-slate-900/50 dark:hover:bg-slate-900 text-left"
          >
            {currentOrg?.logoUrl ? (
              <img
                src={currentOrg.logoUrl}
                alt=""
                className="w-6 h-6 rounded object-cover shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-[#0052CC] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {wsInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-250 truncate">
                {currentOrg?.name || 'Workspace'}
              </p>
              <p className="text-[10px] text-[#0052CC] dark:text-blue-400 font-medium capitalize">
                {currentOrg?.plan || 'free'} plan
              </p>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-450 shrink-0" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-1.5">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = checkActive(item.href);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={`
                      w-full flex items-center justify-between px-2.5 py-2 rounded text-[13px]
                      font-medium transition-all duration-150 group text-left
                      ${
                        active
                          ? 'bg-[#DEEBFF] text-[#0747A6] dark:bg-slate-900 dark:text-blue-300 font-semibold'
                          : 'text-slate-650 hover:bg-[#F4F5F7] hover:text-[#091E42] dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-slate-205'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          active
                            ? 'text-[#0052CC] dark:text-blue-400'
                            : 'text-[#42526E] group-hover:text-[#091E42] dark:text-slate-500 dark:group-hover:text-slate-400'
                        }`}
                      />
                      {item.label}
                    </span>
                    {'badge' in item && item.badge && item.badge !== '0' ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {item.badge}
                      </span>
                    ) : active ? (
                      <ChevronRight className="w-3 h-3 text-[#0052CC] dark:text-blue-400" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User card */}
        <div className="p-2.5 border-t border-[#DFE1E6] dark:border-slate-900">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded border border-[#DFE1E6] bg-[#F4F5F7] dark:bg-slate-900 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-[#0052CC] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate dark:text-slate-200">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate dark:text-slate-450 uppercase font-bold tracking-wider">
                {currentOrg?.myRoleName || 'Owner'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
