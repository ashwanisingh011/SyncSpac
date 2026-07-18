"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/api/axios';
import { useToast } from '@/context/useToast';
import { useAuth } from '@/context/useAuth';
import AuthFormLayout from '@/components/AuthFormLayout';
import { onVerified, clearVerificationSignal } from '@/lib/verificationChannel';
import type { VerificationCompletePayload } from '@/lib/verificationChannel';
import { normalizeAuthUser } from '@/lib/userRoles';

type Mode = 'verify' | 'reset';
type PageState = 'waiting' | 'verified';

const RESEND_COOLDOWN_SEC = 60;
/** Seconds to show "verified in another tab" before redirecting. */
const REDIRECT_COUNTDOWN_SEC = 3;

const VerifyEmailSentContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const mode = (searchParams.get('mode') || 'verify') as Mode;

  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SEC);
  const { showToast } = useToast();
  const { login } = useAuth();

  // Cross-tab UX state
  const [pageState, setPageState] = useState<PageState>('waiting');
  const [verifiedDestination, setVerifiedDestination] = useState('/login');
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_SEC);

  useEffect(() => {
    if (email) {
      sessionStorage.setItem('pendingVerificationEmail', email);
    }
  }, [email]);

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = window.setTimeout(() => setResendTimer((time) => time - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  // Countdown timer (ticks every second when verified in another tab)
  useEffect(() => {
    if (pageState !== 'verified') return;
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [pageState, countdown]);

  // Redirect when countdown hits 0
  useEffect(() => {
    if (pageState === 'verified' && countdown <= 0) {
      router.replace(verifiedDestination);
    }
  }, [pageState, countdown, verifiedDestination, router]);

  /**
   * Called when the BroadcastChannel or localStorage signal fires from Tab B.
   * Transitions this tab from the "waiting" page to the "verified" redirect state.
   */
  const handleVerified = useCallback(
    (payload: VerificationCompletePayload) => {
      // Only handle once (in case both BroadcastChannel AND storage event fire)
      if (pageState === 'verified') return;

      clearVerificationSignal();
      sessionStorage.removeItem('pendingVerificationEmail');

      // If Tab B included auth credentials and we're in verify mode, log in here too
      // so the user lands directly on the dashboard in THIS tab as well.
      if (mode === 'verify' && payload.token && payload.user) {
        try {
          const normalized = normalizeAuthUser(
            payload.user as Record<string, unknown>,
          );
          if (normalized) {
            login(normalized, payload.token);
          }
        } catch {
          // login failed — we'll just redirect to the destination which may
          // re-authenticate via session cookie
        }
      }

      setVerifiedDestination(payload.destination ?? '/login');
      setCountdown(REDIRECT_COUNTDOWN_SEC);
      setPageState('verified');

      showToast(
        mode === 'verify'
          ? 'Email verified! Redirecting you now…'
          : 'Proceeding to your account…',
        'success',
      );
    },
    [pageState, mode, login, showToast],
  );

  // Subscribe to cross-tab verification events
  useEffect(() => {
    // Only listen in verify mode (not password-reset mode)
    if (mode !== 'verify') return;
    const cleanup = onVerified(handleVerified);
    return cleanup;
  }, [mode, handleVerified]);

  const handleResend = async () => {
    if (!email || resendTimer > 0) return;

    setResendLoading(true);
    try {
      if (mode === 'reset') {
        await api.post('/auth/forgotpassword', { email });
        showToast('Password reset email sent. Check your inbox.', 'success');
      } else {
        await api.post('/auth/resend-verification', { email });
        showToast('Verification email sent. Check your inbox.', 'success');
      }
      setResendTimer(RESEND_COOLDOWN_SEC);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to resend email.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  // ─── Verified-in-another-tab state ──────────────────────────────────────────
  if (pageState === 'verified') {
    return (
      <AuthFormLayout
        title="Email verified!"
        subtitle="Your account is now active. You're being redirected."
        footer={null}
      >
        <div className="rounded-3xl border border-[#DFE1E6] bg-[#F6F8FB] p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          {/* Success badge */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E3FCEF] text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#172B4D] dark:text-white">
                Verification successful
              </p>
              <p className="text-xs text-[#6B778C] dark:text-slate-400">
                Completed in another tab
              </p>
            </div>
          </div>

          <p className="mb-4 text-sm leading-6 text-[#6B778C] dark:text-slate-400">
            Your email address has been confirmed. This tab will redirect automatically.
          </p>

          {/* Animated countdown */}
          <p className="mb-5 text-xs text-[#6B778C] dark:text-slate-500">
            Redirecting in{' '}
            <span className="font-semibold tabular-nums text-[#0052CC] dark:text-[#579DFF]">
              {countdown}s
            </span>
            …
          </p>

          <Link
            href={verifiedDestination}
            className="inline-flex rounded bg-[#0052CC] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0747A6]"
          >
            Continue now →
          </Link>
        </div>
      </AuthFormLayout>
    );
  }

  // ─── Default waiting state ───────────────────────────────────────────────────
  const title = mode === 'reset' ? 'Check your email' : 'Check your email';
  const subtitle =
    mode === 'reset'
      ? 'We have sent a password reset email to your address. Click the link to choose a new password.'
      : "We've sent a verification link to your email address. Click the link to activate your account.";
  const actionCopy = mode === 'reset' ? 'Resend password reset email' : 'Resend verification email';
  const footer =
    mode === 'reset' ? (
      <div className="flex flex-col gap-2">
        <p>
          Remembered your password?{' '}
          <Link href="/login" className="font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]">
            Log in
          </Link>
        </p>
        <p>
          Wrong E-mail?{' '}
          <Link href="/forgot-password" className="font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]">
            Re-enter
          </Link>
        </p>
      </div>
    ) : (
      <>
        Already verified?{' '}
        <Link href="/login" className="font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]">
          Log in
        </Link>
      </>
    );

  return (
    <>
      <AuthFormLayout title={title} subtitle={subtitle} footer={footer}>
        <div className="rounded-3xl border border-[#DFE1E6] bg-[#F6F8FB] p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B778C] dark:text-slate-500">
            Email sent to
          </div>
          <p className="mb-4 font-medium text-[#172B4D] dark:text-white">{email}</p>
          <p className="mb-4 text-sm leading-6">
            Didn&apos;t receive the email? Check your spam folder or click below to resend.
            {mode === 'verify' &&
              ' Open the link on the same browser you used to sign up to go straight to the dashboard.'}
          </p>
          <button
            onClick={handleResend}
            disabled={resendLoading || resendTimer > 0}
            className="inline-flex rounded bg-[#0052CC] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0747A6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendLoading
              ? 'Sending...'
              : resendTimer > 0
                ? `Resend in ${resendTimer}s`
                : actionCopy}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={mode === 'reset' ? '/login' : '/register'}
            className="text-sm font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]"
          >
            ← {mode === 'reset' ? 'Back to log in' : 'Back to sign up'}
          </Link>
        </div>
      </AuthFormLayout>
    </>
  );
};

export default VerifyEmailSentContent;
