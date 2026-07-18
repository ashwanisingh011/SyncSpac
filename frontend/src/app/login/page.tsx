import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';
import PublicRoute from '@/components/PublicRoute';

export const metadata: Metadata = {
  title: 'Welcome Back | TaskBridge',
  description:
    'Welcome back to TaskBridge. Sign in to manage tasks, collaborate with teammates, monitor project progress, and stay productive.',
  openGraph: {
    title: 'Welcome Back | TaskBridge',
    description:
      'Sign in to TaskBridge and keep your projects, teams, and workflows connected in one place.',
  },
};

export default function LoginPage(): React.JSX.Element {
  return (
    <PublicRoute>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#F7F8F9] text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </PublicRoute>
  );
}
