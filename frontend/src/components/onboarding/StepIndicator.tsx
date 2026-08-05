'use client';

import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ONBOARDING_STEPS = ['Organization details', 'Invite members', 'Start building'];

interface StepIndicatorProps {
  steps?: string[];
  /** Zero-based index of the active step. */
  current: number;
  className?: string;
}

/** Animated onboarding progress — completed checks, active pulse, connecting lines. */
export default function StepIndicator({ steps = ONBOARDING_STEPS, current, className }: StepIndicatorProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div key={step} className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24, delay: i * 0.08 }}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors',
                isDone && 'bg-success text-white',
                isActive && 'bg-primary text-primary-content shadow-[0_0_0_4px_var(--primary-subtle)]',
                !isDone && !isActive && 'bg-surface-hover text-content-tertiary'
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </motion.div>
            <span
              className={cn(
                'hidden text-xs font-medium sm:inline',
                isActive ? 'text-primary' : isDone ? 'text-content-secondary' : 'text-content-tertiary'
              )}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <div className="relative h-px w-8 overflow-hidden rounded-full bg-line">
                {isDone && (
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.25, 1, 0.5, 1] }}
                    className="absolute inset-0 bg-success"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
