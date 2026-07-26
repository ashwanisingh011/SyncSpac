"use client";

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'todo'
  | 'progress'
  | 'review'
  | 'done'
  | 'blocked'
  | 'priority-high'
  | 'priority-medium'
  | 'priority-low';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-surface-hover text-content-secondary',
  primary: 'bg-primary-subtle text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/12 text-warning',
  danger: 'bg-danger/12 text-danger',
  todo: 'bg-status-todo/12 text-status-todo',
  progress: 'bg-status-progress/12 text-status-progress',
  review: 'bg-status-review/12 text-status-review',
  done: 'bg-status-done/12 text-status-done',
  blocked: 'bg-status-blocked/12 text-status-blocked',
  'priority-high': 'bg-priority-high/12 text-priority-high',
  'priority-medium': 'bg-priority-medium/12 text-priority-medium',
  'priority-low': 'bg-priority-low/12 text-priority-low',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  /** Show a colored dot before the label. */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant = 'default', dot = false, children, className }: BadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
