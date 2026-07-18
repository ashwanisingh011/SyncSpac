"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/api/axios';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import AuthFormLayout from '@/components/AuthFormLayout';
import { getPostAuthRouteForUser } from '@/lib/postAuth';
import {
  clearPostAuthRedirect,
  resolveInvitePostAuthRedirect,
} from '@/lib/inviteFlow';
import { normalizeAuthUser } from '@/lib/userRoles';

const TwoFactorAuth = () => {
  const router = useRouter();
  const { login } = useAuth() as {
    login: (userData: unknown, token: string) => void;
  };
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ code?: string }>({});
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const storedEmail = window.localStorage.getItem('temp2faEmail');
    const storedPassword = window.sessionStorage.getItem('temp2faPassword');
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
    } else {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (canResend || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [canResend, timer]);

  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    setResendLoading(true);
    try {
      if (!email || !password) {
        showToast('Verification session expired. Please log in again.', 'error');
        router.push('/login');
        return;
      }
      await api.post('/auth/login', { email, password });
      showToast('A new verification code has been sent to your email.', 'success');
      setTimer(60);
      setCanResend(false);
      setCode('');
      setErrors({});
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || 'Failed to resend code. Please try again.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const validate = () => {
    const validation: { code?: string } = {};
    if (!code.trim()) {
      validation.code = 'Verification code is required';
    } else if (!/^\d{4,8}$/.test(code)) {
      validation.code = 'Enter a valid code';
    }
    return validation;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      if (!email) {
        showToast('Verification expired. Please log in again.', 'error');
        router.push('/login');
        return;
      }

      const { data } = await api.post('/auth/login/2fa', { email, otp: Number(code) });
      const authData = data?.data;

      if (authData?.user && authData?.token) {
        window.localStorage.removeItem('temp2faEmail');
        window.sessionStorage.removeItem('temp2faPassword');
        const user = normalizeAuthUser({
          ...authData.user,
          isTwoFactorEnabled: true,
        });
        if (!user) return;
        login(user, authData.token);
        showToast('Login successful!', 'success');
        const destination = getPostAuthRouteForUser(
          (user as { role?: string }).role,
          resolveInvitePostAuthRedirect(),
        );
        clearPostAuthRedirect();
        router.push(destination);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errMsg = err.response?.data?.message || 'Invalid verification code';
      setErrors({ code: errMsg });
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthFormLayout
        title="Two-factor authentication"
        subtitle="Enter the one-time verification code sent to your email to complete login."
        footer={
          <>
            Can&apos;t access your code?{' '}
            <Link href="/login" className="font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]">
              Back to login
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="code" className="sr-only">
              Verification code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={`h-11 w-full rounded border bg-white px-3 text-sm text-[#172B4D] outline-none transition-colors placeholder:text-[#6B778C] focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/30 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${errors.code ? 'border-red-400' : 'border-[#DFE1E6] dark:border-slate-700'
                }`}
              placeholder="Enter code"
            />
            {errors.code && <p className="mt-2 text-xs text-red-500">{errors.code}</p>}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              disabled={!canResend || resendLoading}
              onClick={handleResend}
              className={`text-xs font-semibold transition-colors disabled:cursor-not-allowed ${canResend
                ? 'text-[#0052CC] hover:text-[#0747A6] hover:underline dark:text-[#579DFF] dark:hover:text-[#85B8FF]'
                : 'text-[#6B778C] opacity-70 dark:text-slate-500'
                }`}
            >
              {resendLoading ? (
                'Resending code...'
              ) : canResend ? (
                'Resend code'
              ) : (
                `Resend code in ${timer}s`
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded bg-[#0052CC] text-sm font-semibold text-white transition-colors hover:bg-[#0747A6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Verify code'}
          </button>

          <p className="text-sm leading-6 text-[#6B778C] dark:text-slate-400">
            Check your inbox for the code sent when you logged in.
          </p>
        </form>
      </AuthFormLayout>
    </>
  );
};

export default TwoFactorAuth;
