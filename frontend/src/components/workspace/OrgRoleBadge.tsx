'use client';

import { Crown, Eye, ShieldCheck, UserRound, Users, BriefcaseBusiness } from 'lucide-react';
import clsx from 'clsx';
import { formatRoleLabel } from '@/lib/rolePresentation';

interface OrgRoleBadgeProps {
  role: string;
  label?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const pickRoleAccent = (role: string): string => {
  const normalized = role.toLowerCase();
  if (normalized === 'owner') {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800';
  }
  if (normalized.includes('admin')) {
    return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800';
  }
  if (normalized.includes('guest') || normalized.includes('client')) {
    return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }
  if (normalized.includes('lead') || normalized.includes('manager')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800';
  }
  if (normalized === 'hr') {
    return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-800';
  }
  if (normalized.includes('qa') || normalized.includes('developer')) {
    return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-800';
  }
  return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800';
};

const pickRoleIcon = (role: string): React.ElementType => {
  const normalized = role.toLowerCase();
  if (normalized === 'owner') return Crown;
  if (normalized.includes('admin')) return ShieldCheck;
  if (normalized.includes('guest') || normalized.includes('client')) return Eye;
  if (normalized.includes('lead') || normalized.includes('manager')) return BriefcaseBusiness;
  if (normalized.includes('team')) return Users;
  return UserRound;
};

export default function OrgRoleBadge({
  role,
  label,
  size = 'sm',
  showIcon = true,
}: OrgRoleBadgeProps) {
  const resolvedRole = role || 'member';
  const Icon = pickRoleIcon(resolvedRole);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        pickRoleAccent(resolvedRole),
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      {formatRoleLabel(resolvedRole, label)}
    </span>
  );
}
