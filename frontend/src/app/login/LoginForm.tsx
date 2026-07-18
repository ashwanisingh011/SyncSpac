"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/api/axios';
import type { AxiosError } from 'axios';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { resolvePostAuthRedirect, getPostAuthRouteForUser } from '@/lib/postAuth';
import {
  resolveInvitePostAuthRedirect,
  savePostAuthRedirect,
  getPendingInviteEmail,
} from '@/lib/inviteFlow';
import { normalizeAuthUser } from '@/lib/userRoles';

import AtlassianBackground from '@/components/AtlassianBackground';
import AuthCardPattern from '@/components/AuthCardPattern';
import ThemeToggle from '@/components/ThemeToggle';
import { clearOrganizationSession } from '@/lib/orgSession';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginFormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const LoginForm = (): React.JSX.Element => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = resolvePostAuthRedirect(searchParams.get('redirect'));

  const [form, setForm] = useState<LoginFormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('postAuthRedirect', resolveInvitePostAuthRedirect(redirectTo));
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  useEffect(() => {
    window.localStorage.removeItem('temp2faEmail');
    window.sessionStorage.removeItem('temp2faPassword');
    const invitedEmail = getPendingInviteEmail();
    if (invitedEmail) {
      setForm((prev) => ({ ...prev, email: invitedEmail }));
    }

    const oauthError = searchParams.get('error');
    if (oauthError) {
      if (oauthError === 'OAuthFailed') {
        setServerError('Social authentication failed or was cancelled.');
      } else if (oauthError === 'NoEmailProvided') {
        setServerError('Your social account does not have a verified primary email.');
      } else if (oauthError === 'OAuthProcessingError') {
        setServerError('An error occurred while processing your social login.');
      } else {
        setServerError(oauthError);
      }
    }
  }, [searchParams]);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setServerError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      const authData = data?.data;
      if (authData?.requires2FA) {
        window.localStorage.setItem('temp2faEmail', String(authData.email ?? ''));
        window.sessionStorage.setItem('temp2faPassword', form.password);
        savePostAuthRedirect(redirectTo);
        router.push('/2fa');
        return;
      }
      if (data?.needsEmailVerification) {
        router.push(`/verify-email/${data?.verificationToken || ''}`);
        return;
      }
      const user = normalizeAuthUser({
        ...authData.user,
        isTwoFactorEnabled: Boolean(authData.user?.isTwoFactorEnabled),
      });
      const normalizedUser = user as Parameters<typeof login>[0];
      login(normalizedUser, authData.token);
      showToast('Login successful!', 'success');
      router.push(
        getPostAuthRouteForUser(
          normalizedUser?.role,
          resolveInvitePostAuthRedirect(redirectTo),
        ),
      );
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg = axiosErr.response?.data?.message || '';
      if (axiosErr.response?.status === 403 && msg.toLowerCase().includes('verify')) {
        sessionStorage.setItem('pendingVerificationEmail', form.email);
        router.push(`/verify-email-sent?email=${encodeURIComponent(form.email)}`);
        return;
      }
      setServerError(msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F8F9] px-4 py-10 text-[#172B4D] dark:bg-slate-950 dark:text-slate-100">
      <AtlassianBackground />
      <ThemeToggle className="absolute right-5 top-5 z-20" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_400px]">
        <section className="hidden lg:block">
          <div className="mb-5 inline-flex rounded-full border border-[#B3D4FF] bg-white/70 px-3 py-1 text-xs font-semibold text-[#0052CC] shadow-sm backdrop-blur dark:border-blue-900 dark:bg-slate-900/70 dark:text-[#85B8FF]">
            Plan, track, and ship with focus
          </div>
          <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight text-[#172B4D] dark:text-white">
            One calm place for issues, boards, and delivery work.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#42526E] dark:text-slate-400">
            A Jira-inspired workspace with clean navigation, focused task boards, and a simple path back into your project.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {['To Do', 'In Progress', 'Done'].map((column, index) => (
              <div key={column} className="rounded-lg border border-white/70 bg-white/80 p-3 shadow-[0_12px_30px_rgba(9,30,66,0.12)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B778C] dark:text-slate-500">{column}</div>
                <div className="space-y-2">
                  <div className="h-9 rounded bg-[#F4F5F7] dark:bg-slate-800" />
                  <div className={`h-9 rounded ${index === 2 ? 'bg-[#E3FCEF] dark:bg-emerald-950/50' : 'bg-[#E9F2FF] dark:bg-blue-950/50'}`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0052CC] text-sm font-bold text-white shadow-sm">
            T
          </div>
          <span className="text-xl font-semibold tracking-tight text-[#172B4D] dark:text-white">TaskBridge</span>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-white/80 bg-white/95 px-10 py-8 shadow-[0_16px_48px_rgba(9,30,66,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <AuthCardPattern />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E9F2FF] text-[#0052CC] shadow-sm dark:bg-blue-950/60 dark:text-[#85B8FF]">
              <span className="text-sm font-bold">TB</span>
            </div>
            <h1 className="mb-6 text-center text-base font-semibold text-[#172B4D] dark:text-white">
              Log in to continue
            </h1>

            {serverError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
                {serverError}
              </div>
            )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              aria-label="Email"
              className={`h-10 w-full rounded border bg-white px-3 text-sm text-[#172B4D] outline-none transition-colors placeholder:text-[#6B778C] focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/30 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
                errors.email ? 'border-red-400' : 'border-[#DFE1E6] dark:border-slate-700'
              }`}
              placeholder="Enter email"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                aria-label="Password"
                className={`h-10 w-full rounded border bg-white px-3 pr-10 text-sm text-[#172B4D] outline-none transition-colors placeholder:text-[#6B778C] focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/30 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
                  errors.password ? 'border-red-400' : 'border-[#DFE1E6] dark:border-slate-700'
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6B778C] hover:text-[#172B4D] dark:text-slate-400 dark:hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}

            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded bg-[#0052CC] text-sm font-semibold text-white transition-colors hover:bg-[#0747A6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="my-6 flex items-center justify-between">
            <span className="w-1/5 border-b border-[#DFE1E6] dark:border-slate-800 lg:w-1/4"></span>
            <span className="text-xs uppercase text-[#6B778C] dark:text-slate-400">or continue with</span>
            <span className="w-1/5 border-b border-[#DFE1E6] dark:border-slate-800 lg:w-1/4"></span>
          </div>

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="flex h-10 w-full items-center justify-center rounded border border-[#DFE1E6] bg-white text-sm font-semibold text-[#172B4D] shadow-sm transition-colors hover:bg-[#F4F5F7] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
            >
              <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              className="flex h-10 w-full items-center justify-center rounded border border-[#DFE1E6] bg-white text-sm font-semibold text-[#172B4D] shadow-sm transition-colors hover:bg-[#F4F5F7] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
            >
              <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
              Continue with GitHub
            </button>
          </div>

          <p className="text-center text-sm text-[#6B778C] dark:text-slate-400">
            Forgot your password?{' '}
            <Link href="/forgot-password" className="font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]">
              Reset it here
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-[#6B778C] dark:text-slate-400">
            New to TaskBridge?{' '}
            <Link
              href={`/register?redirect=${encodeURIComponent(redirectTo)}`}
              className="font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]"
            >
              Create an account
            </Link>
          </p>
          </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginForm;
