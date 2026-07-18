"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/api/axios';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import AuthFormLayout from '@/components/AuthFormLayout';
import { normalizeAuthUser } from '@/lib/userRoles';

const parseTokenParam = (param: string | string[] | undefined): string => {
  const raw = Array.isArray(param) ? param.join('/') : param ?? '';
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
};

const VerifyEmailChange = () => {
  const params = useParams();
  const router = useRouter();
  const { updateUser, user, isAuthReady } = useAuth();
  const token = parseTokenParam(params?.token as string | string[] | undefined);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email change...');
  const { showToast } = useToast();
  const verifyStarted = useRef(false);

  const [countdown, setCountdown] = useState(3);

  // Countdown timer
  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [status, countdown]);

  // Redirect to dashboard/profile when countdown hits 0
  useEffect(() => {
    if (status === 'success' && countdown <= 0) {
      if (user) {
        router.replace('/dashboard/profile');
      } else {
        router.replace('/login');
      }
    }
  }, [status, countdown, router, user]);
  useEffect(() => {
    if (!isAuthReady) return;

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
        const { data } = await api.post(`/auth/verify-email-change/${token}`);
        const authData = data?.data;

        if (authData?.user && user) {
           const normalized = normalizeAuthUser(authData.user as Record<string, unknown>);
           updateUser(normalized as any);
        }

        setStatus('success');
        setMessage(
          data?.message || 'Email verified successfully! Redirecting you...'
        );
        showToast('Your email has been changed successfully.', 'success');
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
              : 'Verification failed. The link may have expired.')
        );
        showToast(apiMessage || 'Email change verification failed.', 'error');
      }
    };

    verify();
  }, [token, showToast, updateUser, user, isAuthReady]);

  return (
    <>
      <AuthFormLayout
        title="Verify email change"
        subtitle="We are confirming your new email address."
        footer={null}
      >
        <div className="rounded-3xl border border-[#DFE1E6] bg-[#F6F8FB] p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B778C] dark:text-slate-500">
            Email verification
          </div>

          {status === 'loading' && (
            <div className="flex items-center gap-3">
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
                Verifying your email change…
              </p>
            </div>
          )}

          {status === 'success' && (
            <>
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
                  Email changed successfully!
                </p>
              </div>

              <p className="mb-4 text-sm leading-6 text-[#6B778C] dark:text-slate-400">
                {message}
              </p>

              <p className="mb-4 text-xs text-[#6B778C] dark:text-slate-500">
                Redirecting in{' '}
                <span className="font-semibold tabular-nums text-[#0052CC] dark:text-[#579DFF]">
                  {countdown}s
                </span>
                …
              </p>

              <Link
                href={user ? "/dashboard/profile" : "/login"}
                className="inline-flex rounded bg-[#0052CC] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0747A6]"
              >
                Go back
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="mb-4 text-sm leading-6">{message}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={user ? "/dashboard/profile" : "/login"}
                  className="inline-flex rounded bg-[#0052CC] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0747A6]"
                >
                  Go back
                </Link>
              </div>
            </>
          )}
        </div>
      </AuthFormLayout>
    </>
  );
};

export default VerifyEmailChange;
