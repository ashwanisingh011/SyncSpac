'use client';

import { useState, useEffect, useCallback } from 'react';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import MembersTable from '@/components/workspace/MembersTable';
import InviteMemberModal, { type TeamOption } from '@/components/workspace/InviteMemberModal';
import type { WorkspaceMember, InviteMemberFormData, OrgRole, WorkspaceRoleOption } from '@/types/workspace';
import {
  getWorkspaceMembers,
  getWorkspaceRoles,
  inviteMember,
  updateMemberRole,
  removeMember,
} from '@/api/workspace';
import { getTeams } from '@/api/teams';
import { useOrganization } from '@/context/useOrganization';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { Plus, Search, Loader2, Users, X, RefreshCw, AlertCircle } from 'lucide-react';
import { canManageWorkspaceMembers } from '@/lib/workspaceAccess';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

// ── Skeleton loader rows ─────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[minmax(220px,1fr)_140px_110px_130px_auto] items-center gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          <div className="h-2.5 w-48 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
      <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
      <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
      <div className="w-9" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[minmax(220px,1fr)_140px_110px_130px_auto] items-center gap-4 px-5 py-3 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        {['Member', 'Role', 'Status', 'Joined', ''].map((col, i) => (
          <span key={i} className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {col}
          </span>
        ))}
      </div>
      {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
    </div>
  );
}

export default function MembersPage() {
  const { currentOrg, isOrgReady, setOrganizationMemberCount } = useOrganization();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [roles, setRoles] = useState<WorkspaceRoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const orgId = currentOrg?.id ?? '';
  const authUser = user as { id?: string; _id?: string } | null;
  const currentUserId = authUser?.id ?? authUser?._id
    ? String(authUser.id ?? authUser._id)
    : undefined;

  const fetchMembers = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getWorkspaceMembers(orgId);
      setMembers(data);
      setOrganizationMemberCount(orgId, data.length);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const friendly =
        status === 429
          ? 'Too many requests. Please wait a moment and try again.'
          : status === 403
            ? 'You do not have access to view members in this organization.'
            : getFriendlyApiErrorMessage(err, 'We could not load members. Please try again.');
      setLoadError(friendly);
      showToast(friendly, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, setOrganizationMemberCount, showToast]);

  const fetchRoles = useCallback(async () => {
    if (!orgId) {
      setRoles([]);
      return;
    }
    setRolesLoading(true);
    try {
      const data = await getWorkspaceRoles(orgId);
      const HIDDEN_ROLES = ['hr', 'guest', 'admin', 'member'];
      setRoles(data.roles.filter((r) => !HIDDEN_ROLES.includes(r.code.toLowerCase())));
    } catch {
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!isOrgReady) return;
    if (!orgId) {
      setIsLoading(false);
      setMembers([]);
      setTeams([]);
      return;
    }
    fetchMembers();
    fetchRoles();
    getTeams()
      .then((data) => setTeams(data.map((t) => ({ id: t._id, name: t.name }))))
      .catch(() => setTeams([]));
  }, [fetchMembers, fetchRoles, isOrgReady, orgId]);

  const handleInvite = async (data: InviteMemberFormData) => {
    if (!orgId) return;
    try {
      await inviteMember(orgId, data);
      showToast(`Invite sent to ${data.email}`, 'success');
      await fetchMembers();
    } catch (err: unknown) {
      showToast(getFriendlyApiErrorMessage(err, 'We could not send that invite. Please try again.'), 'error');
      throw err;
    }
  };

  const handleRoleChange = async (userId: string, role: OrgRole) => {
    if (!orgId) return;
    try {
      const updated = await updateMemberRole(orgId, userId, role);
      const next = members.map((m) =>
        m.userId === userId ? { ...m, ...updated } : m,
      );
      setMembers(next);
      setOrganizationMemberCount(orgId, next.length);
      showToast('Role updated successfully.', 'success');
    } catch (err: unknown) {
      showToast(getFriendlyApiErrorMessage(err, 'We could not update that role. Please try again.'), 'error');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!orgId) return;
    try {
      await removeMember(orgId, userId);
      const next = members.filter((m) => m.userId !== userId);
      setMembers(next);
      setOrganizationMemberCount(orgId, next.length);
      showToast('Member removed from organization.', 'success');
    } catch (err: unknown) {
      showToast(getFriendlyApiErrorMessage(err, 'We could not remove that member. Please try again.'), 'error');
    }
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Org loading spinner ──────────────────────────────────────────────────
  if (!isOrgReady) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex flex-col gap-6">
        <WorkspaceHeader
          title="Team Members"
          subtitle="No organization selected."
        />
      </div>
    );
  }

  const currentCapabilities = currentOrg?.capabilities ?? {
    canManageMembers: false,
    canManageWorkspace: false,
    canDeleteWorkspace: false,
    canCreateProject: false,
    canManageProjects: false,
    canManageBilling: false,
  };
  const canInvite = canManageWorkspaceMembers(currentOrg);

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        title="Team Members"
        subtitle={`${members.length} member${members.length !== 1 ? 's' : ''} in ${currentOrg?.name ?? 'your organization'}`}
        action={
          canInvite ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          ) : undefined
        }
      />

      {/* Search bar */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content area */}
      {isLoading ? (
        <SkeletonTable />
      ) : loadError ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 px-6 py-12 flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Could not load members
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400 max-w-sm">{loadError}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchMembers()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      ) : members.length === 0 ? (
        // Empty state — no members at all
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No members yet</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Invite your first teammate to get started.
            </p>
          </div>
          {canInvite && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        // No search results
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-16 flex flex-col items-center gap-3 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No results found</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              No members match &ldquo;{search}&rdquo;
            </p>
          </div>
          <button
            onClick={() => setSearch('')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <MembersTable
          members={filtered}
          roles={roles}
          roleOptionsLoading={rolesLoading}
          currentUserCapabilities={currentCapabilities}
          currentUserId={currentUserId}
          onRoleChange={handleRoleChange}
          onRemove={handleRemove}
        />
      )}

      <InviteMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInvite={handleInvite}
        roles={roles}
        rolesLoading={rolesLoading}
        teams={teams}
      />
    </div>
  );
}
