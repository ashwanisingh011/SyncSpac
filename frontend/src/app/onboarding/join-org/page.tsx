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
import { motion, AnimatePresence } from 'motion/react';
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
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

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
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover"
          >
            <Link2 className="w-5 h-5 text-content-secondary" />
          </motion.div>
          <div>
            <h1 className="text-lg font-semibold text-content">
              Join an organization
            </h1>
            <p className="text-xs text-content-tertiary">
              Paste your invite link or token. You must be logged in as the invited email.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label
              htmlFor="invite-token"
              className="block text-sm font-medium text-content-secondary mb-1.5"
            >
              Invite link or token
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
              <input
                id="invite-token"
                type="text"
                value={token}
                onChange={handleInputChange}
                placeholder="https://syncspac.io/accept-invite/abc123 or just abc123"
                disabled={submitState === 'loading' || submitState === 'success'}
                className={clsx(
                  'w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border bg-surface text-content outline-none transition-all placeholder:text-content-tertiary',
                  submitState === 'error'
                    ? 'border-danger bg-danger/5 focus:ring-2 focus:ring-danger/20'
                    : submitState === 'success'
                      ? 'border-success bg-success/8'
                      : 'border-line hover:border-line-strong focus:border-line-focus focus:ring-2 focus:ring-primary/20',
                )}
              />
            </div>
          </div>

          {/* Error / Success feedback */}
          <AnimatePresence mode="wait">
            {submitState === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-start gap-2.5 rounded-xl bg-danger/8 border border-danger/30 px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{errorMessage}</p>
              </motion.div>
            )}

            {submitState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2.5 rounded-xl bg-success/10 border border-success/30 px-4 py-3"
              >
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <p className="text-sm text-success">
                  Joined! Redirecting to workspace…
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={!token.trim() || submitState === 'loading' || submitState === 'success'}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-content hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
      </motion.div>

      {/* Help hint */}
      <p className="mt-4 text-center text-xs text-content-tertiary">
        Don&apos;t have a link?{' '}
        <Link
          href="/onboarding/create-org"
          className="text-primary hover:underline"
        >
          Create your own organization instead.
        </Link>
      </p>
    </div>
  );
}
