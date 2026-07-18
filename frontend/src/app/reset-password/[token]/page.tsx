"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/context/useToast';
import AuthFormLayout from '@/components/AuthFormLayout';
import { validatePassword, PASSWORD_VALIDATION_ERROR_MSG } from '@/lib/passwordValidator';
import PublicRoute from '@/components/PublicRoute';

const ResetPassword = () => {
  const params = useParams();
  const router = useRouter();
  const token = params?.token ?? '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!token) {
      showToast('Reset token is missing or invalid.', 'error');
    }
  }, [token, showToast]);

  const validate = () => {
    const validation: { password?: string; confirmPassword?: string } = {};
    if (!form.password) {
      validation.password = 'Password is required';
    } else if (!validatePassword(form.password)) {
      validation.password = PASSWORD_VALIDATION_ERROR_MSG;
    }
    if (!form.confirmPassword) {
      validation.confirmPassword = 'Confirm your password';
    } else if (form.password !== form.confirmPassword) {
      validation.confirmPassword = 'Passwords do not match';
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

    if (!token) {
      showToast('Unable to reset password without a valid token.', 'error');
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await api.patch(`/auth/resetpassword/${token}`, { password: form.password });
      showToast('Password reset successfully. You can now log in.', 'success');
      router.push('/login');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Password reset failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicRoute>
      <AuthFormLayout
        title="Reset your password"
        subtitle="Choose a new secure password and continue to your TaskBridge account."
        footer={
          <>
            Remembered your password?{' '}
            <Link href="/login" className="font-medium text-[#0052CC] hover:underline dark:text-[#579DFF]">
              Log in
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* New Password */}
          <div>
            <label htmlFor="password" className="sr-only">New password</label>
            <div className="relative"> {/* 👈 wrapper */}
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className={`h-11 w-full rounded border bg-white px-3 pr-10 text-sm text-[#172B4D] outline-none transition-colors placeholder:text-[#6B778C] focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/30 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${errors.password ? 'border-red-400' : 'border-[#DFE1E6] dark:border-slate-700'
                  }`}
                placeholder="New password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="sr-only">Confirm password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                className={`h-11 w-full rounded border bg-white px-3 pr-10 text-sm text-[#172B4D] outline-none transition-colors placeholder:text-[#6B778C] focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/30 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${errors.confirmPassword ? 'border-red-400' : 'border-[#DFE1E6] dark:border-slate-700'
                  }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-2 text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded bg-[#0052CC] text-sm font-semibold text-white transition-colors hover:bg-[#0747A6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Updating password...' : 'Reset password'}
          </button>
        </form>
      </AuthFormLayout>
    </PublicRoute>
  );
};

export default ResetPassword;