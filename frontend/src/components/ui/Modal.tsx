"use client";

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: ModalSize;
  children: ReactNode;
  /** Hide the default close (X) button. */
  hideClose?: boolean;
  /** Extra classes on the panel. */
  className?: string;
}

/**
 * Animated modal shell — glassy backdrop blur, spring scale-in panel.
 * Handles ESC, backdrop click, scroll lock, and portal rendering.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  hideClose = false,
  className,
}: ModalProps): React.JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC to close + scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={cn(
              'relative w-full rounded-xl bg-surface-overlay shadow-overlay border border-line',
              SIZE_CLASSES[size],
              className
            )}
          >
            {(title || !hideClose) && (
              <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-1">
                <div>
                  {title && <h2 className="text-base font-semibold text-content">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-content-tertiary">{description}</p>}
                </div>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="shrink-0 rounded-md p-1.5 text-content-tertiary transition-colors hover:bg-surface-hover hover:text-content cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <div className="px-5 pb-5 pt-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
