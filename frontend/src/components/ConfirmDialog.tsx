'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

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

const VARIANT_STYLES: Record<ConfirmVariant, { icon: React.JSX.Element; iconBg: string; confirmClass: string }> = {
  danger: {
    icon: <AlertTriangle className="h-6 w-6 text-danger" />,
    iconBg: 'bg-danger/10',
    confirmClass: 'bg-danger text-white hover:opacity-90',
  },
  warning: {
    icon: <AlertCircle className="h-6 w-6 text-warning" />,
    iconBg: 'bg-warning/10',
    confirmClass: 'bg-warning text-white hover:opacity-90',
  },
  info: {
    icon: <Info className="h-6 w-6 text-primary" />,
    iconBg: 'bg-primary-subtle',
    confirmClass: 'bg-primary text-primary-content hover:bg-primary-hover',
  },
};

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

  const styles = VARIANT_STYLES[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onCancel}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
            aria-hidden="true"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface-overlay p-6 shadow-overlay"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking dialog body
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onCancel}
              className="absolute right-4 top-4 rounded-md p-1.5 text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mt-2 flex items-start gap-4">
              {/* Icon Container */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.06 }}
                className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', styles.iconBg)}
              >
                {styles.icon}
              </motion.div>

              <div className="flex-1">
                <h2 id="confirm-title" className="text-lg font-bold text-content">
                  {title}
                </h2>
                <p id="confirm-message" className="mt-2 text-sm leading-relaxed text-content-secondary">
                  {message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" data-action="cancel" onClick={onCancel}>
                {cancelText}
              </Button>
              <Button ref={confirmButtonRef} onClick={onConfirm} className={styles.confirmClass}>
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
