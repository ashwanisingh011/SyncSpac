"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/api/axios';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import AuthFormLayout from '@/components/AuthFormLayout';
import {
  clearPendingVerificationAuth,
  getPendingVerificationAuth,
} from '@/lib/pendingVerificationAuth';
import { getPostAuthRouteForUser } from '@/lib/postAuth';
import {
  clearPendingInviteEmail,
  clearPostAuthRedirect,
  resolveInvitePostAuthRedirect,
} from '@/lib/inviteFlow';
import { normalizeAuthUser } from '@/lib/userRoles';
import { broadcastVerified } from '@/lib/verificationChannel';

/** How long (seconds) to show the success state before redirecting to /login. */
const REDIRECT_COUNTDOWN_SEC = 3;

const parseTokenParam = (param: string | string[] | undefined): string => {
  const raw = Array.isArray(param) ? param.join('/') : param ?? '';
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
};

const VerifyEmail = () => {
  const params = useParams();
  const router = useRouter();
  const { login } = useAuth() as {
    login: (user: { id: string; name: string; email: string }, token: string) => void;
  };
  const token = parseTokenParam(params?.token as string | string[] | undefined);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your account...');
  const { showToast } = useToast();
  const verifyStarted = useRef(false);

  // Countdown before redirecting to /login after success (no auto-login path)
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_SEC);

  const [resendHref, setResendHref] = useState('/register');

  useEffect(() => {
    const email = sessionStorage.getItem('pendingVerificationEmail');
    setResendHref(
      email ? `/verify-email-sent?email=${encodeURIComponent(email)}` : '/register'
    );
  }, []);

  // Countdown timer (ticks every second when verification is successful without auto-login)
  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [status, countdown]);

  // Redirect to login when countdown hits 0
  useEffect(() => {
    if (status === 'success' && countdown <= 0) {
      router.replace('/login');
    }
  }, [status, countdown, router]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      showToast('Unable to verify email without a token.', 'error');
      return;
    }

    if (verifyStarted.current) return;
    verifyStarted.current = true;

    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verifyemail/${token}`);
        const authData = data?.data;
        const pending = getPendingVerificationAuth();

        sessionStorage.removeItem('pendingVerificationEmail');

        const user = authData?.user ?? pending?.user;
        const jwt = authData?.token ?? pending?.token;

        // ── Path A: We have credentials → auto-login and redirect to dashboard ──
        if (user && jwt) {
          const normalized = normalizeAuthUser(user as Record<string, unknown>);
          login(normalized ?? user, jwt);
          clearPendingVerificationAuth();
          showToast('Email verified! Welcome to TaskBridge.', 'success');

          const destination = getPostAuthRouteForUser(
            (normalized as { role?: string })?.role,
            resolveInvitePostAuthRedirect(),
          );
          clearPostAuthRedirect();
          clearPendingInviteEmail();

          // Notify any other open tabs (e.g. the original /verify-email-sent
          // waiting page) that verification is complete so they can redirect
          // and close the stale session gracefully.
          broadcastVerified({
            destination,
            user: normalized as Record<string, unknown>,
            token: jwt,
          });

          // Replace so the verification URL is removed from history
          router.replace(destination);
          return;
        }

        // ── Path B: No credentials available → show success + auto-redirect to /login ──
        setStatus('success');
        setMessage(
          data?.message || 'Email verified successfully! Redirecting you to login…'
        );
        showToast('Your email has been verified. Redirecting to login.', 'success');
        clearPendingVerificationAuth();

        // Notify other tabs (e.g. /verify-email-sent) so they can redirect too
        broadcastVerified({ destination: '/login' });
      } catch (error: unknown) {
        const err = error as {
          response?: { data?: { message?: string }; status?: number };
          message?: string;
        };

        const apiMessage = err.response?.data?.message;
        const isNetwork =
          !err.response &&
          (err.message === 'Network Error' || err.message?.includes('Network'));

        setStatus('error');
        setMessage(
          apiMessage ||
            (isNetwork
              ? 'Could not reach the server. Check that the API is running and NEXT_PUBLIC_API_URL is correct.'
              : 'Verification failed. The link may have expired — try signing up again or log in if already verified.')
        );
        showToast(apiMessage || 'Email verification failed.', 'error');
      }
    };

    verify();
  }, [token, showToast, login, router]);

  return (
    <>
      <AuthFormLayout
        title="Verify your email"
        subtitle="We are confirming your account so you can access the TaskBridge dashboard."
        footer={
          status === 'error' ? (
            <>
              Need a new link?{' '}
              <Link href={resendHref} className="font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]">
                Back to sign up
              </Link>
            </>
          ) : null
        }
      >
        <div className="rounded-3xl border border-[#DFE1E6] bg-[#F6F8FB] p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B778C] dark:text-slate-500">
            Email verification
          </div>

          {/* ── Loading state ── */}
          {status === 'loading' && (
            <div className="flex items-center gap-3">
              {/* Spinner */}
              <svg
                className="h-5 w-5 animate-spin text-[#0052CC]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <p className="text-sm leading-6 text-[#6B778C] dark:text-slate-400">
                Verifying your email…
              </p>
            </div>
          )}

          {/* ── Success state (no auto-login available — countdown redirect) ── */}
          {status === 'success' && (
            <>
              {/* Green tick */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3FCEF] text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#172B4D] dark:text-white">
                  Email verified successfully!
                </p>
              </div>

              <p className="mb-4 text-sm leading-6 text-[#6B778C] dark:text-slate-400">
                {message}
              </p>

              {/* Countdown info */}
              <p className="mb-4 text-xs text-[#6B778C] dark:text-slate-500">
                Redirecting to login in{' '}
                <span className="font-semibold tabular-nums text-[#0052CC] dark:text-[#579DFF]">
                  {countdown}s
                </span>
                …
              </p>

              {/* Manual redirect button (in case countdown is slow) */}
              <Link
                href="/login"
                className="inline-flex rounded bg-[#0052CC] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0747A6]"
              >
                Go to login now
              </Link>
            </>
          )}

          {/* ── Error state ── */}
          {status === 'error' && (
            <>
              <p className="mb-4 text-sm leading-6">{message}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex rounded bg-[#0052CC] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0747A6]"
                >
                  Go to login
                </Link>
                <Link
                  href={resendHref}
                  className="inline-flex rounded border border-[#DFE1E6] px-4 py-2 text-sm font-semibold text-[#172B4D] transition hover:bg-white dark:border-slate-700 dark:text-white dark:hover:bg-slate-900"
                >
                  Back to sign up
                </Link>
              </div>
            </>
          )}
        </div>
      </AuthFormLayout>
    </>
  );
};

export default VerifyEmail;
