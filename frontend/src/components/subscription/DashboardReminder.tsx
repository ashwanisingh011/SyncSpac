'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OrgSubscriptionStatus } from '@/types/workspace';

interface DashboardReminderProps {
  status: OrgSubscriptionStatus;
  onNavigateToBilling?: () => void;
}

export default function DashboardReminder({ status, onNavigateToBilling }: DashboardReminderProps) {
  const router = useRouter();

  if (!status || !status.anyExceeded) return null;

  const handleUpgradeClick = () => {
    if (onNavigateToBilling) {
      onNavigateToBilling();
    } else {
      router.push('/dashboard/billing');
    }
  };

  const exceededFields: string[] = [];
  if (status.exceeded.users) exceededFields.push('members');
  if (status.exceeded.projects) exceededFields.push('projects');
  if (status.exceeded.storage) exceededFields.push('storage');
  if (status.exceeded.customRoles) exceededFields.push('custom roles');

  const exceededStr = exceededFields.join(', ');

  return (
    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans mb-6 animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-950/40 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            Subscription limits exceeded!
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Your workspace on the <span className="font-bold text-slate-700 dark:text-slate-200">{status.planName}</span> plan has exceeded its limit for <span className="font-bold text-red-600 dark:text-red-400">{exceededStr}</span>. Upgrade to avoid any service disruptions.
          </p>
        </div>
      </div>
      <button
        onClick={handleUpgradeClick}
        className="flex items-center gap-1.5 px-4 py-2 bg-red-650 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800 text-white rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer"
      >
        Upgrade Plan
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
