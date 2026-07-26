'use client';

/**
 * /dashboard/billing — Billing & Plans page for org-owners.
 */

import BillingPage from '@/app/(protected)/workspace/billing/page';

export default function DashboardBillingPage() {
  return (
    <div className="bg-surface rounded-2xl border border-line p-6">
      <BillingPage />
    </div>
  );
}
