'use client';

import { Shield, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { IAdminStats } from '@/api/admin';

interface WelcomeBannerProps {
  stats?: IAdminStats | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function WelcomeBanner({ stats, loading = false, onRefresh }: WelcomeBannerProps) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const activeOrgs = stats?.activeOrgs !== undefined ? stats.activeOrgs : stats?.orgsCount;
  const totalUsers = stats?.totalUsers !== undefined ? stats.totalUsers : stats?.usersCount;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/60 to-indigo-50/40 p-6 shadow-[0_4px_24px_rgba(99,102,241,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.10)]">

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-36 w-36 rounded-full bg-violet-100/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-blue-100/30 blur-2xl" />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div>
          {/* Badge */}
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-500 font-mono">
              <Sparkles className="h-3 w-3 text-violet-400" />
              <Shield className="h-3 w-3" />
              Platform Super Admin
            </span>
          </div>

          {/* Greeting */}
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {greeting},{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              Admin! 👋
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mt-2 max-w-lg text-sm text-slate-500 leading-relaxed">
            Here&apos;s your platform overview. TaskBridge is serving{' '}
            <span className="font-semibold text-indigo-600 border-b border-indigo-200 pb-0.5">
              {activeOrgs !== undefined ? activeOrgs.toLocaleString() : '...'} organizations
            </span>{' '}
            and{' '}
            <span className="font-semibold text-violet-600 border-b border-violet-200 pb-0.5">
              {totalUsers !== undefined ? totalUsers.toLocaleString() : '...'} users
            </span>{' '}
            globally.
          </p>

          {/* Date */}
          <p className="mt-2 text-xs text-slate-400 font-medium">{dateStr}</p>
        </div>

        {/* Platform summary pills */}
        <div className="hidden shrink-0 flex-col gap-2 sm:flex">
          {[
            { label: 'All systems', value: stats ? 'OK' : 'Checking...', ok: true },
            { label: 'Uptime', value: '99.98%', ok: true },
            {
              label: 'Flagged issues',
              value: stats?.flaggedIssues !== undefined ? stats.flaggedIssues.toString() : '...',
              ok: (stats?.flaggedIssues ?? 0) === 0,
            },
          ].map((pill) => (
            <div
              key={pill.label}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                pill.ok
                  ? 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${pill.ok ? 'bg-emerald-500' : 'bg-amber-400'}`}
              />
              <span className="text-slate-400">{pill.label}:</span>
              <span className={pill.ok ? 'text-slate-700' : 'text-amber-700'}>{pill.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh row */}
      <div className="relative mt-5 flex items-center gap-4 border-t border-slate-100 pt-4">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-indigo-600 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Refresh data
        </button>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">
          Last updated: {loading ? 'Loading...' : 'just now'}
        </span>
      </div>
    </div>
  );
}
