"use client";

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import api from '@/api/axios';
import { useToast } from '@/context/useToast';
import AuthFormLayout from '@/components/AuthFormLayout';
import { useRouter } from 'next/navigation';

const ForgotPasswordForm = (): React.JSX.Element => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const validate = () => {
    const validation: { email?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      validation.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)
    ) {
      validation.email = "Enter a valid email";
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
      await api.post('/auth/forgotpassword', { email });
      showToast('If an account with that email exists, a reset link has been sent.', 'success');
      router.push(`/verify-email-sent?email=${encodeURIComponent(email)}&mode=reset`);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to send reset email.', 'error');
    } finally {      
      setLoading(false);
    }
  };

  return (
    <AuthFormLayout
      title="Recover your password"
      subtitle="Enter the email associated with your account and we will send you a secure password reset link."
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
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={`h-11 w-full rounded border bg-white px-3 text-sm text-[#172B4D] outline-none transition-colors placeholder:text-[#6B778C] focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF]/30 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 ${
              errors.email ? 'border-red-400' : 'border-[#DFE1E6] dark:border-slate-700'
            }`}
            placeholder="Enter your email"
          />
          {errors.email && <p className="mt-2 text-xs text-red-500">{errors.email}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded bg-[#0052CC] text-sm font-semibold text-white transition-colors hover:bg-[#0747A6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending reset link...' : 'Send reset link'}
        </button>
      </form>
    </AuthFormLayout>
  );
};

export default ForgotPasswordForm;
