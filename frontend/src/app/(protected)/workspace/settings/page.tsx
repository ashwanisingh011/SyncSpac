'use client';

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { uploadLogo } from '@/api/upload';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  deleteOrganization,
} from '@/api/workspace';
import { useToast } from '@/context/useToast';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import type { WorkspaceSettings } from '@/types/workspace';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'ja', label: 'Japanese' },
];

const DEFAULT_SETTINGS: WorkspaceSettings = {
  name: '',
  description: '',
  logoUrl: '',
  primaryColor: '#0052CC',
  secondaryColor: '#FFFFFF',
  timezone: 'Asia/Kolkata',
  language: 'en',
  defaultLayout: 'kanban',
};

function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function AccessDeniedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          You do not have permission to modify workspace settings. Please contact your Workspace Owner or Workspace Administrator if you need access.
        </p>
      </div>
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  const { showToast } = useToast();
  const { currentOrg, organizations, isOrgReady, refreshOrganizations } = useOrganization();
  const { hasPermission } = usePermission();
  const router = useRouter();
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadDenied, setLoadDenied] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const orgId = currentOrg?.id ?? '';
  const orgName = settings.name || currentOrg?.name || '';
  const canManageSettings = hasPermission('manage_workspace');
  const isOwner = currentOrg?.myRole === 'owner';

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      if (!isOrgReady) return;
      if (!orgId) {
        setIsLoadingSettings(false);
        return;
      }
      if (!canManageSettings) {
        setLoadDenied(true);
        setIsLoadingSettings(false);
        return;
      }

      setIsLoadingSettings(true);
      setLoadDenied(false);
      try {
        const nextSettings = await getOrganizationSettings(orgId);
        if (!cancelled) setSettings(nextSettings);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (!cancelled && status === 403) {
          setLoadDenied(true);
        } else if (!cancelled) {
          showToast(getFriendlyApiErrorMessage(err, 'We could not load workspace settings. Please try again.'), 'error');
        }
      } finally {
        if (!cancelled) setIsLoadingSettings(false);
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [canManageSettings, isOrgReady, orgId, showToast]);

  const set = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) {
      setLoadDenied(true);
      return;
    }
    if (!orgId) {
      showToast('No organization selected.', 'error');
      return;
    }
    if (!settings.name.trim()) {
      showToast('Workspace name is required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const savedSettings = await updateOrganizationSettings(orgId, {
        ...settings,
        name: settings.name.trim(),
        description: settings.description?.trim() ?? '',
        logoUrl: settings.logoUrl?.trim() ?? '',
      });
      setSettings(savedSettings);
      await refreshOrganizations();
      showToast('Settings saved successfully.', 'success');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        setLoadDenied(true);
      } else {
        showToast(getFriendlyApiErrorMessage(err, 'We could not save workspace settings. Please try again.'), 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please choose a JPG, PNG, or WebP image.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB.', 'error');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const response = await uploadLogo(file);
      if (response.success && response.url) {
        set('logoUrl', response.url);
        showToast('Logo uploaded. Save changes to apply.', 'success');
      } else {
        showToast('Failed to upload logo.', 'error');
      }
    } catch (err: unknown) {
      showToast('Failed to upload logo.', 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    set('logoUrl', '');
  };

  const openDeleteModal = () => {
    if (!isOwner) {
      showToast('Only organization owners can delete the workspace.', 'error');
      return;
    }
    setDeleteConfirmText('');
    setShowDeleteModal(true);
    setTimeout(() => deleteInputRef.current?.focus(), 50);
  };

  const handleDelete = async () => {
    if (!orgId) return;

    if (!isOwner) {
      showToast('Only organization owners can delete the workspace.', 'error');
      setShowDeleteModal(false);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteOrganization(orgId);
      showToast('Workspace deleted successfully.', 'success');
      setShowDeleteModal(false);
      await refreshOrganizations();
      const remaining = organizations.filter((o) => o.id !== orgId);
      if (remaining.length === 0) {
        router.push('/onboarding/no-org');
      } else if (remaining.length === 1) {
        router.push('/workspace');
      } else {
        router.push('/onboarding/select-org');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        showToast('Only organization owners can delete the workspace.', 'error');
      } else {
        showToast(getFriendlyApiErrorMessage(err, 'We could not delete this workspace. Please try again.'), 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOrgReady || isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-slate-500">
        No organization selected.
      </div>
    );
  }

  if (loadDenied || !canManageSettings) {
    return <AccessDeniedPage />;
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Workspace settings"
        subtitle="Manage workspace details, preferences, and appearance."
      />

      <form onSubmit={handleSave} className="space-y-6">
        <SectionCard title="Workspace details" description="Update the public name and description for this workspace.">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label htmlFor="workspace-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Workspace name
              </label>
              <input
                id="workspace-name"
                value={settings.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label htmlFor="workspace-description" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Details
              </label>
              <textarea
                id="workspace-description"
                value={settings.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Describe this workspace..."
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Appearance & branding" description="Set workspace colors and logo used across the product.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Workspace Logo
              </label>
              
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center relative shadow-sm">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Workspace Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#0052CC] flex items-center justify-center text-white font-black text-2xl">
                        {settings.name ? settings.name.substring(0, 2).toUpperCase() : 'WS'}
                      </div>
                    )}
                    {isUploadingLogo && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm shadow-blue-500/10 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingLogo ? 'Uploading...' : 'Upload logo'}
                    </button>
                    {settings.logoUrl && (
                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={handleRemoveLogo}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    JPG, PNG or WebP. Max file size 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* <div>
              <label htmlFor="s-primary" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Primary color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="s-primary"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700"
                />
                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                  {settings.primaryColor}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="s-secondary" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Secondary color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="s-secondary"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => set('secondaryColor', e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700"
                />
                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                  {settings.secondaryColor}
                </span>
              </div>
            </div> */}
          </div>
        </SectionCard>

        <SectionCard title="Preferences" description="Set defaults used by new workspace content.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="s-layout" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Default layout
              </label>
              <select
                id="s-layout"
                value={settings.defaultLayout}
                onChange={(e) => set('defaultLayout', e.target.value as WorkspaceSettings['defaultLayout'])}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="kanban">Kanban</option>
                <option value="list">List</option>
                <option value="calendar">Calendar</option>
                <option value="timeline">Timeline</option>
              </select>
            </div>

            <div>
              <label htmlFor="s-tz" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Timezone
              </label>
              <select
                id="s-tz"
                value={settings.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="s-lang" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Language
              </label>
              <select
                id="s-lang"
                value={settings.language}
                onChange={(e) => set('language', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !orgId}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900/40 dark:bg-slate-950">
        <h2 className="mb-1 text-base font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Permanently delete this workspace and all its data, including projects, tasks, and members. This action cannot be undone.
        </p>
        {!isOwner && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Only the organization owner can delete this workspace.
          </p>
        )}
        <button
          type="button"
          onClick={openDeleteModal}
          disabled={!orgId || !isOwner}
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:border-red-400 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <Trash2 className="h-4 w-4" />
          Delete workspace
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </span>
              <div>
                <h3 id="delete-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Delete &ldquo;{orgName}&rdquo;?
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  This will permanently delete the workspace and all associated data. There is no way to recover it.
                </p>
              </div>
            </div>

            <label htmlFor="delete-confirm-input" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Type <span className="font-semibold text-slate-900 dark:text-slate-100">{orgName}</span> to confirm
            </label>
            <input
              id="delete-confirm-input"
              ref={deleteInputRef}
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={orgName}
              disabled={isDeleting}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText !== orgName || isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="h-4 w-4" /> Delete workspace</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
