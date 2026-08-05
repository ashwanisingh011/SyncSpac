"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ─── Input ──────────────────────────────────────────────────── */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, leftIcon, rightSlot, className, ...props },
  ref
) {
  return (
    <div className="relative w-full">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary [&>svg]:h-4 [&>svg]:w-4">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full h-9 rounded-md border bg-surface px-3 text-sm text-content placeholder:text-content-tertiary',
          'transition-all outline-none',
          'focus:border-line-focus focus:ring-2 focus:ring-primary/20',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : 'border-line hover:border-line-strong',
          leftIcon && 'pl-9',
          rightSlot && 'pr-9',
          className
        )}
        {...props}
      />
      {rightSlot && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary">
          {rightSlot}
        </span>
      )}
    </div>
  );
});

/* ─── Textarea ───────────────────────────────────────────────── */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[80px] rounded-md border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-tertiary',
        'transition-all outline-none resize-y',
        'focus:border-line-focus focus:ring-2 focus:ring-primary/20',
        error
          ? 'border-danger focus:border-danger focus:ring-danger/20'
          : 'border-line hover:border-line-strong',
        className
      )}
      {...props}
    />
  );
});

/* ─── Field label + error helper ─────────────────────────────── */

export function FieldLabel({ children, htmlFor, required, className }: {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 block text-xs font-semibold text-content-secondary', className)}>
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
  );
}

export function FieldError({ children, className }: { children?: ReactNode; className?: string }): React.JSX.Element | null {
  if (!children) return null;
  return <p className={cn('mt-1.5 text-xs text-danger', className)}>{children}</p>;
}
