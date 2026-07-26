"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
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

import AuthShell, {
  AuthField,
  AuthSubmit,
  AuthDivider,
  AuthSocialButton,
  PasswordInput,
  authInputClass,
} from '@/components/auth/AuthShell';

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
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your workspace to pick up where you left off."
      altAction={{
        hint: 'New to SyncSpac?',
        label: 'Create account',
        href: `/register?redirect=${encodeURIComponent(redirectTo)}`,
      }}
    >
      {/* Social first — lowest-friction path on top */}
      <div className="grid grid-cols-2 gap-3">
        <AuthSocialButton onClick={() => handleOAuthLogin('google')}>
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Google
        </AuthSocialButton>
        <AuthSocialButton onClick={() => handleOAuthLogin('github')}>
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
          </svg>
          GitHub
        </AuthSocialButton>
      </div>

      <div className="my-6">
        <AuthDivider label="or continue with email" />
      </div>

      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger/[0.06] px-3.5 py-3 text-[13px] leading-snug text-danger">
              <AlertCircle className="mt-px h-4 w-4 shrink-0" />
              {serverError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder="you@company.com"
            className={authInputClass(Boolean(errors.email))}
          />
        </AuthField>

        <AuthField
          id="password"
          label="Password"
          error={errors.password}
          hint={
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            error={Boolean(errors.password)}
          />
        </AuthField>

        <AuthSubmit loading={loading} loadingLabel="Logging in…">
          Log in
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default LoginForm;
