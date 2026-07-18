'use client';

import { Sparkles, TrendingUp, Target } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import type { Task } from '@/types/tasks';
import type { ISprintData } from '@/types/workspace';

interface OrgWelcomeBannerProps {
  allTasks: Task[];
  sprints: ISprintData[];
  onViewChange?: (view: string) => void;
}

export default function OrgWelcomeBanner({ allTasks, sprints, onViewChange }: OrgWelcomeBannerProps) {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  // Calculate tasks completed
  const completedTasks = allTasks.filter(
    (t) => t.status === 'done' || t.status === 'completed'
  );

  const now = new Date();
  const hour = now.getHours();

  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const completedThisWeek = completedTasks.filter((t) => {
    const diff = new Date().getTime() - new Date(t.updatedAt || t.createdAt).getTime();
    return diff <= 7 * 24 * 3600 * 1000;
  }).length;

  const totalTasks = allTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const openIssuesCount = totalTasks - completedTasks.length;

  // Active sprint details
  const activeSprint = sprints.find((s) => s.status === 'active');
  const sprintName = activeSprint ? activeSprint.name : 'No active sprint';
  const sprintProgress = activeSprint?.velocity
    ? `${activeSprint.velocity}%`
    : completionRate > 0 ? `${completionRate}%` : '100%';

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes welcomeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-welcome {
          animation: welcomeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      ` }} />

      {/* Light-theme welcome banner */}
      <div className="animate-welcome relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/60 to-indigo-50/40 p-6 shadow-[0_4px_24px_rgba(99,102,241,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.10)]">

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-36 w-36 rounded-full bg-violet-100/50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-24 rounded-full bg-blue-100/30 blur-2xl" />

        {/* Top section */}
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            {/* Org badge */}
            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-500 font-mono">
                <Sparkles className="h-3 w-3 text-violet-400" />
                {currentOrg?.name || 'Workspace'} &middot; {currentOrg?.plan || 'Free'} Plan
              </span>
            </div>

            {/* Greeting */}
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                {firstName}!
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mt-2 text-sm text-slate-500 max-w-lg leading-relaxed">
              Your team completed{' '}
              <span className="font-semibold text-indigo-600 border-b border-indigo-200 pb-0.5">
                {completedThisWeek} tasks
              </span>{' '}
              this week.{' '}
              {activeSprint ? (
                <>
                  Active sprint{' '}
                  <span className="font-semibold text-slate-700">{sprintName}</span>{' '}
                  is at{' '}
                  <span className="font-semibold text-violet-600">{sprintProgress} velocity</span>{' '}
                  &mdash; great momentum!
                </>
              ) : (
                <>Create a project and active sprint to start tracking velocity.</>
              )}
            </p>
          </div>

          {/* Top-right quick stat pills */}
          <div className="hidden sm:flex flex-col gap-2">
            {[
              { icon: TrendingUp, label: 'Velocity', value: sprintProgress },
              { icon: Target, label: 'Sprint', value: activeSprint ? sprintName : 'N/A' },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:scale-[1.02]"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-400">{label}:</span>
                <span className="text-slate-700 font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative mt-5 border-t border-slate-100 pt-5">
          {/* Stat cards grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: 'Completion Rate',
                value: `${completionRate}%`,
                valueColor: 'text-emerald-600',
                bg: 'bg-emerald-50/60',
                border: 'border-emerald-100',
                hoverBorder: 'hover:border-emerald-200 hover:bg-emerald-50',
                clickable: false,
              },
              {
                label: 'Open Issues',
                value: String(openIssuesCount),
                valueColor: 'text-indigo-600',
                bg: 'bg-indigo-50/60',
                border: 'border-indigo-100',
                hoverBorder: 'hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-[0_4px_16px_rgba(99,102,241,0.10)]',
                clickable: true,
                onClick: () => onViewChange?.('tasks'),
              },
              {
                label: 'Active Members',
                value: String(currentOrg?.memberCount || 1),
                valueColor: 'text-violet-600',
                bg: 'bg-violet-50/60',
                border: 'border-violet-100',
                hoverBorder: 'hover:border-violet-200 hover:bg-violet-50 hover:shadow-[0_4px_16px_rgba(139,92,246,0.10)]',
                hide: true,
                clickable: true,
                onClick: () => onViewChange?.('members'),
              },
              {
                label: 'Total Tasks',
                value: String(totalTasks),
                valueColor: 'text-slate-700',
                bg: 'bg-slate-50/60',
                border: 'border-slate-200',
                hoverBorder: 'hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
                clickable: true,
                onClick: () => onViewChange?.('tasks'),
              },
            ].map((s) => {
              const Component = s.clickable ? 'button' : 'div';
              return (
                <Component
                  key={s.label}
                  onClick={s.onClick}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border ${s.border} ${s.bg} ${s.hoverBorder} ${s.hide ? 'hidden sm:flex' : 'flex'} ${s.clickable ? 'cursor-pointer hover:scale-[1.03]' : ''} transition-all duration-300 text-center w-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60`}
                >
                  <p className={`text-xl font-extrabold tracking-tight sm:text-2xl ${s.valueColor}`}>{s.value}</p>
                  <p className="text-[9px] text-slate-400 font-bold tracking-wider mt-1.5 uppercase font-mono">{s.label}</p>
                </Component>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
