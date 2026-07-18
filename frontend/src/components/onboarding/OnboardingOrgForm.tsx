'use client';

import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { Upload, X } from 'lucide-react';
import type { WorkspaceFormData } from '@/types/workspace';

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Other',
];

const TEAM_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

interface OnboardingOrgFormProps {
  onSubmit: (data: WorkspaceFormData) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function OnboardingOrgForm({
  onSubmit,
  submitLabel = 'Create & continue →',
  isLoading = false,
}: OnboardingOrgFormProps) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogo(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: 'Organization name is required.' });
      return;
    }
    setErrors({});
    await onSubmit({
      name: name.trim(),
      industry: industry || undefined,
      teamSize: teamSize || undefined,
      timezone,
      logo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="org-name"
          className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
        >
          Organization name <span className="text-red-500">*</span>
        </label>
        <input
          id="org-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="org-industry"
            className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
          >
            Industry <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            id="org-industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="org-team-size"
            className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
          >
            Team size <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            id="org-team-size"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Select team size</option>
            {TEAM_SIZES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="org-timezone"
          className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
        >
          Timezone <span className="text-red-500">*</span>
        </label>
        <select
          id="org-timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
          Logo <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Logo preview" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            PNG, JPG, GIF up to 2 MB.
          </p>

          {logo && (
            <button
              type="button"
              onClick={() => {
                setLogo(null);
                setPreview(null);
              }}
              className="text-red-500 hover:text-red-600"
              aria-label="Remove logo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Creating organization…' : submitLabel}
      </button>
    </form>
  );
}
