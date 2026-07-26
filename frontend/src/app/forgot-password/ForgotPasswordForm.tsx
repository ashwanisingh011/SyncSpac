"use client";

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/context/useToast';
import AuthShell, { AuthField, AuthSubmit, authInputClass } from '@/components/auth/AuthShell';
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
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email associated with your account and we'll send you a secure reset link."
      altAction={{
        hint: 'Remembered it?',
        label: 'Log in',
        href: '/login',
      }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@company.com"
            className={authInputClass(Boolean(errors.email))}
          />
        </AuthField>

        <AuthSubmit loading={loading} loadingLabel="Sending reset link…">
          Send reset link
        </AuthSubmit>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-content-tertiary transition-colors hover:text-content"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
};

export default ForgotPasswordForm;
