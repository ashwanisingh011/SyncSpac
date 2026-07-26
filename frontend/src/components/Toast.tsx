"use client";

import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type ToastProps = {
  message: string;
  variant?: 'success' | 'error' | 'info';
  onClose?: () => void;
};

const palette = {
  success: {
    accent: 'bg-success',
    iconWrap: 'bg-success/12 text-success',
    Icon: CheckCircle2,
  },
  error: {
    accent: 'bg-danger',
    iconWrap: 'bg-danger/12 text-danger',
    Icon: AlertCircle,
  },
  info: {
    accent: 'bg-primary',
    iconWrap: 'bg-primary-subtle text-primary',
    Icon: Info,
  },
};

export default function Toast({ message, variant = 'info', onClose }: ToastProps) {
  const { accent, iconWrap, Icon } = palette[variant];

  return (
    <motion.div
      initial={{ opacity: 0, x: 48, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="fixed right-5 top-5 z-[110] flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface-overlay py-3 pl-4 pr-3 shadow-overlay"
      role="alert"
    >
      {/* Accent bar */}
      <span className={cn('absolute left-0 top-0 h-full w-1', accent)} />
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', iconWrap)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="flex-1 text-sm leading-5 text-content">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md p-1.5 text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
