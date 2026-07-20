'use client';

import type { ReactNode } from 'react';
import { Grid } from 'lucide-react';
import Link from 'next/link';
import OnboardingAuthGuard from '@/components/OnboardingAuthGuard';
import UserProfileMenu from '@/components/profile/UserProfileMenu';

export default function OnboardingLayoutClient({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-950/80">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-[#0052CC] font-bold hover:text-[#0747A6] dark:text-[#579DFF]"
        >
          <Grid className="w-5 h-5" />
          <span className="text-lg">SyncSpac</span>
        </Link>

        <UserProfileMenu
          avatarSize="sm"
          showProfile={false}
          showSettings={false}
        />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <OnboardingAuthGuard>{children}</OnboardingAuthGuard>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} TaskBridge · All rights reserved
      </footer>
    </div>
  );
}
