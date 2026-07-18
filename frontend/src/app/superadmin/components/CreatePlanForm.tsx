'use client';

import { useState } from 'react';
import { createPlan } from '@/api/workspace';
import type { Plan } from '@/types/workspace';
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { useToast } from '@/context/useToast';

interface CreatePlanFormProps {
  onNavigate: (view: string) => void;
}

interface FeatureInput {
  label: string;
  included: boolean;
}

export default function CreatePlanForm({ onNavigate }: CreatePlanFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [price, setPrice] = useState('0.00');
  const [currency, setCurrency] = useState('INR');
  const [isActive, setIsActive] = useState(true);
  const [badge, setBadge] = useState('');

  // Features List (initially has 3 empty rows exactly like the screenshot)
  const [features, setFeatures] = useState<FeatureInput[]>([
    { label: '', included: true },
    { label: '', included: true },
    { label: '', included: true },
  ]);

  // Limits
  const [limitUsers, setLimitUsers] = useState('10');
  const [limitUsersUnlimited, setLimitUsersUnlimited] = useState(true);

  const [limitProjects, setLimitProjects] = useState('20');
  const [limitProjectsUnlimited, setLimitProjectsUnlimited] = useState(true);

  const [limitStorage, setLimitStorage] = useState('50');
  const [limitStorageUnlimited, setLimitStorageUnlimited] = useState(true);

  const [limitApi, setLimitApi] = useState('10000');
  const [limitApiUnlimited, setLimitApiUnlimited] = useState(true);

  // Add Feature Row
  const addFeature = () => {
    setFeatures([...features, { label: '', included: true }]);
  };

  // Remove Feature Row
  const removeFeature = (index: number) => {
    const updated = features.filter((_, i) => i !== index);
    setFeatures(updated);
  };

  // Update Feature Row Label
  const updateFeatureLabel = (index: number, label: string) => {
    const updated = [...features];
    updated[index].label = label;
    setFeatures(updated);
  };

  // Update Feature Row Included Status
  const updateFeatureIncluded = (index: number, included: boolean) => {
    const updated = [...features];
    updated[index].included = included;
    setFeatures(updated);
  };

  // Move Feature up in list
  const moveFeatureUp = (index: number) => {
    if (index === 0) return;
    const updated = [...features];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setFeatures(updated);
  };

  // Move Feature down in list
  const moveFeatureDown = (index: number) => {
    if (index === features.length - 1) return;
    const updated = [...features];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setFeatures(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Plan Name is required.', 'error');
      return;
    }

    if (!code.trim()) {
      showToast('Plan Code is required.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty features
      const filteredFeatures = features
        .map((f) => ({ label: f.label.trim(), included: f.included }))
        .filter((f) => f.label.length > 0);

      const planPayload: Partial<Plan> = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        billingCycle,
        price: parseFloat(price) || 0,
        currency,
        status: isActive ? 'active' : 'inactive',
        badge: badge.trim(),
        features: filteredFeatures,
        limits: {
          users: limitUsersUnlimited ? -1 : parseInt(limitUsers) || 0,
          projects: limitProjectsUnlimited ? -1 : parseInt(limitProjects) || 0,
          storage: limitStorageUnlimited ? -1 : parseInt(limitStorage) || 0,
          apiCalls: limitApiUnlimited ? -1 : parseInt(limitApi) || 0,
        },
      };

      await createPlan(planPayload);

      showToast(`Subscription plan "${name}" created successfully.`, 'success');
      onNavigate('subscriptions');
    } catch (error: any) {
      console.error('Failed to create plan:', error);
      const errMsg = error.response?.data?.message || 'Failed to create plan. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Header and Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span>Plans</span>
          <span>/</span>
          <span className="text-slate-600">Create Plan</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">Create Subscription Plan</h1>
      </div>

      {/* Plan Information Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Plan Information</h2>
          <p className="text-xs text-slate-400 mt-0.5">Basic details about the subscription plan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Name */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Pro Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
            />
          </div>

          {/* Plan Code */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Plan Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., PRO"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
            />
            <span className="text-[10px] text-slate-400 mt-1">
              Unique code for internal reference. Use uppercase letters.
            </span>
          </div>

          {/* Description */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
            <textarea
              rows={3}
              placeholder="Describe the plan and its benefits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
            />
            <span className="text-[10px] text-slate-400 mt-1">This will be shown to your customers.</span>
          </div>

          {/* Billing Cycle */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Billing Cycle <span className="text-red-500">*</span>
            </label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1">Choose how often the plan will be billed.</span>
          </div>

          {/* Price */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Price (MRR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Monthly Recurring Revenue amount.</span>
          </div>

          {/* Currency */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
            >
              <option value="INR">INR - Indian Rupee (₹)</option>
              <option value="USD">USD - US Dollar ($)</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1">Select the currency for this plan.</span>
          </div>

          {/* Plan Badge */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Plan Badge (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Best Value"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
            />
            <span className="text-[10px] text-slate-400 mt-1">Short label to highlight this plan.</span>
          </div>

          {/* Status (Toggle Active/Inactive) */}
          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Plan Status</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`
                  relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                  transition-colors duration-200 ease-in-out focus:outline-none
                  ${isActive ? 'bg-blue-600' : 'bg-slate-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${isActive ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
              <span className="text-sm font-medium text-slate-700">{isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              Inactive plans won't be available for new subscriptions.
            </span>
          </div>
        </div>
      </div>

      {/* Features & Limits Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature list */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Features & Limits</h2>
            <p className="text-xs text-slate-400 mt-0.5">Define what's included in this plan.</p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Feature List</span>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 group">
                {/* drag sort markers */}
                <div className="flex flex-col gap-0.5 text-slate-300">
                  <button
                    type="button"
                    onClick={() => moveFeatureUp(index)}
                    disabled={index === 0}
                    className="hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-300"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFeatureDown(index)}
                    disabled={index === features.length - 1}
                    className="hover:text-slate-600 disabled:opacity-30 disabled:hover:text-slate-300"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Feature Input */}
                <input
                  type="text"
                  placeholder="e.g., Up to 10 Users"
                  value={feature.label}
                  onChange={(e) => updateFeatureLabel(index, e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800"
                />

                {/* Status Dropdown */}
                <select
                  value={feature.included ? 'included' : 'excluded'}
                  onChange={(e) => updateFeatureIncluded(index, e.target.value === 'included')}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
                >
                  <option value="included">Included</option>
                  <option value="excluded">Excluded</option>
                </select>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addFeature}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 hover:border-slate-400 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Feature
          </button>
        </div>

        {/* Plan Limits */}
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Plan Limits</h2>
            <p className="text-xs text-slate-400 mt-0.5">Set usage limits for key resources.</p>
          </div>

          <div className="space-y-4">
            {/* Users Limit */}
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 shrink-0">Users</label>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="number"
                  min="1"
                  disabled={limitUsersUnlimited}
                  value={limitUsersUnlimited ? '' : limitUsers}
                  onChange={(e) => setLimitUsers(e.target.value)}
                  placeholder={limitUsersUnlimited ? 'Unlimited' : 'e.g., 10'}
                  className={`
                    w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${limitUsersUnlimited ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-800'}
                  `}
                />
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={limitUsersUnlimited}
                    onChange={(e) => setLimitUsersUnlimited(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  Unlimited
                </label>
              </div>
            </div>

            {/* Projects Limit */}
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 shrink-0">Projects</label>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="number"
                  min="1"
                  disabled={limitProjectsUnlimited}
                  value={limitProjectsUnlimited ? '' : limitProjects}
                  onChange={(e) => setLimitProjects(e.target.value)}
                  placeholder={limitProjectsUnlimited ? 'Unlimited' : 'e.g., 20'}
                  className={`
                    w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${limitProjectsUnlimited ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-800'}
                  `}
                />
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={limitProjectsUnlimited}
                    onChange={(e) => setLimitProjectsUnlimited(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  Unlimited
                </label>
              </div>
            </div>

            {/* Storage Limit */}
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 shrink-0">
                Storage (GB)
              </label>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="number"
                  min="1"
                  disabled={limitStorageUnlimited}
                  value={limitStorageUnlimited ? '' : limitStorage}
                  onChange={(e) => setLimitStorage(e.target.value)}
                  placeholder={limitStorageUnlimited ? 'Unlimited' : 'e.g., 50'}
                  className={`
                    w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${limitStorageUnlimited ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-800'}
                  `}
                />
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={limitStorageUnlimited}
                    onChange={(e) => setLimitStorageUnlimited(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  Unlimited
                </label>
              </div>
            </div>

            {/* API Calls Limit */}
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 shrink-0">
                API Calls / Month
              </label>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="number"
                  min="1"
                  disabled={limitApiUnlimited}
                  value={limitApiUnlimited ? '' : limitApi}
                  onChange={(e) => setLimitApi(e.target.value)}
                  placeholder={limitApiUnlimited ? 'Unlimited' : 'e.g., 10000'}
                  className={`
                    w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${limitApiUnlimited ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-800'}
                  `}
                />
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={limitApiUnlimited}
                    onChange={(e) => setLimitApiUnlimited(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  Unlimited
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onNavigate('subscriptions')}
          disabled={isSubmitting}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Plan...' : 'Create Plan'}
        </button>
      </div>
    </form>
  );
}
