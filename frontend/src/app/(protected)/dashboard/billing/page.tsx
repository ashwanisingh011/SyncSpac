'use client';

/**
 * /dashboard/billing — Billing & Plans page for org-owners.
 */

import BillingPage from '@/app/(protected)/workspace/billing/page';

export default function DashboardBillingPage() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 p-6">
      <BillingPage />
    </div>
  );
}
