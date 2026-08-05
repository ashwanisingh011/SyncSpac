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
  free: 'bg-surface-hover text-content-secondary',
  pro: 'bg-primary-subtle text-primary',
  business:
    'bg-violet-50 text-violet-700',
  enterprise:
    'bg-warning/10 text-warning',
};

export default function WorkspaceCard({ workspace, className }: WorkspaceCardProps) {
  return (
    <div
      className={clsx(
        'group relative flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md',
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
            className="w-10 h-10 rounded-lg object-cover border border-line"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold text-sm">
            {workspace.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <h3 className="text-sm font-semibold text-content truncate">
            {workspace.name}
          </h3>
          <p className="text-xs text-content-tertiary truncate">/{workspace.slug}</p>
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
      <div className="flex items-center justify-between text-xs text-content-tertiary">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {workspace.memberCount} member{workspace.memberCount !== 1 ? 's' : ''}
        </span>

        <Link
          href="/workspace/members"
          className="flex items-center gap-1 text-primary hover:text-primary-hover font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Open <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
