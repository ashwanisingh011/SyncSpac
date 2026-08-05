"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, KanbanSquare, ListTodo, Settings, LayoutDashboard, Clock, FolderOpen, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface LeftSidebarProps {
  projectKey: string | string[];
}

export default function LeftSidebar({ projectKey }: LeftSidebarProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { name: 'Overview', href: `/projects/${projectKey}`, icon: LayoutDashboard, exact: true },
    { name: 'Board', href: `/projects/${projectKey}/board`, icon: KanbanSquare },
    { name: 'Backlog', href: `/projects/${projectKey}/backlog`, icon: ListTodo },
    { name: 'Files', href: `/projects/${projectKey}/files`, icon: FolderOpen },
    { name: 'Reports', href: `/projects/${projectKey}/reports`, icon: BarChart2 },
    { name: 'Recurring Tasks', href: `/projects/${projectKey}/recurring`, icon: Clock },
    { name: 'Project Settings', href: `/projects/${projectKey}/settings`, icon: Settings },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="relative z-auto flex min-h-screen flex-shrink-0 flex-col border-r border-line bg-surface-sunken"
    >
      {/* Desktop Resizer/Collapse button */}
      <button
        type="button"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-4 z-10 cursor-pointer rounded-full border border-line bg-surface p-0.5 text-content-tertiary shadow-card transition-colors hover:bg-surface-hover hover:text-primary"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Project header */}
      <div className="mb-2 flex items-center gap-3 overflow-hidden p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 font-bold text-white shadow-card">
          {String(projectKey).substring(0, 2).toUpperCase()}
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.1 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <div className="truncate text-sm font-semibold text-content">{projectKey} Project</div>
            <div className="text-xs text-content-tertiary">Software project</div>
          </motion.div>
        )}
      </div>

      {!collapsed && (
        <div className="mb-1 px-5 text-[10px] font-bold uppercase tracking-widest text-content-tertiary">
          Planning
        </div>
      )}

      <nav className="flex-1 space-y-0.5 px-2">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors overflow-hidden',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-content-secondary hover:bg-surface-hover hover:text-content'
              )}
              title={collapsed ? item.name : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-item"
                  className="absolute inset-0 rounded-md bg-primary-subtle"
                  transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                />
              )}
              {/* Active left indicator */}
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-bar"
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                />
              )}
              <Icon className={cn('relative h-5 w-5 shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="relative whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
