"use client";

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/useAuth';
import { useToast } from '@/context/useToast';
import { getPostAuthRouteForUser } from '@/lib/postAuth';
import { normalizeAuthUser } from '@/lib/userRoles';

function AuthCallbackHandler(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { showToast } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      showToast(`Authentication failed: ${error}`, 'error');
      router.push('/login');
      return;
    }

    if (!token || !userParam) {
      showToast('Authentication callback failed. Missing parameters.', 'error');
      router.push('/login');
      return;
    }

    try {
      const decodedUser = JSON.parse(decodeURIComponent(userParam));
      const normalized = normalizeAuthUser({
        ...decodedUser,
        isTwoFactorEnabled: Boolean(decodedUser.isTwoFactorEnabled),
      });

      if (!normalized) {
        throw new Error('User normalization failed');
      }

      const user = normalized as Parameters<typeof login>[0];

      // Call context login to store token and user in localStorage
      login(user, token);
      showToast('Signed in successfully!', 'success');

      // Check if there was any redirect stored, or default
      const storedRedirect = typeof window !== 'undefined' ? localStorage.getItem('postAuthRedirect') : null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('postAuthRedirect'); // clean up
      }

      const destination = getPostAuthRouteForUser(user.role, storedRedirect);
      router.push(destination);
    } catch (err) {
      console.error('Error handling auth callback:', err);
      showToast('Failed to complete login process. Please try again.', 'error');
      router.push('/login');
    }
  }, [searchParams, login, showToast, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-sunken px-4 py-10 text-content">
      {/* Premium Glassmorphic Loading Spinner container */}
      <div className="relative z-10 flex flex-col items-center justify-center rounded-2xl border border-line bg-surface-overlay/70 p-12 shadow-overlay backdrop-blur-xl">
        <div className="relative flex h-16 w-16 items-center justify-center">
          {/* Animated gradient spinning rings */}
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-line border-t-primary"></div>
          <div className="absolute h-10 w-10 animate-ping rounded-full bg-primary-subtle opacity-75"></div>
        </div>
        <h3 className="mt-8 text-lg font-semibold tracking-tight text-[#172B4D] dark:text-white">
          Authenticating you...
        </h3>
        <p className="mt-2 text-xs text-content-tertiary">
          Setting up your secure workspace session
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-sunken text-sm text-content-tertiary">
          Loading auth callback...
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
