"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/api/axios';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import AuthShell, { AuthField, AuthSubmit } from '@/components/auth/AuthShell';
import { cn } from '@/lib/utils';
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
      <AuthShell
        title="Two-factor authentication"
        subtitle="Enter the one-time verification code sent to your email to complete login."
        altAction={{
          hint: "Can't access your code?",
          label: 'Back to login',
          href: '/login',
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <AuthField id="code" label="Verification code" error={errors.code}>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={8}
              className={cn(
                'h-13 w-full rounded-lg border bg-surface px-3.5 text-center font-mono text-[22px] font-semibold tracking-[0.45em] text-content outline-none',
                'transition-[border-color,box-shadow] duration-150',
                'placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-content-tertiary/70',
                errors.code
                  ? 'border-danger shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_12%,transparent)]'
                  : 'border-line hover:border-line-strong focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-subtle)]'
              )}
              placeholder="Enter code"
            />
          </AuthField>

          <AuthSubmit loading={loading} loadingLabel="Verifying…">
            Verify code
          </AuthSubmit>

          <div className="flex items-center justify-between text-[13px]">
            <span className="text-content-tertiary">Didn&apos;t get it?</span>
            <button
              type="button"
              disabled={!canResend || resendLoading}
              onClick={handleResend}
              className={cn(
                'font-medium transition-colors disabled:cursor-not-allowed',
                canResend
                  ? 'text-primary hover:underline cursor-pointer'
                  : 'text-content-tertiary tabular-nums'
              )}
            >
              {resendLoading ? (
                'Resending…'
              ) : canResend ? (
                'Resend code'
              ) : (
                `Resend in ${timer}s`
              )}
            </button>
          </div>
        </form>
      </AuthShell>
    </>
  );
};

export default TwoFactorAuth;
