"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check } from 'lucide-react';
import api from '@/api/axios';
import type { AxiosError } from 'axios';
import { useToast } from '@/context/useToast';

import AuthShell, {
  AuthField,
  AuthSubmit,
  PasswordInput,
  authInputClass,
} from '@/components/auth/AuthShell';
import { cn } from '@/lib/utils';
import { resolvePostAuthRedirect } from '@/lib/postAuth';
import { savePendingInviteToken, savePostAuthRedirect, getPendingInviteEmail } from '@/lib/inviteFlow';
import { savePendingVerificationAuth } from '@/lib/pendingVerificationAuth';
import { extractInviteToken } from '@/lib/inviteToken';
import { validatePassword, PASSWORD_VALIDATION_ERROR_MSG } from '@/lib/passwordValidator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ─── Password strength ────────────────────────────────────────────────────────

const RULES: Array<{ label: string; test: (p: string) => boolean }> = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Upper & lowercase', test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { label: 'A number', test: (p) => /[0-9]/.test(p) },
  { label: 'A symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  const passed = useMemo(() => RULES.map((r) => r.test(password)), [password]);
  const score = passed.filter(Boolean).length;

  const barColor =
    score <= 1 ? 'bg-danger' : score === 2 ? 'bg-warning' : score === 3 ? 'bg-warning' : 'bg-success';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="pt-2.5">
        {/* Segmented meter */}
        <div className="flex gap-1">
          {RULES.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div
                initial={false}
                animate={{ scaleX: i < score ? 1 : 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0 }}
                className={cn('h-full w-full rounded-full', barColor)}
              />
            </div>
          ))}
        </div>
        {/* Checklist */}
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {RULES.map((rule, i) => (
            <span
              key={rule.label}
              className={cn(
                'inline-flex items-center gap-1.5 text-[11px] transition-colors duration-200',
                passed[i] ? 'text-success' : 'text-content-tertiary'
              )}
            >
              <span
                className={cn(
                  'flex h-3 w-3 items-center justify-center rounded-full border transition-colors duration-200',
                  passed[i] ? 'border-success bg-success text-white' : 'border-line-strong'
                )}
              >
                {passed[i] && <Check className="h-2 w-2" strokeWidth={3.5} />}
              </span>
              {rule.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const RegisterForm = (): React.JSX.Element => {
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = resolvePostAuthRedirect(searchParams.get('redirect'));

  const [form, setForm] = useState<RegisterFormState>({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [invitedEmailLocked, setInvitedEmailLocked] = useState(false);

  useEffect(() => {
    if (!redirectTo.startsWith('/accept-invite/')) return;
    savePostAuthRedirect(redirectTo);
    const token = extractInviteToken(redirectTo);
    if (token) savePendingInviteToken(token);
  }, [redirectTo]);

  useEffect(() => {
    const invitedEmail = getPendingInviteEmail();
    if (invitedEmail) {
      setForm((prev) => ({ ...prev, email: invitedEmail }));
      setInvitedEmailLocked(true);
    }
  }, []);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedName) errs.name = 'Name is required';
    if (!trimmedEmail) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      errs.email = 'Enter a valid email';
    }
    if (!form.password) errs.password = 'Password is required';
    else if (!validatePassword(form.password)) {
      errs.password = PASSWORD_VALIDATION_ERROR_MSG;
    }
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setServerError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: trimmedName,
        email: trimmedEmail,
        password: form.password,
      });

      // Do NOT log the user in yet — they must verify their email first.
      // Store email so /verify-email-sent can offer a resend button.
      sessionStorage.setItem('pendingVerificationEmail', trimmedEmail);

      // Persist the token + user payload so the verify-email page can
      // auto-login the user when they click the link in this same browser.
      const authData = data?.data;
      if (authData?.token && authData?.user) {
        savePendingVerificationAuth(authData.token, authData.user);
      }

      showToast(
        'Account created! Please check your email to verify your address.',
        'success',
      );
      router.push(`/verify-email-sent?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setServerError(axiosErr.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free for small teams. No credit card required."
      altAction={{
        hint: 'Already have an account?',
        label: 'Log in',
        href: `/login?redirect=${encodeURIComponent(redirectTo)}`,
      }}
    >
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
        <AuthField id="name" label="Full name" error={errors.name}>
          <input
            id="name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            placeholder="Alex Rivera"
            className={authInputClass(Boolean(errors.name))}
          />
        </AuthField>

        <AuthField id="email" label="Work email" error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            readOnly={invitedEmailLocked}
            autoComplete="email"
            placeholder="you@company.com"
            className={cn(
              authInputClass(Boolean(errors.email)),
              invitedEmailLocked && 'cursor-not-allowed bg-surface-sunken text-content-secondary'
            )}
          />
        </AuthField>

        <AuthField id="password" label="Password" error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={Boolean(errors.password)}
          />
          <AnimatePresence>
            {form.password && <PasswordStrength password={form.password} />}
          </AnimatePresence>
        </AuthField>

        <AuthField id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder="Repeat your password"
            error={Boolean(errors.confirmPassword)}
          />
        </AuthField>

        <AuthSubmit loading={loading} loadingLabel="Creating account…">
          Create account
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default RegisterForm;
