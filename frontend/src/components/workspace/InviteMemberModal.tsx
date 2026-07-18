'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { X, Mail, Link2, Copy, CheckCheck, Loader2, Users } from 'lucide-react';
import type { InviteMemberFormData, OrgRole, WorkspaceRoleOption } from '@/types/workspace';
import RoleSelect from '@/components/workspace/RoleSelect';

export interface TeamOption {
  id: string;
  name: string;
}

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: InviteMemberFormData) => Promise<void>;
  roles: WorkspaceRoleOption[];
  rolesLoading?: boolean;
  teams?: TeamOption[];
  /** Optionally pass a pre-generated invite link URL to show in the "copy link" tab */
  inviteLink?: string;
  onGenerateLink?: (role: OrgRole) => Promise<string>;
}

type Tab = 'email' | 'link';

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
  roles,
  rolesLoading = false,
  teams = [],
  onGenerateLink,
}: InviteMemberModalProps) {
  const [tab, setTab] = useState<Tab>('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('');
  const [teamId, setTeamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTeamId('');
  }, [isOpen]);

  useEffect(() => {
    if (!roles.length) return;
    if (role && roles.some((item) => item.code === role)) return;
    setRole(roles[0].code);
  }, [role, roles]);

  const handleSubmitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!role) {
      setError('Please choose a role before sending the invitation.');
      return;
    }
    setIsLoading(true);
    try {
      await onInvite({
        email: email.trim().toLowerCase(),
        role,
        ...(teamId ? { teamId } : {}),
      });
      setEmail('');
      setRole(roles[0]?.code ?? '');
      setTeamId('');
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to send invite. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!onGenerateLink) return;
    if (!role) {
      setError('Select a role first.');
      return;
    }
    setIsGenerating(true);
    try {
      const link = await onGenerateLink(role);
      setGeneratedLink(link);
    } catch {
      setError('Failed to generate link.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAndClose = () => {
    setEmail('');
    setRole(roles[0]?.code ?? '');
    setTeamId('');
    setError('');
    setGeneratedLink('');
    setCopied(false);
    setTab('email');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="invite-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={resetAndClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="invite-modal-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Add team member
          </h2>
          <button
            onClick={resetAndClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
          {([
            { id: 'email', label: 'Email invite', icon: Mail },
            // comment out if invite link feature develope
            // { id: 'link', label: 'Invite link', icon: Link2 },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setError(''); }}
              className={`flex items-center gap-1.5 py-3 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">
          {/* ── Role selector (shared between both tabs) ── */}
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
              Role
            </p>
            <RoleSelect
              value={role}
              roles={roles}
              onChange={setRole}
              loading={rolesLoading}
            />
          </div>

          {/* ── Email tab ── */}
          {tab === 'email' && (
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <label
                  htmlFor="invite-email"
                  className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/30"
                  />
                </div>
              </div>

              {teams.length > 0 && (
                <div>
                  <label
                    htmlFor="invite-team"
                    className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
                  >
                    Team <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                      id="invite-team"
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all appearance-none bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/30"
                    >
                      <option value="">No specific team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}


              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Send invitation
                </button>
              </div>
            </form>
          )}

          {/* ── Link tab ── */}
          {tab === 'link' && (
            <div className="space-y-4">
              {!generatedLink ? (
                <div className="text-center py-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Generate a shareable invite link with the selected role. Anyone
                    with the link can join your organization.
                  </p>
                  <button
                    onClick={handleGenerateLink}
                    disabled={isGenerating || !onGenerateLink || !role}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    {isGenerating ? 'Generating…' : 'Generate invite link'}
                  </button>
                  {!onGenerateLink && (
                    <p className="mt-2 text-xs text-slate-400">
                      Invite link generation requires admin permissions.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Share this link — it expires in 72 hours.
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                    <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate font-mono">
                      {generatedLink}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors dark:hover:bg-blue-950/30"
                      aria-label="Copy link"
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setGeneratedLink('')}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Generate a new link
                  </button>
                </div>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
