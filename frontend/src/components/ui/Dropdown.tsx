"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

/* ─── Dropdown ───────────────────────────────────────────────── */

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  /** Controlled open state (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Animated dropdown — scale-from-origin, closes on outside click / ESC.
 * Uncontrolled by default; pass open/onOpenChange to control.
 */
export function Dropdown({ trigger, children, align = 'left', className, open, onOpenChange }: DropdownProps): React.JSX.Element {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <div onClick={() => setOpen(!isOpen)}>{trigger}</div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -2 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{ transformOrigin: align === 'right' ? 'top right' : 'top left' }}
            className={cn(
              'absolute z-50 mt-1.5 min-w-[180px] rounded-lg border border-line bg-surface-overlay p-1 shadow-overlay',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  danger = false,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors cursor-pointer',
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-content-secondary hover:bg-surface-hover hover:text-content',
        '[&>svg]:h-4 [&>svg]:w-4',
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator(): React.JSX.Element {
  return <div className="my-1 h-px bg-line" />;
}

/* ─── Tabs (animated sliding indicator) ──────────────────────── */

export interface TabItem {
  key: string;
  label: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
  /** Unique layout id when multiple Tabs render on one page. */
  layoutId?: string;
}

export function Tabs({ tabs, active, onChange, className, layoutId = 'tabs-indicator' }: TabsProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-1 border-b border-line', className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'relative px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer',
              isActive ? 'text-primary' : 'text-content-tertiary hover:text-content'
            )}
          >
            {tab.label}
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
