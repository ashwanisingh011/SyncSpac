'use client';

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/useOrganization';
import { useToast } from '@/context/useToast';
import { acceptInviteByToken } from '@/api/workspace';
import { useAuth } from '@/context/useAuth';
import { DASHBOARD_ROUTE } from '@/lib/postAuth';
import {
  getPendingInviteToken,
  clearPendingInviteToken,
  savePendingInviteToken,
  resolveInvitePostAuthRedirect,
} from '@/lib/inviteFlow';
import { extractInviteToken } from '@/lib/inviteToken';
import { ArrowLeft, Link2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function JoinOrgPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshOrganizations, currentOrg } = useOrganization();
  const { showToast } = useToast();

  const [token, setToken] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const pending = getPendingInviteToken();
    if (pending && !token) {
      setToken(pending);
      clearPendingInviteToken();
    }
  }, [token]);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    const t = extractInviteToken(token);
    if (!t) {
      setErrorMessage('Please paste a valid invite link or token.');
      setSubmitState('error');
      return;
    }

    if (!user) {
      savePendingInviteToken(t);
      const redirect = resolveInvitePostAuthRedirect('/onboarding/join-org');
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setSubmitState('loading');
    setErrorMessage('');

    try {
      // POST /api/organization/accept-invite/:token
      await acceptInviteByToken(t);

      // Refresh org list so context picks up the new membership
      await refreshOrganizations();

      setSubmitState('success');
      showToast('Welcome! You have joined the organization.', 'success');

      const isOrgAdmin = currentOrg?.myRole === 'owner' || currentOrg?.myRole === 'admin' || currentOrg?.myRole === 'org_admin';
      const target = isOrgAdmin ? '/dashboard' : DASHBOARD_ROUTE;
      setTimeout(() => router.push(target), 1200);
    } catch (err: unknown) {
      setSubmitState('error');
      const apiMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const msg =
        apiMessage ??
        (err instanceof Error ? err.message : 'Invalid or expired invite link.');
      const status = (err as { response?: { status?: number } })?.response?.status;
      const hint =
        status === 403
          ? ' Log out and sign in with the email that received the invite.'
          : msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')
            ? ' Ask your admin to send a fresh invite (old links may not work).'
            : '';
      setErrorMessage(msg + hint);
      showToast(msg, 'error');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    if (submitState !== 'idle') {
      setSubmitState('idle');
      setErrorMessage('');
    }
  };

  return (
    <div className="w-full max-w-lg">
      {/* Back */}
      <Link
        href="/onboarding/no-org"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Link2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Join an organization
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste your invite link or token. You must be logged in as the invited email.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label
              htmlFor="invite-token"
              className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
            >
              Invite link or token
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="invite-token"
                type="text"
                value={token}
                onChange={handleInputChange}
                placeholder="https://taskbridge.io/accept-invite/abc123 or just abc123"
                disabled={submitState === 'loading' || submitState === 'success'}
                className={clsx(
                  'w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border outline-none transition-all',
                  'dark:bg-slate-900 dark:text-slate-100',
                  submitState === 'error'
                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200 dark:bg-red-950/20 dark:border-red-700'
                    : submitState === 'success'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-700'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:focus:ring-blue-900/30',
                )}
              />
            </div>
          </div>

          {/* Error */}
          {submitState === 'error' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 dark:bg-red-950/20 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
            </div>
          )}

          {/* Success */}
          {submitState === 'success' && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 dark:bg-emerald-950/20 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Joined! Redirecting to workspace…
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!token.trim() || submitState === 'loading' || submitState === 'success'}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitState === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Joining…
              </span>
            ) : submitState === 'success' ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Joined!
              </span>
            ) : (
              'Join organization →'
            )}
          </button>
        </form>
      </div>

      {/* Help hint */}
      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-600">
        Don&apos;t have a link?{' '}
        <Link
          href="/onboarding/create-org"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Create your own organization instead.
        </Link>
      </p>
    </div>
  );
}
