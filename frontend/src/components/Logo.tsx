"use client";

import { useId } from 'react';
import { cn } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────
   SyncSpac brand mark — layered "spaces" glyph.
   A solid top plane over two receding echo chevrons: spaces,
   kept in sync. Drawn as a standalone glyph (no container box).
   ──────────────────────────────────────────────────────────────── */

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  // Unique gradient id per instance — SVG ids are document-global.
  const id = useId();
  const gradId = `ss-mark-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4B9BFF" />
          <stop offset="55%" stopColor="#3D7BFA" />
          <stop offset="100%" stopColor="#6E5AF0" />
        </linearGradient>
      </defs>

      {/* Receding echo planes */}
      <path
        d="M5.5 21.5 L16 27.5 L26.5 21.5"
        stroke={`url(#${gradId})`}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.32"
      />
      <path
        d="M5.5 16 L16 22 L26.5 16"
        stroke={`url(#${gradId})`}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.62"
      />

      {/* Top plane — solid, rounded joins */}
      <path
        d="M16 3.5 L27 9.75 L16 16 L5 9.75 Z"
        fill={`url(#${gradId})`}
        stroke={`url(#${gradId})`}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Full lockup ────────────────────────────────────────────── */

interface LogoProps {
  /** Mark size in px; wordmark scales with it. */
  size?: number;
  /** Force light (white) wordmark for on-dark surfaces. */
  onDark?: boolean;
  /** Hide the wordmark, render only the glyph. */
  markOnly?: boolean;
  className?: string;
}

export default function Logo({ size = 26, onDark = false, markOnly = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex select-none items-center', className)} style={{ gap: size * 0.32 }}>
      <LogoMark size={size} />
      {!markOnly && (
        <span
          className={cn(
            'font-semibold leading-none tracking-[-0.025em]',
            onDark ? 'text-white' : 'text-content'
          )}
          style={{ fontSize: size * 0.66 }}
        >
          Sync<span className={onDark ? 'text-white/60' : 'text-content-tertiary'}>Spac</span>
        </span>
      )}
    </span>
  );
}
