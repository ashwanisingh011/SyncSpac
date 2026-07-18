'use client';

import { AlertTriangle, X } from 'lucide-react';
import { ACCESS_RESTRICTED_MESSAGE, ACCESS_RESTRICTED_TITLE } from '@/lib/accessErrors';

interface AccessRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function AccessRestrictedModal({
  isOpen,
  onClose,
  title = ACCESS_RESTRICTED_TITLE,
  message = ACCESS_RESTRICTED_MESSAGE,
}: AccessRestrictedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="access-restricted-title"
        aria-describedby="access-restricted-message"
        className="relative w-full max-w-md rounded-xl border border-amber-200 bg-white p-6 text-center shadow-2xl dark:border-amber-900/50 dark:bg-slate-900"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close access restricted dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="access-restricted-title" className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p id="access-restricted-message" className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex h-10 min-w-24 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          OK
        </button>
      </div>
    </div>
  );
}
