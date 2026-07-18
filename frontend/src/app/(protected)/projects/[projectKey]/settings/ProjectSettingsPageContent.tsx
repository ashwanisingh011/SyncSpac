'use client';

import { use, useEffect, useState } from 'react';
import { useTaskBridgeStore } from '@/store/useTaskBridgeStore';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import { Project, ProjectType, ProjectVisibility, ProjectLayoutType } from '@/types/projects';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  FolderOpen,
  Settings,
  Archive,
  AlertTriangle,
  Save,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import { isAccessRestrictedError } from '@/lib/accessErrors';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

interface ProjectSettingsPageProps {
  params: Promise<{
    projectKey: string;
  }>;
}

export default function ProjectSettingsPageContent({ projectKey }: { projectKey: string }) {

  const router = useRouter();
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { hasPermission } = usePermission();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const {
    projects,
    fetchProjects,
    updateProject,
    archiveProject,
    loading: storeLoading,
  } = useTaskBridgeStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    projectType: ProjectType;
    visibility: ProjectVisibility;
    defaultLayout: ProjectLayoutType;
  }>({
    name: '',
    description: '',
    projectType: 'software',
    visibility: 'private',
    defaultLayout: 'kanban',
  });

  // Resolve project
  useEffect(() => {
    const resolveProject = async () => {
      setLoading(true);
      if (projects.length === 0) {
        try {
          await fetchProjects(false);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    };

    if (currentOrg) {
      resolveProject();
    }
  }, [currentOrg, projects.length, fetchProjects]);

  // Load project form values
  useEffect(() => {
    const found = projects.find((p) => p.key === projectKey);
    if (found) {
      setProject(found);
      setForm({
        name: found.name,
        description: found.description || '',
        projectType: found.projectType,
        visibility: found.visibility,
        defaultLayout: found.defaultLayout,
      });
    }
  }, [projectKey, projects]);

  if (loading || (!project && storeLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 mt-2">Loading settings...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <FolderOpen className="w-12 h-12 text-slate-350 dark:text-slate-700 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Project Not Found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Could not find project settings for key <strong className="text-slate-700 dark:text-slate-355">{projectKey}</strong>.
        </p>
      </div>
    );
  }

  const hasAccess = hasPermission('edit_project');
  const canDeleteProject = hasPermission('delete_project');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess) {
      setShowAccessRestricted(true);
      return;
    }

    if (!form.name.trim()) {
      setErrors({ name: 'Project name is required' });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await updateProject(project._id, form);
      showToast('Project settings updated successfully!', 'success');
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setErrors({});
        setShowAccessRestricted(true);
        return;
      }

      const msg = getFriendlyApiErrorMessage(err, 'We could not update the project settings. Please try again.');
      setErrors({ server: msg });
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!canDeleteProject) {
      setShowAccessRestricted(true);
      return;
    }

    const isConfirmed = await confirm({
      title: 'Archive Project',
      message: 'Are you sure you want to archive this project? This will hide it from active dashboards.',
      confirmText: 'Archive',
      variant: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await archiveProject(project._id);
      showToast('Project archived successfully.', 'success');
      router.push('/projects');
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }

      const msg = getFriendlyApiErrorMessage(err, 'We could not archive this project. Please try again.');
      showToast(msg, 'error');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6 bg-white dark:bg-slate-950 min-h-screen">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      
      {/* Back to Project */}
      <div className="flex items-center gap-2">
        <Link
          href={`/projects/${projectKey}`}
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to overview
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-500" /> Project Settings
        </h1>
        <p className="text-xs text-slate-450 uppercase font-black tracking-wider mt-1">
          {project.name} ({project.key})
        </p>
      </div>

      {/* Permission warning banner */}
      {!hasAccess && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Read-Only Mode Enabled</p>
            <p className="mt-0.5 opacity-90">
              Only system administrators, organization owners, or the project lead ({typeof project.owner === 'object' ? project.owner.name : 'Owner'}) can modify settings or archive this project.
            </p>
          </div>
        </div>
      )}

      {/* Form Settings Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {errors.server && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-150 rounded-lg text-xs text-red-600 dark:text-red-400">
              {errors.server}
            </div>
          )}

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={!hasAccess || saving}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-50"
                placeholder="Name"
                required
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                disabled={!hasAccess || saving}
                className="w-full min-h-25 p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-50"
                placeholder="Description"
              />
            </div>

            {/* Layout & Type Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Project Type
                </label>
                <select
                  value={form.projectType}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectType: e.target.value as any }))}
                  disabled={!hasAccess || saving}
                  className="w-full h-10 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none disabled:opacity-50"
                >
                  <option value="software">Software</option>
                  <option value="marketing">Marketing</option>
                  <option value="hr">HR</option>
                  <option value="client">Client Project</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Default Layout
                </label>
                <select
                  value={form.defaultLayout}
                  onChange={(e) => setForm((prev) => ({ ...prev, defaultLayout: e.target.value as any }))}
                  disabled={!hasAccess || saving}
                  className="w-full h-10 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none disabled:opacity-50"
                >
                  <option value="kanban">Kanban Board</option>
                  <option value="list">List View</option>
                  <option value="calendar">Calendar</option>
                  <option value="timeline">Timeline</option>
                </select>
              </div>
            </div>

            {/* Visibility Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Visibility
              </label>
              <select
                value={form.visibility}
                onChange={(e) => setForm((prev) => ({ ...prev, visibility: e.target.value as any }))}
                disabled={!hasAccess || saving}
                className="w-full h-10 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none disabled:opacity-50"
              >
                <option value="private">Private (Invite Only)</option>
                <option value="public">Public (Workspace Visible)</option>
              </select>
            </div>
          </div>

          {/* Submit Action */}
          {hasAccess && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-blue-500/10 transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Project Changes
            </button>
          )}
        </form>

        {/* Right side: Danger Zone */}
        {canDeleteProject && (
        <div className="space-y-6">
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 p-5 space-y-4 bg-red-50/10">
            <h3 className="text-sm font-bold text-red-650 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Archiving a project hides it from all active boards, listings, and user dashboards. It can only be restored by an organization administrator.
            </p>

            <button
              onClick={handleArchive}
              disabled={!canDeleteProject || saving}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-red-650 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-md shadow-red-500/5"
            >
              <Archive className="w-3.5 h-3.5" /> Archive Project
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
