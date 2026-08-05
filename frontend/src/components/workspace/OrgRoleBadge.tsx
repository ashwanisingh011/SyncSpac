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
    return 'bg-warning/10 text-warning border-warning/25';
  }
  if (normalized.includes('admin')) {
    return 'bg-violet-50 text-violet-700 border-violet-200';
  }
  if (normalized.includes('guest') || normalized.includes('client')) {
    return 'bg-surface-hover text-content-secondary border-line';
  }
  if (normalized.includes('lead') || normalized.includes('manager')) {
    return 'bg-success/10 text-success border-success/25';
  }
  if (normalized === 'hr') {
    return 'bg-pink-50 text-pink-700 border-pink-200';
  }
  if (normalized.includes('qa') || normalized.includes('developer')) {
    return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  }
  return 'bg-primary-subtle text-primary border-primary/25';
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
