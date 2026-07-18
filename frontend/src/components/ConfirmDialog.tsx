'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button when opened for better accessibility
      confirmButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        } else if (e.key === 'Enter') {
          // If the user presses enter and focus is not on the cancel button, trigger confirm
          if (document.activeElement?.getAttribute('data-action') !== 'cancel') {
            e.preventDefault();
            onConfirm();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  // Icon mapping based on variant
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
      case 'info':
      default:
        return <Info className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  // Icon background mapping
  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 dark:bg-rose-950/30';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30';
      case 'info':
      default:
        return 'bg-indigo-50 dark:bg-indigo-950/30';
    }
  };

  // Confirm button class mapping
  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/10 focus:ring-rose-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/10 focus:ring-amber-500';
      case 'info':
      default:
        return 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 focus:ring-indigo-500';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-opacity duration-300"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl transition-all dark:border-slate-800/80 dark:bg-slate-900/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking dialog body
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4 mt-2">
          {/* Icon Container */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getIconBg()}`}>
            {getIcon()}
          </div>

          <div className="flex-1">
            {/* Title */}
            <h2 id="confirm-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            {/* Message */}
            <p id="confirm-message" className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            data-action="cancel"
            onClick={onCancel}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
          >
            {cancelText}
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
