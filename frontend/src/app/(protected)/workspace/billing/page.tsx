'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import PlanCard from '@/components/workspace/PlanCard';
import BillingOverview from '@/components/workspace/BillingOverview';
import { getBillingInfo, changePlan, getActivePlans } from '@/api/workspace';
import { useToast } from '@/context/useToast';
import { usePermission } from '@/hooks/usePermission';
import { useOrganization } from '@/context/useOrganization';
import type { BillingInfo, Plan, SubscriptionPlan } from '@/types/workspace';

// Dynamic org fallback
const WORKSPACE_ID = 'ws-1';

const MOCK_BILLING: BillingInfo = {
  plan: 'free',
  status: 'active',
  currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  seats: 5,
  usedSeats: 4,
  cardLast4: undefined,
  cardBrand: undefined,
};

const MOCK_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'monthly',
    description: 'For individuals and small teams getting started.',
    features: [
      { label: 'Up to 5 members', included: true },
      { label: '3 projects', included: true },
      { label: 'Basic issue tracking', included: true },
      { label: '2 GB storage', included: true },
      { label: 'Custom roles', included: false },
      { label: 'Advanced analytics', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 600,
    billingCycle: 'monthly',
    description: 'For growing teams that need more power and flexibility.',
    highlighted: true,
    features: [
      { label: 'Unlimited members', included: true },
      { label: 'Unlimited projects', included: true },
      { label: 'Full issue tracking', included: true },
      { label: '50 GB storage', included: true },
      { label: 'Custom roles', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 1200,
    billingCycle: 'monthly',
    description: 'For organizations that need enterprise-grade features.',
    features: [
      { label: 'Unlimited members', included: true },
      { label: 'Unlimited projects', included: true },
      { label: 'Full issue tracking', included: true },
      { label: '500 GB storage', included: true },
      { label: 'Custom roles', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority support', included: true },
    ],
  },
];

export default function BillingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { currentOrg, refreshOrganizations } = useOrganization();
  
  const orgId = currentOrg?.id || WORKSPACE_ID;

  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch billing info
        try {
          const billingInfo = await getBillingInfo(orgId);
          setBilling(billingInfo);
        } catch {
          setBilling(MOCK_BILLING);
        }

        // Fetch active plans
        try {
          const activePlans = await getActivePlans();
          setPlans(activePlans);
        } catch {
          setPlans(MOCK_PLANS);
        }
      } catch (err) {
        console.error('Error fetching billing/plans:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [orgId]);

  if (!hasPermission('manage_billing')) {
    return (
      <div className="space-y-8">
        <WorkspaceHeader
          title="Billing & Subscription"
          subtitle="Manage your plan, payment method, and usage."
        />
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-content-tertiary">
            You do not have permission to view or manage billing for this workspace.
          </p>
        </div>
      </div>
    );
  }

  const [pendingDowngradePlan, setPendingDowngradePlan] = useState<SubscriptionPlan | null>(null);

  const handlePlanChange = async (planId: SubscriptionPlan) => {
    if (!billing || planId === billing.plan) return;

    const activePlansList = plans.length > 0 ? plans : MOCK_PLANS;
    const currentPrice = activePlansList.find(p => p.id === billing.plan)?.price ?? 0;
    const targetPrice = activePlansList.find(p => p.id === planId)?.price ?? 0;

    if (targetPrice < currentPrice) {
      setPendingDowngradePlan(planId);
      return;
    }

    executePlanChange(planId);
  };

  const executePlanChange = async (planId: SubscriptionPlan) => {
    setPendingDowngradePlan(null);
    if (planId !== 'free') {
      router.push(`/checkout/${planId}`);
      return;
    }

    setChangingPlan(planId);
    try {
      const updated = await changePlan(orgId, planId);
      setBilling(updated);
      await refreshOrganizations();
      showToast(`Switched to ${planId} plan successfully.`, 'success');
    } catch {
      showToast('Failed to change plan. Please try again.', 'error');
    } finally {
      setChangingPlan(null);
    }
  };

  return (
    <div className="space-y-8">
      <WorkspaceHeader
        title="Billing & Subscription"
        subtitle="Manage your plan, payment method, and usage."
      />

      {/* Overview */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-hover animate-pulse" />
          ))}
        </div>
      ) : billing ? (
        <BillingOverview billing={billing} />
      ) : null}

      {/* Plan selector */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-content">
            Available plans
          </h2>
          <span className="text-xs text-content-tertiary">
            Billed monthly · Cancel anytime
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(plans.length > 0 ? plans : MOCK_PLANS).map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={billing?.plan === plan.id}
              onSelect={handlePlanChange}
              isLoading={changingPlan === plan.id}
            />
          ))}
        </div>
      </div>

      {/* FAQ / notes */}
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-base font-semibold text-content mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-4 text-sm text-content-secondary">
          {[
            {
              q: 'Can I upgrade or downgrade at any time?',
              a: 'Yes. Plan changes take effect immediately. If you upgrade, you are billed the prorated difference. If you downgrade, credits are applied to your next invoice.',
            },
            {
              q: 'What happens to my data if I cancel?',
              a: 'Your data is retained for 30 days after cancellation. After that it will be permanently deleted.',
            },
            {
              q: 'Do you offer annual billing?',
              a: 'Annual billing with a 20% discount is available for Pro and Business plans. Contact us to switch.',
            },
          ].map((faq) => (
            <div key={faq.q} className="border-b border-line pb-4 last:border-0 last:pb-0">
              <p className="font-medium text-content mb-1">{faq.q}</p>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Downgrade Confirmation Modal */}
      {pendingDowngradePlan && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-line/80 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 p-6 space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-amber-100 text-warning rounded-2xl flex items-center justify-center text-xl shrink-0">
                ⚠️
              </div>
              <h3 className="text-lg font-extrabold text-content mt-4">Confirm Subscription Downgrade</h3>
              <p className="text-xs text-content-tertiary leading-relaxed">
                You are currently on the <span className="font-bold text-content-secondary">{billing?.plan.toUpperCase()}</span> plan. 
                Downgrading to the <span className="font-bold text-content-secondary">{pendingDowngradePlan.toUpperCase()}</span> plan will apply immediately.
              </p>
              <div className="bg-warning/10 border border-amber-200/20 rounded-xl p-3 text-[11px] text-amber-800 leading-normal">
                <strong>Warning:</strong> Downgrading may reduce your workspace feature access, seat counts, and limit counts. Any active features beyond the new plan limits will be adjusted immediately.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDowngradePlan(null)}
                className="flex-1 py-2.5 bg-surface-hover hover:bg-surface-hover text-content-secondary rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executePlanChange(pendingDowngradePlan)}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all shadow-md"
              >
                Confirm Downgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
