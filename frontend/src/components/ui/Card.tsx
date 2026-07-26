"use client";

import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

type CardLevel = 'flat' | 'raised' | 'sunken';

const LEVEL_CLASSES: Record<CardLevel, string> = {
  flat: 'bg-surface border border-line shadow-card',
  raised: 'bg-surface-raised border border-line shadow-raised',
  sunken: 'bg-surface-sunken border border-line/60',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  level?: CardLevel;
  hoverable?: boolean;
}

/** Static card. Use MotionCard for entrance/hover animations. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { level = 'flat', hoverable = false, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg',
        LEVEL_CLASSES[level],
        hoverable && 'transition-all duration-200 hover:shadow-raised hover:border-line-strong hover:-translate-y-0.5',
        className
      )}
      {...props}
    />
  );
});

export interface MotionCardProps extends HTMLMotionProps<'div'> {
  level?: CardLevel;
  hoverable?: boolean;
}

/** Motion-enabled card for staggered grids and hover lift. */
export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(function MotionCard(
  { level = 'flat', hoverable = false, className, ...props },
  ref
) {
  return (
    <motion.div
      ref={ref}
      whileHover={hoverable ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'rounded-lg',
        LEVEL_CLASSES[level],
        hoverable && 'transition-shadow duration-200 hover:shadow-raised hover:border-line-strong',
        className
      )}
      {...props}
    />
  );
});
