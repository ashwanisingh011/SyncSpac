"use client";

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import LeftSidebar from '@/components/LeftSidebar';
import { ProjectDataProvider } from '@/context/projectDataContext';
import { LayoutDashboard, KanbanSquare, ListTodo, FolderOpen, BarChart2, Clock, Settings } from 'lucide-react';
import clsx from 'clsx';

interface ProjectLayoutProps {
  children: React.ReactNode;
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
      <div className="flex flex-col lg:flex-row w-full min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Left Sidebar - Desktop only */}
        <div className="hidden lg:block lg:flex-shrink-0">
          <LeftSidebar projectKey={projectKey} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
          {/* Project Sub-Navbar - Mobile/Tablet only */}
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800/50">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 flex items-center justify-center rounded-md font-bold text-xs dark:bg-blue-950 dark:text-blue-200">
                {String(projectKey).substring(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{projectKey} Project</span>
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
                        ? "bg-blue-600 text-white shadow-xs dark:bg-blue-500"
                        : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50"
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
            {children}
          </div>
        </div>
      </div>
    </ProjectDataProvider>
  );
}
