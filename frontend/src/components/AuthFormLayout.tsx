"use client";

import { ReactNode } from 'react';
import AtlassianBackground from '@/components/AtlassianBackground';
import AuthCardPattern from '@/components/AuthCardPattern';
import ThemeToggle from '@/components/ThemeToggle';

type AuthFormLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthFormLayout({ title, subtitle, children, footer }: AuthFormLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F8F9] px-4 py-10 text-[#172B4D] dark:bg-slate-950 dark:text-slate-100">
      <AtlassianBackground />
      <ThemeToggle className="absolute right-5 top-5 z-20" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <div className="mb-5 inline-flex rounded-full border border-[#B3D4FF] bg-white/70 px-3 py-1 text-xs font-semibold text-[#0052CC] shadow-sm backdrop-blur dark:border-blue-900 dark:bg-slate-900/70 dark:text-[#85B8FF]">
            Modern auth for every workspace
          </div>
          <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight text-[#172B4D] dark:text-white">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#42526E] dark:text-slate-400">
            {subtitle}
          </p>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0052CC] text-sm font-bold text-white shadow-sm">T</div>
            <span className="text-xl font-semibold tracking-tight text-[#172B4D] dark:text-white">TaskBridge</span>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-white/80 bg-white/95 px-6 sm:px-10 py-8 shadow-[0_16px_48px_rgba(9,30,66,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <AuthCardPattern />
            <div className="relative">
              <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E9F2FF] text-[#0052CC] shadow-sm dark:bg-blue-950/60 dark:text-[#85B8FF]">
                <span className="text-sm font-bold">TB</span>
              </div>
              <h1 className="mb-1 text-center text-base font-semibold text-[#172B4D] dark:text-white">{title}</h1>
              <p className="mb-6 text-center text-sm text-[#42526E] dark:text-slate-400">{subtitle}</p>

              {children}
            </div>

            {footer && <div className="mt-6 text-center text-sm text-[#6B778C] dark:text-slate-400">{footer}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
