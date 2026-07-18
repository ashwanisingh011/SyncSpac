'use client';

import type { ReactNode } from 'react';
import type { BillingInfo } from '@/types/workspace';
import { CreditCard, Calendar, Users, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface BillingOverviewProps {
  billing: BillingInfo;
}

const STATUS_MAP: Record<
  BillingInfo['status'],
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  },
  trialing: {
    label: 'Trialing',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
  },
  trial: {
    label: 'Trial',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
  },
  past_due: {
    label: 'Past due',
    className: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
  },
  canceled: {
    label: 'Canceled',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 dark:bg-blue-950/40">
        <Icon className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function BillingOverview({ billing }: BillingOverviewProps) {
  const statusMeta = STATUS_MAP[billing?.status] || {
    label: billing?.status ? billing.status.charAt(0).toUpperCase() + billing.status.slice(1) : 'Unknown',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  const seatUsagePct = billing?.seats ? Math.round((billing.usedSeats / billing.seats) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {billing.status === 'past_due' && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 dark:bg-red-950/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">
            Your last payment failed. Please update your payment method to avoid service interruption.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={CreditCard}
          label="Current plan"
          value={billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)}
          sub={
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                statusMeta.className
              )}
            >
              {statusMeta.label}
            </span>
          }
        />
        <StatCard
          icon={Calendar}
          label="Next renewal"
          value={new Date(billing.currentPeriodEnd).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        />
        <StatCard
          icon={Users}
          label="Seats used"
          value={`${billing.usedSeats} / ${billing.seats}`}
        />
      </div>

      {/* Seat usage bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Seat usage
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {billing.usedSeats} of {billing.seats} seats
          </p>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              seatUsagePct >= 90 ? 'bg-red-500' : 'bg-blue-500',
            )}
            style={{ width: `${seatUsagePct}%` }}
          />
        </div>
        {seatUsagePct >= 90 && (
          <p className="mt-2 text-xs text-red-500">
            You&apos;re near your seat limit. Upgrade your plan to add more members.
          </p>
        )}
      </div>

      {/* Payment method */}
      {billing.cardLast4 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment method
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {billing.cardBrand?.toUpperCase()} ···· {billing.cardLast4}
              </p>
            </div>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
