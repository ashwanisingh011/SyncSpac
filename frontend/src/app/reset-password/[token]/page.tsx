"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/api/axios';
import { useToast } from '@/context/useToast';
import AuthShell, { AuthField, AuthSubmit, PasswordInput } from '@/components/auth/AuthShell';
import { validatePassword, PASSWORD_VALIDATION_ERROR_MSG } from '@/lib/passwordValidator';
import PublicRoute from '@/components/PublicRoute';

const ResetPassword = () => {
  const params = useParams();
  const router = useRouter();
  const token = params?.token ?? '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);
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
      <AuthShell
        title="Choose a new password"
        subtitle="Almost there — pick something strong and you're back in."
        altAction={{
          hint: 'Remembered it?',
          label: 'Log in',
          href: '/login',
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <AuthField id="password" label="New password" error={errors.password}>
            <PasswordInput
              id="password"
              name="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              autoComplete="new-password"
              placeholder="New password"
              error={Boolean(errors.password)}
            />
          </AuthField>

          <AuthField id="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              autoComplete="new-password"
              placeholder="Repeat new password"
              error={Boolean(errors.confirmPassword)}
            />
          </AuthField>

          <AuthSubmit loading={loading} loadingLabel="Updating password…">
            Reset password
          </AuthSubmit>
        </form>
      </AuthShell>
    </PublicRoute>
  );
};

export default ResetPassword;
