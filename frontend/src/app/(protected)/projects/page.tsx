"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  Plus,
  Search,
  LayoutGrid,
  Rows3,
  Folder,
  ChevronRight,
  CircleDot,
  PauseCircle,
  CheckCircle2,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { getProjects, createProject } from '@/api/projects';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import type { Project, ProjectStatusType } from '@/types/projects';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─── Project identity color (deterministic per key) ─────────── */

const PROJECT_HUES = [
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
  'from-indigo-500 to-violet-600',
  'from-fuchsia-500 to-purple-600',
] as const;

function projectHue(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return PROJECT_HUES[Math.abs(hash) % PROJECT_HUES.length];
}

/* ─── Status meta ────────────────────────────────────────────── */

const STATUS_META: Record<ProjectStatusType, { label: string; className: string; Icon: typeof CircleDot }> = {
  active: { label: 'Active', className: 'text-status-done', Icon: CircleDot },
  'on-hold': { label: 'On hold', className: 'text-warning', Icon: PauseCircle },
  completed: { label: 'Completed', className: 'text-content-tertiary', Icon: CheckCircle2 },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/* ─── Cards ──────────────────────────────────────────────────── */

function ProjectAvatar({ projectKey, size = 'md' }: { projectKey: string; size?: 'md' | 'sm' }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br font-bold text-white shadow-card',
        projectHue(projectKey),
        size === 'md' ? 'h-10 w-10 text-[13px]' : 'h-8 w-8 text-[11px]'
      )}
    >
      {projectKey.substring(0, 2).toUpperCase()}
    </div>
  );
}

function StatusPill({ status }: { status: ProjectStatusType }) {
  const meta = STATUS_META[status] ?? STATUS_META.active;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', meta.className)}>
      <meta.Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function ProjectGridCard({ project, isOwner, index }: { project: Project; isOwner: boolean; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04, ease: EASE }}
    >
      <Link
        href={`/projects/${project.key}/board`}
        className={cn(
          'group relative flex h-full flex-col rounded-xl border border-line bg-surface p-5',
          'shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised'
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between">
          <ProjectAvatar projectKey={project.key} />
          <div className="flex items-center gap-2">
            {project.visibility === 'private' && (
              <Lock className="h-3.5 w-3.5 text-content-tertiary" aria-label="Private project" />
            )}
            <StatusPill status={project.status} />
          </div>
        </div>

        {/* Title */}
        <div className="mt-4">
          <h3 className="font-semibold leading-snug text-content transition-colors group-hover:text-primary">
            {project.name}
          </h3>
          <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">
            {project.key}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed text-content-tertiary">
          {project.description || 'No description provided.'}
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5 text-[11.5px] text-content-tertiary">
          <span>
            {project.taskCount ?? 0} {project.taskCount === 1 ? 'task' : 'tasks'}
            <span className="mx-1.5 text-line-strong">·</span>
            {isOwner ? 'Owner' : 'Member'}
          </span>
          <span className="inline-flex items-center gap-0.5 font-medium text-content-tertiary transition-colors group-hover:text-primary">
            Open board
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function ProjectListRow({ project, isOwner, index }: { project: Project; isOwner: boolean; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 12) * 0.03, ease: EASE }}
    >
      <Link
        href={`/projects/${project.key}/board`}
        className="group flex items-center gap-4 border-b border-line px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-hover"
      >
        <ProjectAvatar projectKey={project.key} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-medium text-content transition-colors group-hover:text-primary">
              {project.name}
            </span>
            <span className="shrink-0 text-[10.5px] font-semibold uppercase tracking-wider text-content-tertiary">
              {project.key}
            </span>
            {project.visibility === 'private' && <Lock className="h-3 w-3 shrink-0 text-content-tertiary" />}
          </div>
          <p className="truncate text-[12.5px] text-content-tertiary">
            {project.description || 'No description'}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-6 text-[12px] text-content-tertiary sm:flex">
          <StatusPill status={project.status} />
          <span className="w-16 text-right tabular-nums">{project.taskCount ?? 0} tasks</span>
          <span className="w-20 text-right">{timeAgo(project.updatedAt)}</span>
          <span className="w-14 text-right">{isOwner ? 'Owner' : 'Member'}</span>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-content-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </motion.div>
  );
}

/* ─── Skeletons ──────────────────────────────────────────────── */

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="mt-4 h-4 w-3/5" />
          <Skeleton className="mt-2 h-3 w-10" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-4/5" />
          <div className="mt-4 border-t border-line pt-3.5">
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

type ViewMode = 'grid' | 'list';

export default function ProjectsDashboard(): React.JSX.Element {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { hasPermission } = usePermission();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [view, setView] = useState<ViewMode>('grid');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>('');
  const [projectKey, setProjectKey] = useState<string>('');
  const [projectDesc, setProjectDesc] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const canCreateProject = hasPermission('create_project');

  const fetchProjects = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setError('');
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err, 'We could not load projects. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    );
  }, [projects, query]);

  const handleCreateProject = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!projectName.trim() || !projectKey.trim()) {
      setModalError('Project name and key are required');
      return;
    }

    setModalError('');
    setModalLoading(true);
    try {
      await createProject({
        name: projectName.trim(),
        key: projectKey.trim().toUpperCase(),
        description: projectDesc.trim(),
      });

      // Reset form and close modal
      setProjectName('');
      setProjectKey('');
      setProjectDesc('');
      setIsModalOpen(false);

      // Refresh list
      fetchProjects();
    } catch (err: any) {
      setModalError(getFriendlyApiErrorMessage(err, 'We could not create that project. Please check the key and try again.'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setProjectName(val);
    // Auto-generate key from name if key hasn't been manually set or edited
    if (val.trim()) {
      const generatedKey = val
        .trim()
        .split(/\s+/)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      setProjectKey(generatedKey.substring(0, 5));
    } else {
      setProjectKey('');
    }
  };

  const inputClass =
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-content outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-content-tertiary/70 hover:border-line-strong focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-subtle)]';

  return (
    <div className="w-full flex-1 bg-surface-sunken/50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-content">Projects</h1>
            <p className="mt-1 text-[13px] text-content-tertiary">
              {currentOrg?.name ? `Everything ${currentOrg.name} is working on.` : 'Everything your team is working on.'}
            </p>
          </div>
          {canCreateProject && (
            <Button
              onClick={() => {
                setModalError('');
                setIsModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New project
            </Button>
          )}
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: EASE }}
          className="mt-6 flex items-center gap-3"
        >
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className={cn(inputClass, 'h-9 pl-9')}
            />
          </div>
          <span className="hidden text-[12px] tabular-nums text-content-tertiary sm:block">
            {!loading && `${filtered.length} ${filtered.length === 1 ? 'project' : 'projects'}`}
          </span>
          <div className="ml-auto flex rounded-lg border border-line bg-surface p-0.5">
            {(
              [
                { mode: 'grid' as const, Icon: LayoutGrid, label: 'Grid view' },
                { mode: 'list' as const, Icon: Rows3, label: 'List view' },
              ]
            ).map(({ mode, Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                aria-label={label}
                className={cn(
                  'relative flex h-7 w-8 items-center justify-center rounded-md transition-colors cursor-pointer',
                  view === mode ? 'text-content' : 'text-content-tertiary hover:text-content'
                )}
              >
                {view === mode && (
                  <motion.span
                    layoutId="projects-view-toggle"
                    className="absolute inset-0 rounded-md bg-surface-hover shadow-card"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <GridSkeleton />
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-col items-center rounded-xl border border-dashed border-line-strong py-20 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-subtle">
                <Folder className="h-6 w-6 text-primary" />
              </div>
              {query ? (
                <>
                  <p className="mt-4 text-[15px] font-medium text-content">No matches for &ldquo;{query}&rdquo;</p>
                  <p className="mt-1 text-[13px] text-content-tertiary">Try a different name or key.</p>
                </>
              ) : (
                <>
                  <p className="mt-4 text-[15px] font-medium text-content">No projects yet</p>
                  <p className="mt-1 max-w-xs text-[13px] text-content-tertiary">
                    Projects hold your boards, backlog, and sprints. Create the first one to get started.
                  </p>
                  {canCreateProject && (
                    <Button className="mt-5" onClick={() => setIsModalOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Create your first project
                    </Button>
                  )}
                </>
              )}
            </motion.div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project, index) => {
                const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
                const isOwner = ownerId === (user?._id || user?.id);
                return <ProjectGridCard key={project._id} project={project} isOwner={isOwner} index={index} />;
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
              {/* List header */}
              <div className="hidden items-center gap-4 border-b border-line bg-surface-sunken px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-content-tertiary sm:flex">
                <span className="w-8" />
                <span className="flex-1">Project</span>
                <span className="flex shrink-0 items-center gap-6">
                  <span className="w-[72px]">Status</span>
                  <span className="w-16 text-right">Tasks</span>
                  <span className="w-20 text-right">Updated</span>
                  <span className="w-14 text-right">Role</span>
                </span>
                <span className="w-4" />
              </div>
              {filtered.map((project, index) => {
                const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
                const isOwner = ownerId === (user?._id || user?.id);
                return <ProjectListRow key={project._id} project={project} isOwner={isOwner} index={index} />;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create project modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !modalLoading && setIsModalOpen(false)}
        title="Create project"
        description="Projects hold your boards, backlog, and sprints."
        size="md"
      >
        <form onSubmit={handleCreateProject}>
          <AnimatePresence>
            {modalError && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger/[0.06] px-3.5 py-2.5 text-[13px] text-danger">
                  <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                  {modalError}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-content-secondary">
                Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Website Redesign"
                value={projectName}
                onChange={handleNameChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] items-start gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-content-secondary">
                  Key <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WEB"
                  value={projectKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className={cn(inputClass, 'font-mono uppercase tracking-wider')}
                  maxLength={5}
                />
                <p className="mt-1.5 text-xs text-content-tertiary">
                  Prefix for task ids — e.g. {projectKey || 'WEB'}-42.
                </p>
              </div>
              {/* Live avatar preview */}
              <div className="pt-[26px]">
                <ProjectAvatar projectKey={projectKey || '··'} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-content-secondary">Description</label>
              <textarea
                placeholder="What is this project about?"
                value={projectDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProjectDesc(e.target.value)}
                rows={3}
                className={cn(inputClass, 'resize-none')}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={modalLoading}>
              Create project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
