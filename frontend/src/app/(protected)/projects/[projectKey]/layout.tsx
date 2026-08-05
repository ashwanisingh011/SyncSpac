"use client";

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Outlet } from 'react-router-dom';
import LeftSidebar from '@/components/LeftSidebar';
import { ProjectDataProvider } from '@/context/projectDataContext';
import { LayoutDashboard, KanbanSquare, ListTodo, FolderOpen, BarChart2, Clock, Settings } from 'lucide-react';
import clsx from 'clsx';

interface ProjectLayoutProps {
  children?: React.ReactNode;
}

export default function ProjectLayout({ children }: ProjectLayoutProps): React.JSX.Element {
  const params = useParams<{ projectKey: string }>();
  const pathname = usePathname();
  const projectKey = params.projectKey;

  const navItems = [
    { name: 'Overview', href: `/projects/${projectKey}`, icon: LayoutDashboard, exact: true },
    { name: 'Board', href: `/projects/${projectKey}/board`, icon: KanbanSquare },
    { name: 'Backlog', href: `/projects/${projectKey}/backlog`, icon: ListTodo },
    { name: 'Files', href: `/projects/${projectKey}/files`, icon: FolderOpen },
    { name: 'Reports', href: `/projects/${projectKey}/reports`, icon: BarChart2 },
    { name: 'Recurring Tasks', href: `/projects/${projectKey}/recurring`, icon: Clock },
    { name: 'Project Settings', href: `/projects/${projectKey}/settings`, icon: Settings },
  ];

  return (
    <ProjectDataProvider projectKey={projectKey}>
      <div className="flex flex-col lg:flex-row w-full min-h-screen bg-surface">
        {/* Left Sidebar - Desktop only */}
        <div className="hidden lg:block lg:flex-shrink-0">
          <LeftSidebar projectKey={projectKey} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface">
          {/* Project Sub-Navbar - Mobile/Tablet only */}
          <div className="lg:hidden border-b border-line glass sticky top-0 z-10">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-line/50">
              <div className="w-6 h-6 bg-gradient-to-br from-brand-500 to-accent-500 text-white flex items-center justify-center rounded-md font-bold text-xs">
                {String(projectKey).substring(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-content">{projectKey} Project</span>
            </div>
            <nav className="flex overflow-x-auto no-scrollbar scroll-smooth px-3 py-1.5 gap-1.5 flex-nowrap">
              {navItems.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-content shadow-card"
                        : "text-content-secondary hover:bg-surface-hover"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 overflow-auto">
            {children || <Outlet />}
          </div>
        </div>
      </div>
    </ProjectDataProvider>
  );
}
