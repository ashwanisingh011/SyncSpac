"use client";

import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/* ─── Skeleton ───────────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(110deg,var(--surface-hover)_40%,var(--surface-active)_50%,var(--surface-hover)_60%)] bg-[length:200%_100%]',
        className
      )}
    />
  );
}

/* ─── Spinner ────────────────────────────────────────────────── */

export function Spinner({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-primary',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

/* ─── EmptyState ─────────────────────────────────────────────── */

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.08 }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle text-primary [&>svg]:h-7 [&>svg]:w-7"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-base font-semibold text-content">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-content-tertiary">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
