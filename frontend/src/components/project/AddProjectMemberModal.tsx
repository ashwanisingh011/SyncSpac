'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Search, UserPlus, Loader2, CheckCircle2, Users } from 'lucide-react';
import { getWorkspaceMembers } from '@/api/workspace';
import { assignUserToProject } from '@/api/projects';
import { useToast } from '@/context/useToast';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';
import type { WorkspaceMember } from '@/types/workspace';

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
];

const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return initials || 'U';
};

interface AddProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  projectId: string;
  projectName: string;
  /** User IDs already part of the project — these are hidden from the picker */
  existingMemberIds: string[];
  onMemberAdded?: () => void;
}

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'developer', label: 'Developer' },
  { value: 'qa_tester', label: 'QA Tester' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'project_manager', label: 'Project Manager' },
];

export default function AddProjectMemberModal({
  isOpen,
  onClose,
  orgId,
  projectId,
  projectName,
  existingMemberIds,
  onMemberAdded,
}: AddProjectMemberModalProps) {
  const { showToast } = useToast();

  const [orgMembers, setOrgMembers] = useState<WorkspaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<WorkspaceMember[]>([]);
  const [selectedRole, setSelectedRole] = useState('member');
  const [adding, setAdding] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Load org members when modal opens
  useEffect(() => {
    if (!isOpen || !orgId) return;

    let isMounted = true;
    setLoadingMembers(true);
    setSearchQuery('');
    setSelectedMembers([]);
    setSelectedRole('member');
    setAddedIds(new Set());

    getWorkspaceMembers(orgId)
      .then((members) => {
        if (isMounted) setOrgMembers(members.filter((m) => m.status === 'active'));
      })
      .catch(() => {
        if (isMounted) setOrgMembers([]);
      })
      .finally(() => {
        if (isMounted) setLoadingMembers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, orgId]);

  // Already-in-project IDs includes both the prop set and any we just added this session
  const alreadyAddedIds = useMemo(
    () => new Set([...existingMemberIds, ...addedIds]),
    [existingMemberIds, addedIds]
  );

  // Filter to org members not yet in the project
  const availableMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orgMembers.filter((m) => {
      if (alreadyAddedIds.has(m.userId)) return false;
      if (!query) return true;
      return (
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        (m.roleName ?? m.role ?? '').toLowerCase().includes(query)
      );
    });
  }, [orgMembers, alreadyAddedIds, searchQuery]);

  const handleAdd = async () => {
    if (selectedMembers.length === 0 || adding) return;

    setAdding(true);
    try {
      await Promise.all(
        selectedMembers.map((m) =>
          assignUserToProject(projectId, m.userId, selectedRole)
        )
      );
      
      setAddedIds((prev) => {
        const next = new Set(prev);
        selectedMembers.forEach((m) => next.add(m.userId));
        return next;
      });
      
      showToast(
        selectedMembers.length === 1
          ? `${selectedMembers[0].name} added to ${projectName}`
          : `Added ${selectedMembers.length} members to ${projectName}`,
        'success'
      );
      setSelectedMembers([]);
      setSelectedRole('member');
      onMemberAdded?.();
    } catch (err: unknown) {
      showToast(
        getFriendlyApiErrorMessage(err, 'Could not add some members. Please try again.'),
        'error'
      );
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-project-member-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2
              id="add-project-member-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Add Member to Project
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Select an existing org member to add to{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {projectName}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              autoFocus
            />
          </div>
        </div>

        {/* ── Member list ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loadingMembers ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading members…</span>
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
              <Users className="h-8 w-8 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium">
                {searchQuery.trim()
                  ? 'No matching members found'
                  : 'All org members are already in this project'}
              </p>
              {searchQuery.trim() && (
                <p className="text-xs text-slate-400">Try a different name or email.</p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800" role="listbox">
              {availableMembers.map((member, index) => {
                const isSelected = selectedMembers.some((m) => m.userId === member.userId);
                const wasJustAdded = addedIds.has(member.userId);
                return (
                  <li key={member.userId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMembers((prev) => prev.filter((m) => m.userId !== member.userId));
                        } else {
                          setSelectedMembers((prev) => [...prev, member]);
                        }
                      }}
                      disabled={wasJustAdded}
                      className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/30'
                          : wasJustAdded
                          ? 'cursor-default opacity-50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Avatar */}
                      <span
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${
                          member.avatarUrl
                            ? 'bg-slate-200 dark:bg-slate-700'
                            : AVATAR_COLORS[index % AVATAR_COLORS.length]
                        }`}
                      >
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(member.name)
                        )}
                      </span>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {member.email}
                        </p>
                      </div>

                      {/* Role badge */}
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {member.roleName ?? member.role ?? 'Member'}
                      </span>

                      {/* Selection indicator */}
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Footer — visible when members are selected ───────────────────── */}
        {selectedMembers.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 animate-fadeIn">
            <div className="flex flex-col gap-3">
              {/* Selected members chip list */}
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto min-w-0 p-1 bg-slate-100/40 dark:bg-slate-950/20 rounded-lg border border-slate-100 dark:border-slate-800/60">
                {selectedMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100/30 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 shrink-0"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[8px] font-extrabold text-white uppercase">
                      {getInitials(m.name)}
                    </span>
                    <span className="truncate max-w-[120px]">{m.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMembers((prev) => prev.filter((sm) => sm.userId !== m.userId))}
                      className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer"
                      aria-label={`Deselect ${m.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 min-w-[70px]">
                  Role for all:
                </span>
                
                {/* Role selector */}
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 cursor-pointer"
                  aria-label="Role for new members"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Add button */}
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
