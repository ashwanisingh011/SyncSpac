'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useTaskBridgeStore } from '@/store/useTaskBridgeStore';
import { useOrganization } from '@/context/useOrganization';
import { Project } from '@/types/projects';
import { Task } from '@/types/tasks';
import {
  Loader2,
  FolderOpen,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  User,
  Plus,
  ArrowRight,
  Shield,
  FileText,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import CreateTaskModal from '@/components/task/CreateTaskModal';
import AddProjectMemberModal from '@/components/project/AddProjectMemberModal';
import {
  getCompletedTaskCount,
  getTaskStatusCounts,
  loadProjectStatusOrder,
  PROJECT_STATUS_CHANGED_EVENT,
} from '@/lib/taskStatus';
import { usePermission } from '@/hooks/usePermission';
import { getProjectMembers } from '@/api/projects';


interface ProjectPageProps {
  params: Promise<{
    projectKey: string;
  }>;
}

export default function ProjectOverviewPage({ params }: ProjectPageProps) {
  const unwrappedParams = use(params);
  const projectKey = unwrappedParams.projectKey;

  const { currentOrg } = useOrganization();
  const { hasPermission } = usePermission();
  const canCreateTask = hasPermission('create_task');
  const canManageMembers = hasPermission('manage_project_members');
  const {
    projects,
    tasks,
    fetchProjects,
    fetchProjectTasks,
    loading: storeLoading
  } = useTaskBridgeStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [projectMemberIds, setProjectMemberIds] = useState<string[]>([]);
  const [statusVersion, setStatusVersion] = useState(0);


  // 1. Resolve project by key
  useEffect(() => {
    const resolveProject = async () => {
      setLoading(true);
      if (projects.length === 0) {
        try {
          await fetchProjects(false);
        } catch (err) {
          console.error('Failed to pre-fetch projects:', err);
        }
      }
      setLoading(false);
    };

    if (currentOrg) {
      resolveProject();
    }
  }, [currentOrg, projects.length, fetchProjects]);

  // 2. Find specific project, load its tasks, and load member IDs
  useEffect(() => {
    const found = projects.find((p) => p.key === projectKey);
    if (found) {
      setProject(found);
      fetchProjectTasks(found._id).catch((err) =>
        console.error('Failed to fetch tasks for overview:', err)
      );
      // Load project member IDs so the add-member modal can exclude them
      getProjectMembers(found._id)
        .then((members) => setProjectMemberIds(members.map((m) => m.userId)))
        .catch(() => setProjectMemberIds([]));
    }
  }, [projectKey, projects, fetchProjectTasks]);

  useEffect(() => {
    const handleProjectStatusesChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ projectKey?: string }>;
      if (customEvent.detail?.projectKey === projectKey) {
        setStatusVersion((version) => version + 1);
      }
    };

    window.addEventListener(PROJECT_STATUS_CHANGED_EVENT, handleProjectStatusesChanged);
    return () => window.removeEventListener(PROJECT_STATUS_CHANGED_EVENT, handleProjectStatusesChanged);
  }, [projectKey]);

  const projectStatusOrder = useMemo(
    () => loadProjectStatusOrder(projectKey),
    [projectKey, statusVersion]
  );

  if (loading || (!project && storeLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 mt-2">Resolving project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Project Not Found</h3>
        <p className="text-sm text-slate-550 dark:text-slate-450 mt-1 max-w-sm">
          Could not find a project with key <strong className="text-slate-700 dark:text-slate-350">{projectKey}</strong> in this organization.
        </p>
        <Link
          href="/projects"
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  // Calculate task status distribution
  const totalTasks = tasks.length;
  const statusOverview = getTaskStatusCounts(tasks, projectStatusOrder);
  const doneTasks = getCompletedTaskCount(tasks);

  

  const completionRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;


  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-8 bg-white dark:bg-slate-950 min-h-screen">
      
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link href="/projects" className="hover:underline hover:text-blue-600 transition-colors">Projects</Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200">{project.name}</span>
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center rounded-lg font-black text-lg shrink-0">
              {project.key.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {project.name}
              </h1>
              <p className="text-xs text-slate-450 uppercase font-black tracking-wider mt-0.5">
                Key: {project.key}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canManageMembers && project && (
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
          )}
          {canCreateTask && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-blue-500/10 transition-colors"
            >
              <Plus className="w-4.5 h-4.5" /> Create Task
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Description & Task Distribution */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Details Panel */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">About this Project</h2>
            <p className="text-sm text-slate-650 dark:text-slate-400 leading-relaxed">
              {project.description || 'No description provided for this project.'}
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Project Type</span>
                <span className="capitalize font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {project.projectType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Visibility</span>
                <span className="capitalize font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {project.visibility}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block mb-0.5">Default Layout</span>
                <span className="capitalize font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {project.defaultLayout}
                </span>
              </div>
            </div>
          </div>

          {/* Task Metrics & Progress */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Tasks Progress</h2>
              <span className="text-xs font-bold text-slate-450">
                {doneTasks} of {totalTasks} Completed ({completionRate}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${completionRate}%` }}
                className="bg-emerald-500 rounded-full transition-all duration-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Task Status Overview</h3>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {statusOverview.map((item) => (
                  <div
                    key={item.status}
                    className={`border-l-4 rounded-lg p-3 text-center ${item.color}`}
                  >

                    <p className="text-lg font-black">{item.count}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings, Metadata, Quick actions */}
        <div className="space-y-6">
          {/* Metadata details */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-105 dark:border-slate-800">
              Project Meta
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Project Owner</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {typeof project.owner === 'object' ? project.owner.name : 'Workspace Admin'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Created On</span>
                <span className="font-semibold text-slate-650 dark:text-slate-400">
                  {new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Total Tasks Count</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                  {totalTasks}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Nav Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">
              Quick Links
            </h3>
            
            <div className="space-y-2">
              <Link
                href={`/projects/${project.key}/board`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100 hover:border-blue-200 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:text-blue-400"
              >
                Go to Kanban Board
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              
              <Link
                href={`/projects/${project.key}/backlog`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100 hover:border-blue-200 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:text-blue-400"
              >
                Go to Project Backlog
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href={`/projects/${project.key}/settings`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100 hover:border-blue-200 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:text-blue-400"
              >
                Settings & Archiving
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          preselectedProjectId={project._id}
          onSuccess={() => {
            setIsTaskModalOpen(false);
            fetchProjectTasks(project._id);
          }}
        />
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && currentOrg && (
        <AddProjectMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          orgId={currentOrg.id}
          projectId={project._id}
          projectName={project.name}
          existingMemberIds={projectMemberIds}
          onMemberAdded={() => {
            // Refresh member IDs after adding
            getProjectMembers(project._id)
              .then((members) => setProjectMemberIds(members.map((m) => m.userId)))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
