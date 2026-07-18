'use client';

import type { OrganizationSummary, SubscriptionPlan } from '@/types/workspace';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

interface WorkspaceCardProps {
  workspace: OrganizationSummary;
  className?: string;
}

const planColors: Record<SubscriptionPlan, string> = {
  free: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  pro: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  business:
    'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  enterprise:
    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
};

export default function WorkspaceCard({ workspace, className }: WorkspaceCardProps) {
  return (
    <div
      className={clsx(
        'group relative flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {workspace.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={workspace.logoUrl}
            alt={workspace.name}
            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {workspace.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-900 truncate dark:text-slate-100">
            {workspace.name}
          </h3>
          <p className="text-xs text-slate-500 truncate">/{workspace.slug}</p>
        </div>

        <span
          className={clsx(
            'shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
            planColors[workspace.plan],
          )}
        >
          {workspace.plan}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {workspace.memberCount} member{workspace.memberCount !== 1 ? 's' : ''}
        </span>

        <Link
          href="/workspace/members"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity dark:text-blue-400 dark:hover:text-blue-300"
        >
          Open <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
