'use client';

import { Check } from 'lucide-react';
import type { Plan } from '@/types/workspace';
import clsx from 'clsx';

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan: boolean;
  onSelect: (planId: Plan['id']) => Promise<void>;
  isLoading?: boolean;
}

export default function PlanCard({
  plan,
  isCurrentPlan,
  onSelect,
  isLoading = false,
}: PlanCardProps) {
  return (
    <div
      className={clsx(
        'relative flex flex-col rounded-2xl border p-6 transition-shadow',
        plan.highlighted
          ? 'border-primary bg-primary text-white shadow-lg '
          : 'border-line bg-surface',
      )}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-amber-400 px-3 py-0.5 text-xs font-semibold text-content shadow">
          Most popular
        </span>
      )}

      <div className="mb-5">
        <h3
          className={clsx(
            'text-sm font-semibold uppercase tracking-widest',
            plan.highlighted ? 'text-blue-100' : 'text-content-tertiary',
          )}
        >
          {plan.name}
        </h3>
        <div className="mt-2 flex items-end gap-1">
          <span
            className={clsx(
              'text-4xl font-bold',
              plan.highlighted ? 'text-white' : 'text-content',
            )}
          >
            {plan.price === 0 ? 'Free' : `${plan.currency === 'USD' ? '$' : '₹'}${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span
              className={clsx(
                'mb-1 text-sm',
                plan.highlighted ? 'text-blue-200' : 'text-content-tertiary',
              )}
            >
              / seat / mo
            </span>
          )}
        </div>
        <p
          className={clsx(
            'mt-2 text-sm',
            plan.highlighted ? 'text-blue-100' : 'text-content-secondary',
          )}
        >
          {plan.description}
        </p>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6">
        {plan.features.map((f, i) => (
          <li
            key={i}
            className={clsx(
              'flex items-start gap-2 text-sm',
              !f.included && 'opacity-40',
              plan.highlighted
                ? 'text-blue-50'
                : 'text-content-secondary',
            )}
          >
            <Check
              className={clsx(
                'mt-0.5 w-4 h-4 shrink-0',
                f.included
                  ? plan.highlighted
                    ? 'text-white'
                    : 'text-primary'
                  : 'text-content-tertiary',
              )}
            />
            {f.label}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {!(plan.id === 'free' && !isCurrentPlan) && (
        <button
          onClick={() => onSelect(plan.id)}
          disabled={isCurrentPlan || isLoading}
          className={clsx(
            'w-full rounded-xl py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed',
            plan.highlighted
              ? 'bg-surface text-primary hover:bg-primary-subtle focus:ring-white disabled:opacity-70'
              : isCurrentPlan
                ? 'bg-surface-hover text-content-tertiary'
                : 'bg-primary text-white hover:bg-primary-hover focus:ring-primary/30',
          )}
        >
          {isCurrentPlan ? 'Current plan' : isLoading ? 'Processing…' : 'Upgrade'}
        </button>
      )}
    </div>
  );
}
