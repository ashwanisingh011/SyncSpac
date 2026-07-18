'use client';

import { X, Sparkles, CreditCard, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OrgSubscriptionStatus } from '@/types/workspace';

interface UpgradePlanPopupProps {
  status: OrgSubscriptionStatus;
  onClose?: () => void;
  onNavigateToBilling?: () => void;
}

export default function UpgradePlanPopup({ status, onClose, onNavigateToBilling }: UpgradePlanPopupProps) {
  const router = useRouter();

  if (!status || !status.anyExceeded) return null;

  const handleUpgradeClick = () => {
    if (onNavigateToBilling) {
      onNavigateToBilling();
    } else {
      router.push('/dashboard/billing');
    }
  };

  // Build lists of exceeded features
  const exceededItems: { name: string; current: string; allowed: string }[] = [];
  if (status.exceeded.users) {
    exceededItems.push({
      name: 'Members/Users limit',
      current: `${status.usage.users}`,
      allowed: `${status.limits.users}`,
    });
  }
  if (status.exceeded.projects) {
    exceededItems.push({
      name: 'Projects limit',
      current: `${status.usage.projects}`,
      allowed: `${status.limits.projects}`,
    });
  }
  if (status.exceeded.storage) {
    exceededItems.push({
      name: 'Storage limit',
      current: `${status.usage.storageGB.toFixed(2)} GB`,
      allowed: `${status.limits.storage} GB`,
    });
  }
  if (status.exceeded.customRoles) {
    exceededItems.push({
      name: 'Custom Roles feature',
      current: 'Enabled/In-use',
      allowed: 'Not included in your current plan',
    });
  }

  return (
    <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-350">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800/80 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        
        {/* Colorful top decoration */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-600"></div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold text-[10px] tracking-wide uppercase font-sans">
                <AlertTriangle className="w-3.5 h-3.5" />
                Action Required
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-sans mt-2">
                Subscription Limit Exceeded
              </h3>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            Your organization is currently on the <span className="font-bold text-slate-700 dark:text-slate-200">{status.planName}</span> plan and has exceeded its subscription limits. Some workspace operations may be temporarily restricted.
          </p>

          {/* Exceeded Features Display */}
          <div className="space-y-3">
            {exceededItems.map((item) => (
              <div 
                key={item.name}
                className="flex items-center justify-between p-4 bg-red-50/40 dark:bg-red-950/10 rounded-2xl border border-red-100/50 dark:border-red-950/20 font-sans"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-red-900 dark:text-red-300">{item.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Current plan limit: {item.allowed}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-red-100/50 dark:bg-red-950/30 text-red-650 dark:text-red-450 border border-red-200/20">
                    {item.current}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100/10 rounded-2xl p-4 flex gap-3 font-sans items-start">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Upgrade Recommendation</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                Unlock higher limits, advanced analytics, priority support, and custom roles. Scale your workspace operations seamlessly.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleUpgradeClick}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-xs transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer font-sans"
            >
              <CreditCard className="w-4 h-4" />
              Upgrade Subscription
            </button>
            <button
              onClick={handleUpgradeClick}
              className="py-3 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer font-sans"
            >
              View Billing &amp; Plans
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
