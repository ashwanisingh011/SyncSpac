"use client";

import { ReactNode } from 'react';
import AuthShell from '@/components/auth/AuthShell';

type AuthFormLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Legacy adapter — pages still importing AuthFormLayout render through the
 * split-screen AuthShell. Prefer using AuthShell directly for new pages.
 */
export default function AuthFormLayout({ title, subtitle, children, footer }: AuthFormLayoutProps) {
  return (
    <AuthShell title={title} subtitle={subtitle}>
      {children}
      {footer && (
        <div className="mt-6 border-t border-line pt-5 text-[13px] leading-relaxed text-content-tertiary">
          {footer}
        </div>
      )}
    </AuthShell>
  );
}
