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
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={resetAndClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2
            id="invite-modal-title"
            className="text-base font-semibold text-content"
          >
            Add team member
          </h2>
          <button
            onClick={resetAndClose}
            className="p-1 text-content-tertiary hover:text-content hover:bg-surface-hover rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line px-6">
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
                  ? 'border-primary text-primary'
                  : 'border-transparent text-content-tertiary hover:text-content'
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
            <p className="text-sm font-medium text-content-secondary mb-2">
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
                  className="block text-sm font-medium text-content-secondary mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-line-strong text-sm outline-none focus:border-line-focus focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {teams.length > 0 && (
                <div>
                  <label
                    htmlFor="invite-team"
                    className="block text-sm font-medium text-content-secondary mb-1.5"
                  >
                    Team <span className="font-normal text-content-tertiary">(optional)</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
                    <select
                      id="invite-team"
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-line-strong text-sm outline-none focus:border-line-focus focus:ring-2 focus:ring-primary/20 transition-all appearance-none bg-surface"
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
                  className="flex-1 rounded-xl border border-line-strong px-4 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-content hover:bg-primary-hover focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
                  <p className="text-sm text-content-tertiary mb-4">
                    Generate a shareable invite link with the selected role. Anyone
                    with the link can join your organization.
                  </p>
                  <button
                    onClick={handleGenerateLink}
                    disabled={isGenerating || !onGenerateLink || !role}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-content hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    {isGenerating ? 'Generating…' : 'Generate invite link'}
                  </button>
                  {!onGenerateLink && (
                    <p className="mt-2 text-xs text-content-tertiary">
                      Invite link generation requires admin permissions.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-content-tertiary">
                    Share this link — it expires in 72 hours.
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-sunken px-3 py-2">
                    <span className="flex-1 text-xs text-content-secondary truncate font-mono">
                      {generatedLink}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 p-1 rounded-md text-content-tertiary hover:text-primary hover:bg-primary-subtle transition-colors"
                      aria-label="Copy link"
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => setGeneratedLink('')}
                    className="text-xs text-content-tertiary hover:text-content"
                  >
                    Generate a new link
                  </button>
                </div>
              )}
              {error && <p className="text-xs text-danger">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
