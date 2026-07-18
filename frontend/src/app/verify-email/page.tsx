"use client";

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const VerifyEmailRedirectContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get('token') || searchParams.get('t');
  const token = rawToken ? decodeURIComponent(rawToken).trim() : '';

  useEffect(() => {
    if (token) {
      router.replace(`/verify-email/${encodeURIComponent(token)}`);
    } else {
      router.replace('/register');
    }
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-500 dark:text-slate-400">
      Redirecting...
    </div>
  );
};

/**
 * Handles email links: /verify-email?token=...
 * Redirects to /verify-email/[token] which performs verification.
 */
const VerifyEmailRedirect = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Loading...
      </div>
    }
  >
    <VerifyEmailRedirectContent />
  </Suspense>
);

export default VerifyEmailRedirect;
