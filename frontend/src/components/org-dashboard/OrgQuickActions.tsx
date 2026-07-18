'use client';

import {
  FolderPlus,
  UserPlus,
  Zap,
  FileBarChart2,
  Settings,
  CheckSquare,
  FolderOpen,
} from 'lucide-react';
import Link from 'next/link';

interface OrgQuickActionsProps {
  onCreateProject: () => void;
  onCreateTask: () => void;
  onViewChange?: (view: string) => void;
}

const actions = [
  {
    id: 'create-project',
    label: 'Create Project',
    icon: FolderPlus,
    colorClass: 'bg-[#DEEBFF] text-[#0052CC] dark:bg-blue-950/40 dark:text-blue-300',
    type: 'callback' as const,
    callbackKey: 'project',
  },
  {
    id: 'create-task',
    label: 'Create Task',
    icon: CheckSquare,
    colorClass: 'bg-[#EAE6FF] text-[#403294] dark:bg-purple-950/40 dark:text-purple-300',
    type: 'callback' as const,
    callbackKey: 'task',
  },
  {
    id: 'invite-member',
    label: 'Invite Member',
    icon: UserPlus,
    colorClass: 'bg-[#E3FCEF] text-[#006644] dark:bg-emerald-950/40 dark:text-emerald-300',
    type: 'link' as const,
    viewId: 'members',
    href: '/dashboard/members',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileBarChart2,
    colorClass: 'bg-[#FFF0B3] text-[#172B4D] dark:bg-amber-950/40 dark:text-amber-300',
    type: 'link' as const,
    viewId: 'projects',
    href: '/dashboard/projects',
  },
  {
    id: 'ws-settings',
    label: 'Settings',
    icon: Settings,
    colorClass: 'bg-[#DFE1E6] text-[#42526E] dark:bg-slate-800 dark:text-slate-400',
    type: 'link' as const,
    viewId: 'ws-settings',
    href: '/dashboard/workspace-settings',
  },
  {
    id: 'project-files',
    label: 'Project Files',
    icon: FolderOpen,
    colorClass: 'bg-[#E0F2FE] text-[#0369A1] dark:bg-sky-955/40 dark:text-sky-300',
    type: 'link' as const,
    viewId: 'project-files',
    href: '/dashboard/project-files',
  },
  {
    id: 'teams',
    label: 'Manage Teams',
    icon: Zap,
    colorClass: 'bg-[#FFE2E2] text-[#BF2600] dark:bg-red-950/40 dark:text-red-300',
    type: 'link' as const,
    viewId: 'teams',
    href: '/dashboard/teams',
  },
];

export default function OrgQuickActions({ onCreateProject, onCreateTask, onViewChange }: OrgQuickActionsProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-[#DFE1E6] dark:border-slate-800 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#091E42] dark:text-slate-105 font-sans">Quick Actions</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Common workspace operations</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          if (action.type === 'callback') {
            const handler = action.callbackKey === 'project' ? onCreateProject : onCreateTask;
            return (
              <button
                key={action.id}
                onClick={handler}
                className="flex flex-col items-center gap-2 p-3.5 rounded border border-[#DFE1E6] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F4F5F7]/50 dark:hover:bg-slate-800/40 hover:border-slate-350 transition-all duration-150 cursor-pointer"
              >
                <div className={`w-8 h-8 rounded ${action.colorClass} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[#091E42] dark:text-slate-200 text-center leading-tight font-sans mt-1.5">
                  {action.label}
                </span>
              </button>
            );
          }

          if (onViewChange && action.viewId) {
            return (
              <button
                key={action.id}
                onClick={() => onViewChange(action.viewId)}
                className="flex flex-col items-center gap-2 p-3.5 rounded border border-[#DFE1E6] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F4F5F7]/50 dark:hover:bg-slate-800/40 hover:border-slate-350 transition-all duration-150 cursor-pointer"
              >
                <div className={`w-8 h-8 rounded ${action.colorClass} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-[#091E42] dark:text-slate-200 text-center leading-tight font-sans mt-1.5">
                  {action.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={action.id}
              href={action.href!}
              className="flex flex-col items-center gap-2 p-3.5 rounded border border-[#DFE1E6] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F4F5F7]/50 dark:hover:bg-slate-800/40 hover:border-slate-350 transition-all duration-150"
            >
              <div className={`w-8 h-8 rounded ${action.colorClass} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[#091E42] dark:text-slate-200 text-center leading-tight font-sans mt-1.5">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
