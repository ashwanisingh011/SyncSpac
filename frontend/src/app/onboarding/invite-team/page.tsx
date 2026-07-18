'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/useOrganization';
import { useToast } from '@/context/useToast';
import { getWorkspaceRoles, inviteMember } from '@/api/workspace';
import { DASHBOARD_ROUTE } from '@/lib/postAuth';
import type { OrgRole, WorkspaceRoleOption } from '@/types/workspace';
import RoleSelect from '@/components/workspace/RoleSelect';
import {
  ArrowRight,
  Users,
  Mail,
  Plus,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

const ONBOARDING_STEPS = ['Organization details', 'Invite members', 'Start building'];

interface InviteRow {
  id: string;
  email: string;
  role: OrgRole;
  status: 'idle' | 'sending' | 'sent' | 'error';
  error?: string;
}

let _id = 0;
const uid = () => String(++_id);

export default function InviteTeamPage() {
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();

  const [rows, setRows] = useState<InviteRow[]>([
    { id: uid(), email: '', role: '', status: 'idle' },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [roles, setRoles] = useState<WorkspaceRoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const orgId = currentOrg?.id ?? '';

  // ── Row helpers ────────────────────────────────────────────────────────────
  const addRow = () =>
    setRows((prev) => [...prev, { id: uid(), email: '', role: roles[0]?.code ?? '', status: 'idle' }]);

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const updateRow = (id: string, patch: Partial<InviteRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  useEffect(() => {
    if (!orgId) return;
    setRolesLoading(true);
    getWorkspaceRoles(orgId)
      .then((data) => {
        const HIDDEN_ROLES = ['hr', 'guest', 'admin', 'member'];
        const filteredRoles = data.roles.filter((r) => !HIDDEN_ROLES.includes(r.code.toLowerCase()));
        setRoles(filteredRoles);
        setRows((prev) =>
          prev.map((row) => ({
            ...row,
            role: row.role || filteredRoles[0]?.code || '',
          })),
        );
      })
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, [orgId]);

  // ── Send invites ───────────────────────────────────────────────────────────
  const handleSendInvites = async (e: FormEvent) => {
    e.preventDefault();

    const toSend = rows.filter((r) => r.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
    if (!toSend.length) {
      showToast('Add at least one valid email.', 'error');
      return;
    }
    if (!orgId) {
      showToast('No organization found.', 'error');
      return;
    }

    setIsSending(true);

    const results = await Promise.allSettled(
      toSend.map((r) =>
        inviteMember(orgId, { email: r.email.trim().toLowerCase(), role: r.role })
          .then(() => ({ id: r.id, ok: true }))
          .catch((err: unknown) => ({
            id: r.id,
            ok: false,
            msg:
              (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Failed to send.',
          })),
      ),
    );

    let allOk = true;
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        const { id, ok, msg } = res.value as { id: string; ok: boolean; msg?: string };
        updateRow(id, { status: ok ? 'sent' : 'error', error: msg });
        if (!ok) allOk = false;
      }
    });

    setIsSending(false);

    if (allOk) {
      showToast('Invites sent! Redirecting…', 'success');
      const isOrgAdmin = currentOrg?.myRole === 'owner' || currentOrg?.myRole === 'admin' || currentOrg?.myRole === 'org_admin';
      const target = isOrgAdmin ? '/dashboard' : DASHBOARD_ROUTE;
      setTimeout(() => router.push(target), 1200);
    } else {
      showToast('Some invites failed. Review and retry.', 'error');
    }
  };

  return (
    <div className="w-full max-w-xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {ONBOARDING_STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < 1
                  ? 'bg-blue-600 text-white'
                  : i === 1
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
            >
              {i < 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={`hidden sm:inline text-xs font-medium ${
                i === 1
                  ? 'text-blue-600 dark:text-blue-400'
                  : i < 1
                    ? 'text-slate-400 line-through dark:text-slate-600'
                    : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {step}
            </span>
            {i < ONBOARDING_STEPS.length - 1 && (
              <div
                className={`w-8 h-px ${
                  i < 1 ? 'bg-blue-400' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Invite your team
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentOrg?.name
                ? `Add members to "${currentOrg.name}"`
                : 'Add teammates to your organization.'}
            </p>
          </div>
        </div>

        {/* Invite form */}
        <form onSubmit={handleSendInvites} className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              {/* Email */}
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={row.email}
                  onChange={(e) =>
                    updateRow(row.id, { email: e.target.value, status: 'idle', error: undefined })
                  }
                  placeholder="colleague@company.com"
                  disabled={row.status === 'sent'}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none transition-all
                    dark:bg-slate-900 dark:text-slate-100
                    ${row.status === 'error'
                      ? 'border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-700'
                      : row.status === 'sent'
                        ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-700'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:focus:ring-blue-900/30'
                    }`}
                />
              </div>

              {/* Role */}
              <div className="w-44 shrink-0">
                <RoleSelect
                value={row.role}
                roles={roles}
                loading={rolesLoading}
                size="sm"
                onChange={(nextRole) => updateRow(row.id, { role: nextRole as OrgRole })}
                disabled={row.status === 'sent'}
                />
              </div>

              {/* Status icon or remove */}
              <div className="w-7 flex items-center justify-center">
                {row.status === 'sent' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : row.status === 'sending' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded"
                    aria-label="Remove row"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Error messages */}
          {rows.some((r) => r.status === 'error') && (
            <div className="space-y-1">
              {rows
                .filter((r) => r.status === 'error')
                .map((r) => (
                  <p key={r.id} className="text-xs text-red-500">
                    {r.email}: {r.error}
                  </p>
                ))}
            </div>
          )}

          {/* Add row */}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add another
          </button>

          {/* Actions */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSending}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending invites…
                </>
              ) : (
                <>
                  Send invites
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Skip */}
            <Link
              href={currentOrg?.myRole === 'owner' || currentOrg?.myRole === 'admin' || currentOrg?.myRole === 'org_admin' ? '/dashboard' : DASHBOARD_ROUTE}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Skip for now
            </Link>
          </div>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-600">
        You can always invite teammates later from{' '}
        <Link href="/workspace/members" className="text-blue-600 hover:underline dark:text-blue-400">
          Workspace → Members
        </Link>
        .
      </p>
    </div>
  );
}
