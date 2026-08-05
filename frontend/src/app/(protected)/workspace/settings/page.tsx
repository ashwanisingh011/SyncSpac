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
  primaryColor: 'var(--primary)',
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
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-content">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-content-tertiary">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function AccessDeniedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-content">Access Restricted</h1>
        <p className="mt-2 text-sm leading-6 text-content-secondary">
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
        <Loader2 className="h-6 w-6 animate-spin text-content-tertiary" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-content-tertiary">
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
              <label htmlFor="workspace-name" className="mb-1.5 block text-sm font-medium text-content-secondary">
                Workspace name
              </label>
              <input
                id="workspace-name"
                value={settings.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-line-focus"
                required
              />
            </div>

            <div>
              <label htmlFor="workspace-description" className="mb-1.5 block text-sm font-medium text-content-secondary">
                Details
              </label>
              <textarea
                id="workspace-description"
                value={settings.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                className="w-full resize-y rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-line-focus"
                placeholder="Describe this workspace..."
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Appearance & branding" description="Set workspace colors and logo used across the product.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-content-secondary">
                Workspace Logo
              </label>
              
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-line bg-surface-sunken flex items-center justify-center relative shadow-sm">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Workspace Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content font-black text-2xl">
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
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-content text-xs font-semibold transition-all shadow-sm shadow-blue-500/10 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingLogo ? 'Uploading...' : 'Upload logo'}
                    </button>
                    {settings.logoUrl && (
                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={handleRemoveLogo}
                        className="px-3.5 py-1.5 rounded-lg border border-line hover:bg-surface-hover text-content-secondary text-xs font-semibold transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-content-tertiary">
                    JPG, PNG or WebP. Max file size 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* <div>
              <label htmlFor="s-primary" className="mb-1.5 block text-sm font-medium text-content-secondary">
                Primary color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="s-primary"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded-lg border border-line-strong"
                />
                <span className="text-sm font-mono text-content-secondary">
                  {settings.primaryColor}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="s-secondary" className="mb-1.5 block text-sm font-medium text-content-secondary">
                Secondary color
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="s-secondary"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => set('secondaryColor', e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded-lg border border-line-strong"
                />
                <span className="text-sm font-mono text-content-secondary">
                  {settings.secondaryColor}
                </span>
              </div>
            </div> */}
          </div>
        </SectionCard>

        <SectionCard title="Preferences" description="Set defaults used by new workspace content.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="s-layout" className="mb-1.5 block text-sm font-medium text-content-secondary">
                Default layout
              </label>
              <select
                id="s-layout"
                value={settings.defaultLayout}
                onChange={(e) => set('defaultLayout', e.target.value as WorkspaceSettings['defaultLayout'])}
                className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-line-focus"
              >
                <option value="kanban">Kanban</option>
                <option value="list">List</option>
                <option value="calendar">Calendar</option>
                <option value="timeline">Timeline</option>
              </select>
            </div>

            <div>
              <label htmlFor="s-tz" className="mb-1.5 block text-sm font-medium text-content-secondary">
                Timezone
              </label>
              <select
                id="s-tz"
                value={settings.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-line-focus"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="s-lang" className="mb-1.5 block text-sm font-medium text-content-secondary">
                Language
              </label>
              <select
                id="s-lang"
                value={settings.language}
                onChange={(e) => set('language', e.target.value)}
                className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-line-focus"
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
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-content transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-danger/25 bg-surface p-6">
        <h2 className="mb-1 text-base font-semibold text-danger">Danger zone</h2>
        <p className="mb-4 text-sm text-content-secondary">
          Permanently delete this workspace and all its data, including projects, tasks, and members. This action cannot be undone.
        </p>
        {!isOwner && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-warning">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Only the organization owner can delete this workspace.
          </p>
        )}
        <button
          type="button"
          onClick={openDeleteModal}
          disabled={!orgId || !isOwner}
          className="inline-flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition-colors hover:border-red-400 hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </span>
              <div>
                <h3 id="delete-modal-title" className="text-base font-semibold text-content">
                  Delete &ldquo;{orgName}&rdquo;?
                </h3>
                <p className="mt-1 text-sm text-content-tertiary">
                  This will permanently delete the workspace and all associated data. There is no way to recover it.
                </p>
              </div>
            </div>

            <label htmlFor="delete-confirm-input" className="mb-1.5 block text-sm font-medium text-content-secondary">
              Type <span className="font-semibold text-content">{orgName}</span> to confirm
            </label>
            <input
              id="delete-confirm-input"
              ref={deleteInputRef}
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={orgName}
              disabled={isDeleting}
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-danger/40 disabled:opacity-60"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText !== orgName || isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
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
