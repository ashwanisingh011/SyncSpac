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
          'w-full appearance-none rounded-lg border bg-white font-medium text-slate-800 outline-none transition',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-900/30',
          size === 'sm' ? 'h-9 px-3 pr-9 text-xs' : 'h-10 px-3 pr-10 text-sm',
          value ? 'border-slate-300' : 'border-slate-200 text-slate-500',
        )}
      >
        {!value && <option value="">{placeholder}</option>}
        {roles.map((role) => (
          <option key={role.code} value={role.code}>
            {formatRoleLabel(role.code, role.name)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </div>
  );
}
