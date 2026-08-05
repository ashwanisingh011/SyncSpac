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
    className: 'bg-success/10 text-success',
  },
  trialing: {
    label: 'Trialing',
    className: 'bg-primary-subtle text-primary',
  },
  trial: {
    label: 'Trial',
    className: 'bg-primary-subtle text-primary',
  },
  past_due: {
    label: 'Past due',
    className: 'bg-danger/10 text-danger',
  },
  canceled: {
    label: 'Canceled',
    className: 'bg-surface-hover text-content-secondary',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-surface-hover text-content-secondary',
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
    <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="w-9 h-9 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-content-tertiary">{label}</p>
        <p className="text-sm font-semibold text-content mt-0.5">
          {value}
        </p>
        {sub && <p className="text-xs text-content-tertiary mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function BillingOverview({ billing }: BillingOverviewProps) {
  const statusMeta = STATUS_MAP[billing?.status] || {
    label: billing?.status ? billing.status.charAt(0).toUpperCase() + billing.status.slice(1) : 'Unknown',
    className: 'bg-surface-hover text-content-secondary',
  };
  const seatUsagePct = billing?.seats ? Math.round((billing.usedSeats / billing.seats) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {billing.status === 'past_due' && (
        <div className="flex items-center gap-3 rounded-xl bg-danger/10 border border-danger/25 px-4 py-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0" />
          <p className="text-sm text-danger">
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
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-content-secondary">
            Seat usage
          </p>
          <p className="text-sm text-content-tertiary">
            {billing.usedSeats} of {billing.seats} seats
          </p>
        </div>
        <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              seatUsagePct >= 90 ? 'bg-danger' : 'bg-primary',
            )}
            style={{ width: `${seatUsagePct}%` }}
          />
        </div>
        {seatUsagePct >= 90 && (
          <p className="mt-2 text-xs text-danger">
            You&apos;re near your seat limit. Upgrade your plan to add more members.
          </p>
        )}
      </div>

      {/* Payment method */}
      {billing.cardLast4 && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-content-secondary mb-1">
                Payment method
              </p>
              <p className="text-sm text-content-tertiary">
                {billing.cardBrand?.toUpperCase()} ···· {billing.cardLast4}
              </p>
            </div>
            <button className="text-sm font-medium text-primary hover:text-primary-hover">
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
