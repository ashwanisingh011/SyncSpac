'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Grid, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { acceptInviteByToken, validateInviteByToken } from '@/api/workspace';
import { useOrganization } from '@/context/useOrganization';
import { DASHBOARD_ROUTE, getDefaultPostAuthRoute } from '@/lib/postAuth';
import { extractInviteToken } from '@/lib/inviteToken';
import {
  clearPendingInviteEmail,
  clearPendingInviteToken,
  getAcceptInvitePath,
  savePendingInviteEmail,
  savePendingInviteToken,
  savePostAuthRedirect,
} from '@/lib/inviteFlow';

type State = 'loading' | 'choose-auth' | 'success' | 'error';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string | string[] }>();
  const paramToken = Array.isArray(params?.token)
    ? params.token.join('/')
    : (params?.token ?? '');
  const token = extractInviteToken(paramToken);
  const router = useRouter();
  const { refreshOrganizations } = useOrganization();

  const [state, setState] = useState<State>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const authRedirectStarted = useRef(false);

  const invitePath = token ? getAcceptInvitePath(token) : '';

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid invitation link.');
      setState('error');
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const validation = await validateInviteByToken(token);
        if (cancelled) return;

        if (!validation.valid) {
          setErrorMsg('This invite link is invalid or has expired.');
          setState('error');
          return;
        }

        setOrganizationName(validation.organizationName);
        setInviteEmail(validation.email);
        setUserExists(validation.userExists);

        if (validation.email) {
          savePendingInviteEmail(validation.email);
        }

        savePendingInviteToken(token);
        savePostAuthRedirect(invitePath);

        const isLoggedIn =
          typeof window !== 'undefined' && !!localStorage.getItem('token');

        if (!isLoggedIn) {
          if (!authRedirectStarted.current) {
            authRedirectStarted.current = true;
            const destination = validation.userExists
              ? `/login?redirect=${encodeURIComponent(invitePath)}`
              : `/register?redirect=${encodeURIComponent(invitePath)}`;
            router.replace(destination);
            return;
          }
          setState('choose-auth');
          return;
        }

        await acceptInviteByToken(token);
        if (cancelled) return;

        clearPendingInviteToken();
        clearPendingInviteEmail();
        await refreshOrganizations();
        if (cancelled) return;

        setState('success');
        setTimeout(() => {
          if (!cancelled) router.replace(DASHBOARD_ROUTE);
        }, 1500);
      } catch (err: unknown) {
        if (cancelled) return;

        const isLoggedIn =
          typeof window !== 'undefined' && !!localStorage.getItem('token');

        if (isLoggedIn) {
          const apiMsg = (
            err as { response?: { data?: { message?: string } } }
          )?.response?.data?.message;
          const status = (err as { response?: { status?: number } })?.response?.status;
          setErrorMsg(
            apiMsg ??
              (status === 403
                ? 'This invite is for a different account. Log out and sign in with the invited email, then open the link again.'
                : 'This invite link is invalid or has expired. Ask your admin to send a new invite.'),
          );
          setState('error');
          return;
        }

        const apiMsg = (
          err as { response?: { data?: { message?: string } } }
        )?.response?.data?.message;
        setErrorMsg(apiMsg ?? 'This invite link is invalid or has expired.');
        setState('error');
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [token, router, refreshOrganizations, invitePath]);

  const handleLogin = () => {
    savePendingInviteToken(token);
    savePostAuthRedirect(invitePath);
    if (inviteEmail) savePendingInviteEmail(inviteEmail);
    router.push(`/login?redirect=${encodeURIComponent(invitePath)}`);
  };

  const handleRegister = () => {
    savePendingInviteToken(token);
    savePostAuthRedirect(invitePath);
    if (inviteEmail) savePendingInviteEmail(inviteEmail);
    router.push(`/register?redirect=${encodeURIComponent(invitePath)}`);
  };

  const orgLabel = organizationName ? `"${organizationName}"` : 'the organization';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="h-14 flex items-center px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/80">
        <Link
          href={getDefaultPostAuthRoute()}
          className="flex items-center gap-2 text-[#0052CC] font-bold hover:text-[#0747A6] dark:text-[#579DFF]"
        >
          <Grid className="w-5 h-5" />
          <span className="text-lg">SyncSpac</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950 text-center">
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 mx-auto">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Verifying invitation…
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Please wait while we validate your invite link.
                </p>
              </div>
            </div>
          )}

          {state === 'choose-auth' && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 mx-auto">
                <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Join {orgLabel}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {inviteEmail ? (
                    <>
                      You&apos;ve been invited as{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {inviteEmail}
                      </span>
                      .{' '}
                    </>
                  ) : null}
                  {userExists
                    ? 'Log in with that email to accept the invite.'
                    : 'Create an account with that email to accept the invite.'}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3">
                {userExists !== false && (
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Log in to accept invite
                  </button>
                )}
                {userExists !== true && (
                  <button
                    type="button"
                    onClick={handleRegister}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                      userExists === false
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Create account
                  </button>
                )}
              </div>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  You&apos;re in!
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Successfully joined the organization. Redirecting to your dashboard…
                </p>
              </div>
              <Link
                href={DASHBOARD_ROUTE}
                className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard →
              </Link>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40 mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Invite link invalid
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {errorMsg}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <Link
                  href="/onboarding/join-org"
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Paste token manually
                </Link>
                <Link
                  href={DASHBOARD_ROUTE}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} TaskBridge · All rights reserved
      </footer>
    </div>
  );
}
