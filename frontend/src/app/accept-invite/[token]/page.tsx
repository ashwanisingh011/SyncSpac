'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
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
    <div className="min-h-screen flex flex-col bg-surface-sunken">
      <header className="glass h-14 flex items-center px-6 border-b border-line">
        <Link href={getDefaultPostAuthRoute()} className="transition-opacity hover:opacity-80">
          <Logo size={24} />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-raised text-center">
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-subtle mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-content">
                  Verifying invitation…
                </h1>
                <p className="mt-1 text-sm text-content-tertiary">
                  Please wait while we validate your invite link.
                </p>
              </div>
            </div>
          )}

          {state === 'choose-auth' && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-subtle mx-auto">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-content">
                  Join {orgLabel}
                </h1>
                <p className="mt-1 text-sm text-content-tertiary">
                  {inviteEmail ? (
                    <>
                      You&apos;ve been invited as{' '}
                      <span className="font-medium text-content-secondary">
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-content hover:bg-primary-hover transition-colors"
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
                        ? 'bg-primary text-primary-content hover:bg-primary-hover'
                        : 'border border-line text-content-secondary hover:bg-surface-hover'
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/12 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-content">
                  You&apos;re in!
                </h1>
                <p className="mt-1 text-sm text-content-tertiary">
                  Successfully joined the organization. Redirecting to your dashboard…
                </p>
              </div>
              <Link
                href={DASHBOARD_ROUTE}
                className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-content hover:bg-primary-hover transition-colors"
              >
                Go to Dashboard →
              </Link>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 mx-auto">
                <AlertCircle className="w-8 h-8 text-danger" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-content">
                  Invite link invalid
                </h1>
                <p className="mt-1 text-sm text-content-tertiary">
                  {errorMsg}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <Link
                  href="/onboarding/join-org"
                  className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-content-secondary hover:bg-surface-hover transition-colors"
                >
                  Paste token manually
                </Link>
                <Link
                  href={DASHBOARD_ROUTE}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-content hover:bg-primary-hover transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-content-tertiary">
        © {new Date().getFullYear()} SyncSpac · All rights reserved
      </footer>
    </div>
  );
}
