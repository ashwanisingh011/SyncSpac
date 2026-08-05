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
    <div className="flex items-start justify-between pb-6 border-b border-line">
      <div>
        <h1 className="text-2xl font-semibold text-content">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-content-tertiary">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
