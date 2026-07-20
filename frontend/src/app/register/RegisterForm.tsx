"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/api/axios';
import type { AxiosError } from 'axios';
import { useToast } from '@/context/useToast';

import AtlassianBackground from '@/components/AtlassianBackground';
import AuthCardPattern from '@/components/AuthCardPattern';
import ThemeToggle from '@/components/ThemeToggle';
import { resolvePostAuthRedirect } from '@/lib/postAuth';
import { savePendingInviteToken, savePostAuthRedirect, getPendingInviteEmail } from '@/lib/inviteFlow';
import { savePendingVerificationAuth } from '@/lib/pendingVerificationAuth';
import { extractInviteToken } from '@/lib/inviteToken';
import { validatePassword, PASSWORD_VALIDATION_ERROR_MSG } from '@/lib/passwordValidator';

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldName = 'name' | 'email' | 'password' | 'confirmPassword';

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

interface FieldConfig {
  name: FieldName;
  type: 'text' | 'email' | 'password';
  placeholder: string;
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
  const [showPasswords, setShowPasswords] = useState<Partial<Record<FieldName, boolean>>>({});
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

  const togglePasswordVisibility = (name: FieldName): void => {
    setShowPasswords((prev) => ({ ...prev, [name]: !prev[name] }));
  };

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

  const fields: FieldConfig[] = [
    { name: 'name', type: 'text', placeholder: 'Enter full name' },
    { name: 'email', type: 'email', placeholder: 'Enter email' },
    { name: 'password', type: 'password', placeholder: 'Create password' },
    { name: 'confirmPassword', type: 'password', placeholder: 'Confirm password' },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F8F9] px-4 py-10 text-[#172B4D] dark:bg-slate-950 dark:text-slate-100">
      <AtlassianBackground />
      <ThemeToggle className="absolute right-5 top-5 z-20" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_400px]">
        <section className="hidden lg:block">
          <div className="mb-5 inline-flex rounded-full border border-[#B3D4FF] bg-white/70 px-3 py-1 text-xs font-semibold text-[#0052CC] shadow-sm backdrop-blur dark:border-blue-900 dark:bg-slate-900/70 dark:text-[#85B8FF]">
            Start your project workspace
          </div>
          <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight text-[#172B4D] dark:text-white">
            Create a workspace that feels structured from day one.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#42526E] dark:text-slate-400">
            TaskBridge brings Jira-style boards, backlog planning, and issue detail views into a focused project experience.
          </p>
          <div className="mt-8 max-w-lg rounded-lg border border-white/70 bg-white/80 p-4 shadow-[0_16px_44px_rgba(9,30,66,0.14)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-2 w-24 rounded bg-[#0052CC]" />
              <div className="h-7 w-20 rounded bg-[#E3FCEF] dark:bg-emerald-950/60" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="h-7 rounded bg-[#F4F5F7] dark:bg-slate-800" />
                <div className="h-12 rounded bg-[#E9F2FF] dark:bg-blue-950/50" />
              </div>
              <div className="space-y-2">
                <div className="h-10 rounded bg-[#F4F5F7] dark:bg-slate-800" />
                <div className="h-9 rounded bg-[#F4F5F7] dark:bg-slate-800" />
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded bg-[#E3FCEF] dark:bg-emerald-950/50" />
                <div className="h-7 rounded bg-[#F4F5F7] dark:bg-slate-800" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0052CC] text-sm font-bold text-white shadow-sm">
              S
            </div>
            <span className="text-xl font-semibold tracking-tight text-[#172B4D] dark:text-white">SyncSpac</span>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-white/80 bg-white/95 px-10 py-8 shadow-[0_16px_48px_rgba(9,30,66,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <AuthCardPattern />
            <div className="relative">
              <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E9F2FF] text-[#0052CC] shadow-sm dark:bg-blue-950/60 dark:text-[#85B8FF]">
                <span className="text-sm font-bold">TB</span>
              </div>
              <h1 className="mb-6 text-center text-base font-semibold text-[#172B4D] dark:text-white">
                Sign up to continue
              </h1>

              {serverError && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {fields.map(({ name, type, placeholder }) => (
                  <div key={name}>
                    <div className="relative">
                      <input
                        type={type === 'password' && showPasswords[name] ? 'text' : type}
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        readOnly={name === 'email' && invitedEmailLocked}
                        aria-label={placeholder}
                        className={`h-10 w-full rounded border bg-white px-3 ${type === 'password' ? 'pr-10' : ''} text-sm text-[#172B4D] outline-none transition-colors placeholder:text-[#6B778C] focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/30 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${errors[name] ? 'border-red-400' : 'border-[#DFE1E6] dark:border-slate-700'} ${name === 'email' && invitedEmailLocked ? 'bg-[#F4F5F7] dark:bg-slate-900 cursor-not-allowed' : ''}`}
                        placeholder={placeholder}
                      />
                      {type === 'password' && (
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(name)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6B778C] hover:text-[#172B4D] dark:text-slate-400 dark:hover:text-white"
                          aria-label={showPasswords[name] ? 'Hide password' : 'Show password'}
                        >
                          {showPasswords[name] ? (
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
                      )}
                    </div>
                    {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 w-full rounded bg-[#0052CC] text-sm font-semibold text-white transition-colors hover:bg-[#0747A6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </form>

              <div className="my-6 border-t border-[#DFE1E6] dark:border-slate-800" />

              <p className="text-center text-sm text-[#6B778C] dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
                  className="font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RegisterForm;
