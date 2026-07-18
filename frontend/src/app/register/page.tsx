import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterForm from './RegisterForm';
import PublicRoute from '@/components/PublicRoute';

export const metadata: Metadata = {
  title: 'Sign Up & Get Started | TaskBridge',
  description:
    'Create your TaskBridge account. Set up your workspace, invite team members, build task boards, and start planning projects.',
  openGraph: {
    title: 'Sign Up & Get Started | TaskBridge',
    description:
      'Create your TaskBridge account and establish a structured project workspace for you and your team.',
  },
};

export default function RegisterPage(): React.JSX.Element {
  return (
    <PublicRoute>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#F7F8F9] text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Loading…
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </PublicRoute>
  );
}
