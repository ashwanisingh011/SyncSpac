"use client";

import { X } from 'lucide-react';

type ToastProps = {
  message: string;
  variant?: 'success' | 'error' | 'info';
  onClose?: () => void;
};

const palette = {
  success: {
    bg: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-700',
  },
  error: {
    bg: 'bg-red-50 text-red-900 dark:bg-red-950/80 dark:text-red-200',
    border: 'border-red-200 dark:border-red-700',
  },
  info: {
    bg: 'bg-slate-50 text-slate-900 dark:bg-slate-900/90 dark:text-slate-100',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export default function Toast({ message, variant = 'info', onClose }: ToastProps) {
  const styles = palette[variant];

  return (
    <div className={`fixed right-5 top-5 z-50 flex w-full items-center max-w-sm gap-3 rounded-2xl border px-4 py-3 shadow-xl ${styles.bg} ${styles.border}`} role="alert">
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-base font-semibold text-slate-900 dark:bg-slate-900/70 dark:text-slate-100">
        {variant === 'success' ? '✓' : variant === 'error' ? '!' : 'i'}
      </div>
      <div className="flex-1 text-sm leading-6 text-slate-900 dark:text-slate-100">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
