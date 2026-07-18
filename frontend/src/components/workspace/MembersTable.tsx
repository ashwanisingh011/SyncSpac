'use client';

import { useState } from 'react';
import { AlertTriangle, Crown, Loader2, Search, Trash2, UserRound, X } from 'lucide-react';
import clsx from 'clsx';
import type { WorkspaceMember, WorkspaceRoleCapabilities, WorkspaceRoleOption } from '@/types/workspace';
import OrgRoleBadge from '@/components/workspace/OrgRoleBadge';
import RoleSelect from '@/components/workspace/RoleSelect';

interface MembersTableProps {
  members: WorkspaceMember[];
  roles: WorkspaceRoleOption[];
  roleOptionsLoading?: boolean;
  currentUserCapabilities: WorkspaceRoleCapabilities;
  currentUserId?: string;
  onRoleChange: (userId: string, role: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

function Avatar({ member }: { member: WorkspaceMember }) {
  const initials = member.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white overflow-hidden shrink-0">
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

function formatJoinedDate(joinedAt: string): string {
  const date = new Date(joinedAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusPill({ status }: { status: WorkspaceMember['status'] }) {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
    pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  } as const;

  const labels = {
    active: 'Active',
    pending: 'Invited',
    inactive: 'Inactive',
  } as const;

  return (
    <span className={clsx('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', styles[status])}>
      {labels[status]}
    </span>
  );
}

interface ConfirmRemoveModalProps {
  member: WorkspaceMember;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmRemoveModal({
  member,
  loading,
  onConfirm,
  onCancel,
}: ConfirmRemoveModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Remove member?</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">{member.name}</span> will lose
              access to this organization immediately.
            </p>
          </div>
          <div className="flex w-full gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembersTable({
  members,
  roles,
  roleOptionsLoading = false,
  currentUserCapabilities,
  currentUserId,
  onRoleChange,
  onRemove,
}: MembersTableProps) {
  const [rowRoleLoading, setRowRoleLoading] = useState<string | null>(null);
  const [confirmMember, setConfirmMember] = useState<WorkspaceMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const canManage = currentUserCapabilities.canManageMembers;

  const handleConfirmRemove = async () => {
    if (!confirmMember) return;
    setRemoveLoading(true);
    try {
      await onRemove(confirmMember.userId);
      setConfirmMember(null);
    } finally {
      setRemoveLoading(false);
    }
  };

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">No members match your search.</p>
      </div>
    );
  }

  return (
    <>
      {confirmMember && (
        <ConfirmRemoveModal
          member={confirmMember}
          loading={removeLoading}
          onConfirm={handleConfirmRemove}
          onCancel={() => setConfirmMember(null)}
        />
      )}      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid min-w-[860px] grid-cols-[minmax(240px,1fr)_190px_120px_140px_64px] items-center gap-6 border-b border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
          {['Member', 'Role', 'Status', 'Joined', ''].map((column, index) => (
            <span
              key={column}
              className={clsx(
                'text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500',
                index === 4 && 'text-right',
              )}
            >
              {column}
            </span>
          ))}
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {members.map((member) => {
            const isSelf = Boolean(currentUserId && member.userId === currentUserId);
            const isOwner = member.role === 'owner';
            const canEditRole = canManage && !isSelf && !isOwner && member.status === 'active';
            const isRoleLoading = rowRoleLoading === member.userId;

            return (
              <div
                key={member.id}
                className="grid min-w-[860px] grid-cols-[minmax(240px,1fr)_190px_120px_140px_64px] items-center gap-6 px-6 py-4 transition-all duration-200 hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative shrink-0">
                    <Avatar member={member} />
                    {member.status === 'active' && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{member.name}</p>
                      {isSelf && (
                        <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                          You
                        </span>
                      )}
                      {isOwner && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                  </div>
                </div>

                <div className="min-w-0">
                  {canEditRole ? (
                    <div className="relative">
                      {isRoleLoading && <Loader2 className="absolute -left-5 top-3 h-4 w-4 animate-spin text-slate-400" />}
                      <RoleSelect
                        size="sm"
                        value={member.role}
                        roles={roles}
                        loading={roleOptionsLoading || isRoleLoading}
                        onChange={async (nextRole) => {
                          setRowRoleLoading(member.userId);
                          try {
                            await onRoleChange(member.userId, nextRole);
                          } finally {
                            setRowRoleLoading(null);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <OrgRoleBadge role={member.role} label={member.roleName} />
                  )}
                </div>

                <StatusPill status={member.status} />

                <span className="text-sm text-slate-500 dark:text-slate-400">{formatJoinedDate(member.joinedAt)}</span>

                <div className="flex justify-end">
                  {canManage && !isSelf && !isOwner ? (
                    <button
                      type="button"
                      onClick={() => setConfirmMember(member)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center text-slate-300 dark:text-slate-700">
                      <UserRound className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-4">
        {members.map((member) => {
          const isSelf = Boolean(currentUserId && member.userId === currentUserId);
          const isOwner = member.role === 'owner';
          const canEditRole = canManage && !isSelf && !isOwner && member.status === 'active';
          const isRoleLoading = rowRoleLoading === member.userId;

          return (
            <div key={member.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5 space-y-4 shadow-sm">
              {/* User Avatar, Name, Email and Crown/You Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar member={member} />
                    {member.status === 'active' && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{member.name}</p>
                      {isSelf && (
                        <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shrink-0">
                          You
                        </span>
                      )}
                      {isOwner && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                  </div>
                </div>

                {/* Remove Action */}
                <div className="shrink-0">
                  {canManage && !isSelf && !isOwner ? (
                    <button
                      type="button"
                      onClick={() => setConfirmMember(member)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 cursor-pointer"
                      aria-label={`Remove ${member.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center text-slate-300 dark:text-slate-700">
                      <UserRound className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>

              {/* Role, Status & Joined Info */}
              <div className="grid grid-cols-3 gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Role</span>
                  <div className="mt-1">
                    {canEditRole ? (
                      <div className="relative">
                        {isRoleLoading && <Loader2 className="absolute -left-5 top-2.5 h-3.5 w-3.5 animate-spin text-slate-400" />}
                        <RoleSelect
                          size="sm"
                          value={member.role}
                          roles={roles}
                          loading={roleOptionsLoading || isRoleLoading}
                          onChange={async (nextRole) => {
                            setRowRoleLoading(member.userId);
                            try {
                              await onRoleChange(member.userId, nextRole);
                            } finally {
                              setRowRoleLoading(null);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <OrgRoleBadge role={member.role} label={member.roleName} />
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Status</span>
                  <div className="mt-1">
                    <StatusPill status={member.status} />
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Joined</span>
                  <span className="text-slate-600 dark:text-slate-350 block mt-1.5 font-medium leading-none">
                    {formatJoinedDate(member.joinedAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
