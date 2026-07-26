'use client';

import { CreditCard, Sparkles, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useOrganization } from '@/context/useOrganization';
import Link from 'next/link';

interface BillingWidgetProps {
  membersCount: number;
  onManageBilling?: () => void;
}

export default function BillingWidget({ membersCount, onManageBilling }: BillingWidgetProps) {
  const { currentOrg } = useOrganization();

  const subStatus = currentOrg?.subscriptionStatus;
  const rawPlan = (currentOrg?.plan ?? 'free').toLowerCase();
  const planLabel = subStatus?.planName ?? (rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1));

  // Dynamically resolve features from subscription status
  const features: string[] = [];
  if (subStatus) {
    features.push(`${subStatus.limits.projects === -1 ? 'Unlimited' : subStatus.limits.projects} projects`);
    features.push(`${subStatus.limits.users === -1 ? 'Unlimited' : subStatus.limits.users} members`);
    features.push(`${subStatus.limits.storage === -1 ? 'Unlimited' : subStatus.limits.storage} GB storage`);
    if (subStatus.limits.customRoles) features.push('Custom roles');
    if (subStatus.limits.analytics) features.push('Advanced analytics');
    if (subStatus.limits.prioritySupport) features.push('Priority support');
  } else {
    // Fallback if subscription status is loading
    features.push('5 projects', '2 members', '1 GB storage');
  }

  const planColors: Record<string, { bg: string; borderL: string; text: string; btn: string }> = {
    free:       { bg: 'bg-surface-sunken/30', borderL: 'border-l-content-tertiary', text: 'text-content-secondary', btn: 'bg-surface-hover hover:bg-surface-hover text-content-secondary' },
    basic:      { bg: 'bg-[#DEEBFF]/30', borderL: 'border-l-[#0052CC]', text: 'text-primary', btn: 'bg-primary hover:bg-primary-hover text-white' },
    pro:        { bg: 'bg-[#DEEBFF]/30', borderL: 'border-l-[#0052CC]', text: 'text-primary', btn: 'bg-primary hover:bg-primary-hover text-white' },
    business:   { bg: 'bg-success/10', borderL: 'border-l-success', text: 'text-success', btn: 'bg-success hover:bg-success/90 text-white' },
    unlimited:  { bg: 'bg-success/10', borderL: 'border-l-success', text: 'text-success', btn: 'bg-success hover:bg-success/90 text-white' },
  };

  const colors = planColors[rawPlan] ?? planColors.pro;

  // Resolve member limit & usage dynamically
  const usersLimit = subStatus?.limits?.users ?? 5;
  const usersLimitLabel = usersLimit === -1 ? 'Unlimited' : String(usersLimit);
  const seatsUsage = subStatus?.usage?.users ?? membersCount;
  const memberUsageStr = `${seatsUsage}/${usersLimitLabel}`;

  const nextPlan =
    rawPlan === 'free' ? 'Basic' :
    rawPlan === 'basic' ? 'Pro' :
    rawPlan === 'pro' ? 'Business' : null;

  return (
    <div className="bg-surface rounded border border-line p-5 font-sans">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-content">Billing &amp; Subscription</h3>
        <p className="text-xs text-content-tertiary mt-0.5 font-sans">Current plan &amp; usage overview</p>
      </div>

      {/* Plan card */}
      <div
        className={`relative overflow-hidden rounded border border-line border-l-4 ${colors.borderL} ${colors.bg} p-4 mb-4`}
      >
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className={`w-4 h-4 ${colors.text}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
              Current Plan
            </span>
          </div>
          <p className="text-2xl font-bold text-content">{planLabel}</p>
          <p className="text-xs text-content-tertiary mt-1 font-sans">
            {currentOrg?.name || 'Workspace'} workspace
          </p>
        </div>
      </div>

      {/* Dynamic Features List */}
      <div className="space-y-2 mb-4">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs text-content-secondary font-sans">{f}</span>
          </div>
        ))}
      </div>

      {/* Dynamic Usage Overview */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-surface-hover rounded border border-line">
        {[
          { label: 'Members Used', value: memberUsageStr },
          { label: 'Plan Status',  value: planLabel },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-sm font-bold text-content">{s.value}</p>
            <p className="text-[10px] text-content-tertiary">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alert banner if limits exceeded inside the widget */}
      {subStatus?.anyExceeded && (
        <div className="mb-4 p-3 bg-danger/10 border border-red-200/45 rounded-xl flex items-start gap-2 text-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-normal font-medium">
            Some plan limits have been exceeded. Please upgrade your plan.
          </div>
        </div>
      )}

      {/* CTA */}
      {nextPlan ? (
        onManageBilling ? (
          <button
            onClick={onManageBilling}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${colors.btn}`}
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to {nextPlan}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Link
            href="/dashboard/billing"
            className={`w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-semibold transition-colors ${colors.btn}`}
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to {nextPlan}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )
      ) : onManageBilling ? (
        <button
          onClick={onManageBilling}
          className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-semibold text-primary-content transition-colors bg-primary hover:bg-primary-hover cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          Manage Billing
        </button>
      ) : (
        <Link
          href="/dashboard/billing"
          className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-semibold text-primary-content transition-colors bg-primary hover:bg-primary-hover"
        >
          <ShieldCheck className="w-4 h-4" />
          Manage Billing
        </Link>
      )}
    </div>
  );
}
