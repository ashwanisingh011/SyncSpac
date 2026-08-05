"use client";

import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-violet-600',
  'bg-emerald-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-cyan-600',
  'bg-fuchsia-600',
  'bg-teal-600',
] as const;

/** Deterministic color from a display name (consistent across the app). */
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
  title?: string;
}

export function Avatar({ name, src, size = 'md', className, title }: AvatarProps): React.JSX.Element {
  return (
    <span
      title={title ?? name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white overflow-hidden select-none ring-2 ring-surface',
        SIZE_CLASSES[size],
        src ? 'bg-surface-hover' : avatarColor(name),
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        avatarInitials(name)
      )}
    </span>
  );
}

export interface AvatarStackProps {
  users: Array<{ name: string; src?: string | null }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

/** Overlapping avatar stack with a "+N" overflow chip. */
export function AvatarStack({ users, max = 4, size = 'sm', className }: AvatarStackProps): React.JSX.Element {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;
  return (
    <span className={cn('inline-flex items-center -space-x-1.5', className)}>
      {visible.map((u, i) => (
        <Avatar key={`${u.name}-${i}`} name={u.name} src={u.src} size={size} className="transition-transform hover:z-10 hover:-translate-y-0.5" />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-surface-hover font-semibold text-content-secondary ring-2 ring-surface',
            SIZE_CLASSES[size]
          )}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
