'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import Logo from '@/components/Logo';
import OnboardingAuthGuard from '@/components/OnboardingAuthGuard';
import UserProfileMenu from '@/components/profile/UserProfileMenu';

export default function OnboardingLayoutClient({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-surface-sunken">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(29,122,252,0.14),transparent_65%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(87,157,255,0.10),transparent_65%)]" />
        <div className="absolute -bottom-40 right-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(124,108,240,0.12),transparent_65%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(139,124,246,0.08),transparent_65%)]" />
      </div>

      <header className="glass relative z-50 h-14 flex items-center justify-between px-6 border-b border-line">
        <Link href="/onboarding" className="transition-opacity hover:opacity-80">
          <Logo size={24} />
        </Link>

        <UserProfileMenu
          avatarSize="sm"
          showProfile={false}
          showSettings={false}
        />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="w-full flex items-center justify-center"
        >
          <OnboardingAuthGuard>{children}</OnboardingAuthGuard>
        </motion.div>
      </main>

      <footer className="relative z-10 py-4 text-center text-xs text-content-tertiary">
        © {new Date().getFullYear()} SyncSpac · All rights reserved
      </footer>
    </div>
  );
}
