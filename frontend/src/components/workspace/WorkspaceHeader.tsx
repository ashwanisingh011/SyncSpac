'use client';

import type { ReactNode } from 'react';

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function WorkspaceHeader({
  title,
  subtitle,
  action,
}: WorkspaceHeaderProps) {
  return (
    <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
