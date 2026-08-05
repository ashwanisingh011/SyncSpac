'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/useOrganization';
import { useToast } from '@/context/useToast';
import { getWorkspaceRoles, inviteMember } from '@/api/workspace';
import { DASHBOARD_ROUTE } from '@/lib/postAuth';
import type { OrgRole, WorkspaceRoleOption } from '@/types/workspace';
import RoleSelect from '@/components/workspace/RoleSelect';
import StepIndicator from '@/components/onboarding/StepIndicator';
import { motion, AnimatePresence } from 'motion/react';
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
      <StepIndicator current={1} className="mb-8" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="rounded-2xl border border-line bg-surface p-7 shadow-raised"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.12 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle"
          >
            <Users className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-lg font-semibold text-content">
              Invite your team
            </h1>
            <p className="text-xs text-content-tertiary">
              {currentOrg?.name
                ? `Add members to "${currentOrg.name}"`
                : 'Add teammates to your organization.'}
            </p>
          </div>
        </div>

        {/* Invite form */}
        <form onSubmit={handleSendInvites} className="space-y-3">
          <AnimatePresence initial={false}>
          {rows.map((row) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="flex items-center gap-2 overflow-visible"
            >
              {/* Email */}
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
                <input
                  type="email"
                  value={row.email}
                  onChange={(e) =>
                    updateRow(row.id, { email: e.target.value, status: 'idle', error: undefined })
                  }
                  placeholder="colleague@company.com"
                  disabled={row.status === 'sent'}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-surface text-content outline-none transition-all placeholder:text-content-tertiary
                    ${row.status === 'error'
                      ? 'border-danger focus:ring-2 focus:ring-danger/20'
                      : row.status === 'sent'
                        ? 'border-success bg-success/8'
                        : 'border-line hover:border-line-strong focus:border-line-focus focus:ring-2 focus:ring-primary/20'
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
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : row.status === 'sending' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-content-tertiary" />
                ) : (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-1 text-content-tertiary hover:text-danger transition-colors rounded cursor-pointer"
                    aria-label="Remove row"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>

          {/* Error messages */}
          {rows.some((r) => r.status === 'error') && (
            <div className="space-y-1">
              {rows
                .filter((r) => r.status === 'error')
                .map((r) => (
                  <p key={r.id} className="text-xs text-danger">
                    {r.email}: {r.error}
                  </p>
                ))}
            </div>
          )}

          {/* Add row */}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add another
          </button>

          {/* Actions */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSending}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-content hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
              className="px-4 py-2.5 text-sm font-medium text-content-tertiary hover:text-content transition-colors rounded-xl hover:bg-surface-hover"
            >
              Skip for now
            </Link>
          </div>
        </form>
      </motion.div>

      <p className="mt-4 text-center text-xs text-content-tertiary">
        You can always invite teammates later from{' '}
        <Link href="/workspace/members" className="text-primary hover:underline">
          Workspace → Members
        </Link>
        .
      </p>
    </div>
  );
}
