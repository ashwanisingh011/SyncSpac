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
    colorClass: 'bg-[#DEEBFF] text-primary',
    type: 'callback' as const,
    callbackKey: 'project',
  },
  {
    id: 'create-task',
    label: 'Create Task',
    icon: CheckSquare,
    colorClass: 'bg-[#EAE6FF] text-[#403294]',
    type: 'callback' as const,
    callbackKey: 'task',
  },
  {
    id: 'invite-member',
    label: 'Invite Member',
    icon: UserPlus,
    colorClass: 'bg-success/10 text-[#006644]',
    type: 'link' as const,
    viewId: 'members',
    href: '/dashboard/members',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileBarChart2,
    colorClass: 'bg-[#FFF0B3] text-content',
    type: 'link' as const,
    viewId: 'projects',
    href: '/dashboard/projects',
  },
  {
    id: 'ws-settings',
    label: 'Settings',
    icon: Settings,
    colorClass: 'bg-[#DFE1E6] text-content-secondary',
    type: 'link' as const,
    viewId: 'ws-settings',
    href: '/dashboard/workspace-settings',
  },
  {
    id: 'project-files',
    label: 'Project Files',
    icon: FolderOpen,
    colorClass: 'bg-status-progress/12 text-status-progress',
    type: 'link' as const,
    viewId: 'project-files',
    href: '/dashboard/project-files',
  },
  {
    id: 'teams',
    label: 'Manage Teams',
    icon: Zap,
    colorClass: 'bg-[#FFE2E2] text-[#BF2600]',
    type: 'link' as const,
    viewId: 'teams',
    href: '/dashboard/teams',
  },
];

export default function OrgQuickActions({ onCreateProject, onCreateTask, onViewChange }: OrgQuickActionsProps) {
  return (
    <div className="bg-surface rounded border border-line p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-content font-sans">Quick Actions</h3>
        <p className="text-xs text-content-tertiary mt-0.5 font-sans">Common workspace operations</p>
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
                className="flex flex-col items-center gap-2 p-3.5 rounded border border-line bg-surface hover:bg-surface-hover/50 hover:border-line-strong transition-all duration-150 cursor-pointer"
              >
                <div className={`w-8 h-8 rounded ${action.colorClass} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-content text-center leading-tight font-sans mt-1.5">
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
                className="flex flex-col items-center gap-2 p-3.5 rounded border border-line bg-surface hover:bg-surface-hover/50 hover:border-line-strong transition-all duration-150 cursor-pointer"
              >
                <div className={`w-8 h-8 rounded ${action.colorClass} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-content text-center leading-tight font-sans mt-1.5">
                  {action.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={action.id}
              href={action.href!}
              className="flex flex-col items-center gap-2 p-3.5 rounded border border-line bg-surface hover:bg-surface-hover/50 hover:border-line-strong transition-all duration-150"
            >
              <div className={`w-8 h-8 rounded ${action.colorClass} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-content text-center leading-tight font-sans mt-1.5">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
