'use client';

import { useState, useEffect } from 'react';
import { getPlatformPlans, deletePlan, updatePlan } from '@/api/workspace';
import type { Plan } from '@/types/workspace';
import { Plus, Search, Trash2, Edit3, BadgeInfo, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/context/useToast';

interface PlansListViewProps {
  onNavigate: (view: string) => void;
  onEditPlan?: (plan: Plan) => void;
}

/* ─── Confirm Modal ─────────────────────────────────────────────────────── */
interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-[welcomeSlideUp_0.2s_ease_forwards]">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
          <AlertTriangle className={`h-5 w-5 ${danger ? 'text-red-500' : 'text-amber-500'}`} />
        </div>

        {/* Content */}
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="mt-5 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer ${danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function PlansListView({ onNavigate, onEditPlan }: PlansListViewProps) {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    danger: false,
    onConfirm: () => { },
  });

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const data = await getPlatformPlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to fetch platform plans:', error);
      showToast('Failed to load plans from database.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = (code: string) => {
    setModal({
      open: true,
      title: 'Delete Plan',
      message: `Are you sure you want to permanently delete the plan "${code.toUpperCase()}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        closeModal();
        try {
          await deletePlan(code);
          showToast(`Plan ${code.toUpperCase()} permanently deleted successfully.`, 'success');
          fetchPlans();
        } catch (error) {
          console.error('Failed to delete plan:', error);
          showToast('Failed to delete the plan. Please try again.', 'error');
        }
      },
    });
  };

  const handleToggleStatus = (plan: Plan) => {
    const isActivating = plan.status === 'inactive';
    const actionText = isActivating ? 'activate' : 'deactivate';
    setModal({
      open: true,
      title: `${isActivating ? 'Activate' : 'Deactivate'} Plan`,
      message: `Are you sure you want to ${actionText} the plan "${plan.name}"?`,
      confirmLabel: isActivating ? 'Activate' : 'Deactivate',
      danger: !isActivating,
      onConfirm: async () => {
        closeModal();
        try {
          await updatePlan(plan.id, { status: isActivating ? 'active' : 'inactive' });
          showToast(
            `Plan "${plan.name}" has been ${isActivating ? 'activated' : 'deactivated'} successfully.`,
            'success'
          );
          fetchPlans();
        } catch (error) {
          console.error(`Failed to ${actionText} plan:`, error);
          showToast(`Failed to ${actionText} the plan. Please try again.`, 'error');
        }
      },
    });
  };

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLimit = (value: number | undefined, suffix = '') => {
    if (value === undefined || value === -1) {
      return <span className="text-slate-400">Unlimited</span>;
    }
    return <span className="font-semibold text-slate-700">{value}{suffix}</span>;
  };

  return (
    <>
      {/* Confirm Modal */}
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        confirmLabel={modal.confirmLabel}
        danger={modal.danger}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />

      <div className="space-y-6">
        {/* Header and Breadcrumbs */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span>Plans</span>
              <span>/</span>
              <span className="text-slate-600">Manage Plans</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">Subscription Plans</h1>
            <p className="text-xs text-slate-500">Configure subscription tiers and usage limits for organizations.</p>
          </div>
          <button
            onClick={() => onNavigate('create-plan')}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </div>

        {/* Main card */}
        <div className="bg-transparent sm:bg-white rounded-xl sm:border sm:border-slate-100 sm:shadow-sm overflow-hidden">
          {/* Search and filters */}
          <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-100 sm:border-none sm:rounded-none sm:border-b sm:border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search plans by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Table / Grid list */}
          {isLoading ? (
            <div className="p-4 lg:p-8 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 lg:h-16 rounded-xl bg-white lg:bg-slate-50 border border-slate-100 lg:border-none animate-pulse" />
              ))}
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-100 lg:border-none mt-4 lg:mt-0">
              <BadgeInfo className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No plans found</p>
              <p className="text-slate-400 text-xs mt-1">Try expanding your search or create a new plan.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Plan Name &amp; Details</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Limits (Users / Proj / Storage / API)</th>
                      <th className="px-6 py-4 text-center">Features</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredPlans.map((plan) => {
                      return (
                        <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Name & Badge */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{plan.name}</span>
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                                {plan.id.toUpperCase()}
                              </span>
                              {plan.badge && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                  {plan.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs truncate">{plan.description}</p>
                          </td>

                          {/* Pricing */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">
                              {plan.price === 0 ? (
                                <span className="text-emerald-600">Free</span>
                              ) : (
                                <span>₹{plan.price}</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              per {plan.billingCycle}
                            </div>
                          </td>

                          {/* Limits */}
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                            <div className="flex flex-col gap-1 text-xs">
                              <div>
                                <span className="text-slate-400 mr-1.5 font-medium">Users:</span>
                                <span className="font-semibold">{renderLimit(plan.limits?.users)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 mr-1.5 font-medium">Projects:</span>
                                <span className="font-semibold">{renderLimit(plan.limits?.projects)}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 mr-1.5 font-medium">Storage:</span>
                                <span className="font-semibold">{renderLimit(plan.limits?.storage, ' GB')}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 mr-1.5 font-medium">API:</span>
                                <span className="font-semibold">{renderLimit(plan.limits?.apiCalls, '/mo')}</span>
                              </div>
                            </div>
                          </td>

                          {/* Features count */}
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 w-6 h-6 text-xs font-bold">
                              {plan.features.filter((f) => f.included).length}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleToggleStatus(plan)}
                                className={`
                                  relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                  ${plan.status === 'active' || plan.status === undefined ? 'bg-emerald-500' : 'bg-slate-200'}
                                `}
                                title={plan.status === 'active' || plan.status === undefined ? 'Deactivate plan' : 'Activate plan'}
                              >
                                <span
                                  className={`
                                    pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 
                                    transition duration-200 ease-in-out
                                    ${plan.status === 'active' || plan.status === undefined ? 'translate-x-4' : 'translate-x-0'}
                                  `}
                                />
                              </button>
                              <span
                                className={`
                                  text-xs font-semibold min-w-[50px] text-left
                                  ${plan.status === 'active' || plan.status === undefined
                                    ? 'text-emerald-700'
                                    : 'text-slate-500'
                                  }
                                `}
                              >
                                {plan.status === 'active' || plan.status === undefined ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {onEditPlan && (
                                <button
                                  onClick={() => onEditPlan(plan)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="Edit Plan"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {plan.status === 'inactive' && (
                                <button
                                  onClick={() => handleDelete(plan.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 cursor-pointer transition-colors"
                                  title="Permanently Delete Plan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="block lg:hidden space-y-4 mt-4">
                {filteredPlans.map((plan) => (
                  <div key={plan.id} className="bg-white border border-slate-100 rounded-xl p-4 space-y-4 shadow-sm">
                    {/* Name, Badge, Actions Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 text-sm">{plan.name}</span>
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                            {plan.id.toUpperCase()}
                          </span>
                          {plan.badge && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{plan.description}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {onEditPlan && (
                          <button
                            onClick={() => onEditPlan(plan)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Plan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {plan.status === 'inactive' && (
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Permanently Delete Plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Pricing and Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-50 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 text-sm">
                          {plan.price === 0 ? <span className="text-emerald-600">Free</span> : `₹${plan.price}`}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">/ {plan.billingCycle}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(plan)}
                          className={`
                            relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                            transition-colors duration-200 ease-in-out focus:outline-none
                            ${plan.status === 'active' || plan.status === undefined ? 'bg-emerald-500' : 'bg-slate-200'}
                          `}
                          title={plan.status === 'active' || plan.status === undefined ? 'Deactivate plan' : 'Activate plan'}
                        >
                          <span
                            className={`
                              pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm
                              transition duration-200 ease-in-out
                              ${plan.status === 'active' || plan.status === undefined ? 'translate-x-3.5' : 'translate-x-0'}
                            `}
                          />
                        </button>
                        <span className={`text-[11px] font-semibold min-w-[45px] ${plan.status === 'active' || plan.status === undefined ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {plan.status === 'active' || plan.status === undefined ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Limits & Features Info (Line-by-Line Stack) */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Users Limit:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-250">{renderLimit(plan.limits?.users)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Projects Limit:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-250">{renderLimit(plan.limits?.projects)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Storage Limit:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-250">{renderLimit(plan.limits?.storage, ' GB')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">API Calls Limit:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-250">{renderLimit(plan.limits?.apiCalls, '/mo')}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-150/60 dark:border-slate-800/80 pt-2.5">
                        <span className="text-slate-400 font-medium">Included Features:</span>
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          {plan.features.filter((f) => f.included).length} enabled
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
