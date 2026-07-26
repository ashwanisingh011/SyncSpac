'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { WorkspaceRoleOption } from '@/types/workspace';
import { formatRoleLabel } from '@/lib/rolePresentation';

interface RoleSelectProps {
  value: string;
  roles: WorkspaceRoleOption[];
  onChange: (roleCode: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md';
}

export default function RoleSelect({
  value,
  roles,
  onChange,
  disabled = false,
  loading = false,
  placeholder = 'Select role',
  size = 'md',
}: RoleSelectProps) {
  const isDisabled = disabled || loading || roles.length === 0;

  return (
    <div className="relative w-full">
      <select
        value={value}
        disabled={isDisabled}
        onChange={(event) => onChange(event.target.value)}
        className={clsx(
          'w-full appearance-none rounded-lg border bg-surface font-medium text-content outline-none transition',
          'focus:border-line-focus focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60',
          '',
          size === 'sm' ? 'h-9 px-3 pr-9 text-xs' : 'h-10 px-3 pr-10 text-sm',
          value ? 'border-line-strong' : 'border-line text-content-tertiary',
        )}
      >
        {!value && <option value="">{placeholder}</option>}
        {roles.map((role) => (
          <option key={role.code} value={role.code}>
            {formatRoleLabel(role.code, role.name)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-content-tertiary">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </div>
  );
}
