'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { useRouter } from 'next/navigation';
import { useTaskBridgeStore } from '@/store/useTaskBridgeStore';
import { useOrgDashboard } from '@/context/orgDashboardContext';
import { Task } from '@/types/tasks';
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Loader2,
  Shield,
  Activity,
  Calendar,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePermission } from '@/hooks/usePermission';
import CreateTaskModal from '@/components/task/CreateTaskModal';
import ProjectFormModal from '@/components/project/ProjectFormModal';
import {
  getCompletedTaskCount,
  getTaskStatusCounts,
  isCompletedTaskStatus,
  loadProjectStatusOrder,
  normalizeTaskStatusOrder,
  PROJECT_STATUS_CHANGED_EVENT,
} from '@/lib/taskStatus';

// Org-owner dashboard home view widgets
import OrgWelcomeBanner from '@/components/org-dashboard/OrgWelcomeBanner';
import OrgStatCards from '@/components/org-dashboard/OrgStatCards';
import ProjectProgressChart from '@/components/org-dashboard/ProjectProgressChart';
import TaskAnalyticsChart from '@/components/org-dashboard/TaskAnalyticsChart';
import RecentProjects from '@/components/org-dashboard/RecentProjects';
import TeamActivityFeed from '@/components/org-dashboard/TeamActivityFeed';
import TeamPerformance from '@/components/org-dashboard/TeamPerformance';
import DeadlinesWidget from '@/components/org-dashboard/DeadlinesWidget';
import WorkspaceSummary from '@/components/org-dashboard/WorkspaceSummary';
import OrgQuickActions from '@/components/org-dashboard/OrgQuickActions';
import BillingWidget from '@/components/org-dashboard/BillingWidget';

const ASSIGNED_TASKS_PER_PAGE = 6;

const getAssigneeId = (task: Task): string | null => {
  if (!task.assignedTo) return null;
  if (typeof task.assignedTo === 'string') return task.assignedTo;

  const assignee = task.assignedTo as {
    _id?: string;
    id?: string;
    userId?: string;
  };

  return assignee._id ?? assignee.id ?? assignee.userId ?? null;
};

// ─── Org-owner home view (uses shared context from layout) ───────────────────

function OrgDashboardHome() {
  const router = useRouter();
  const {
    filteredTasks,
    filteredProjects,
    allTasks,
    projects,
    members,
    sprints,
    setIsProjectModalOpen,
    setIsTaskModalOpen,
  } = useOrgDashboard();

  return (
    <>
      {/* Welcome */}
      <OrgWelcomeBanner
        allTasks={filteredTasks}
        sprints={sprints}
        onViewChange={(view) => {
          const routeMap: Record<string, string> = {
            tasks: '/dashboard/all-tasks',
            analytics: '/dashboard/analytics',
            projects: '/dashboard/projects',
            teams: '/dashboard/teams',
            members: '/dashboard/members',
            'ws-settings': '/dashboard/workspace-settings',
            billing: '/dashboard/billing',
          };
          const href = routeMap[view];
          if (href) router.push(href);
        }}
      />

      {/* Stat cards */}
      <OrgStatCards
        projectsCount={filteredProjects.length}
        tasksCount={filteredTasks.length}
        membersCount={members.length}
        completedCount={filteredTasks.filter((t) => t.status === 'done' || t.status === 'completed').length}
        activeSprintsCount={sprints.filter((s) => s.status === 'active').length}
        pendingCount={filteredTasks.filter((t) => t.status !== 'done' && t.status !== 'completed').length}
        overdueCount={filteredTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done' && t.status !== 'completed').length}
      />

      {/* Charts row — Task Analytics (wide) + Project Status (narrow) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TaskAnalyticsChart allTasks={filteredTasks} sprints={sprints} />
        </div>
        <ProjectProgressChart projects={filteredProjects} />
      </div>

      {/* Recent Projects table */}
      <RecentProjects
        projects={filteredProjects}
        allTasks={filteredTasks}
        onProjectSelect={(key, _id) => router.push(`/dashboard/projects/${key}`)}
        onViewAllProjects={() => router.push('/dashboard/projects')}
      />

      {/* Three-col row: Activity | Performance | Deadlines */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <TeamActivityFeed allTasks={filteredTasks} />
        <TeamPerformance allTasks={filteredTasks} members={members} />
        <DeadlinesWidget allTasks={filteredTasks} />
      </div>

      {/* Bottom row: Workspace Summary | Quick Actions | Billing */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <WorkspaceSummary
          projects={filteredProjects}
          allTasks={filteredTasks}
          members={members}
          onManageSettings={() => router.push('/dashboard/workspace-settings')}
        />
        <OrgQuickActions
          onCreateProject={() => setIsProjectModalOpen(true)}
          onCreateTask={() => setIsTaskModalOpen(true)}
          onViewChange={(view) => {
            const routeMap: Record<string, string> = {
              tasks: '/dashboard/all-tasks',
              analytics: '/dashboard/analytics',
              projects: '/dashboard/projects',
              teams: '/dashboard/teams',
              members: '/dashboard/members',
              'ws-settings': '/dashboard/workspace-settings',
              billing: '/dashboard/billing',
              'project-files': '/dashboard/project-files',
            };
            const href = routeMap[view];
            if (href) router.push(href);
          }}
        />
        <BillingWidget
          membersCount={members.length}
          onManageBilling={() => router.push('/dashboard/billing')}
        />
      </div>
    </>
  );
}

// ─── Route entry point ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { currentOrg } = useOrganization();
  const isOrgAdmin = currentOrg?.myRole === 'owner' || currentOrg?.myRole === 'admin' || currentOrg?.myRole === 'org_admin';

  if (isOrgAdmin) {
    return <OrgDashboardHome />;
  }

  return <UserDashboard />;
}

function UserDashboard() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  const { hasPermission } = usePermission();
  const {
    projects,
    tasks,
    fetchProjects,
    fetchProjectTasks,
    updateTask,
    loading: storeLoading
  } = useTaskBridgeStore();

  const [loadingTasks, setLoadingTasks] = useState(true);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedTasksPage, setAssignedTasksPage] = useState(1);
  const [statusVersion, setStatusVersion] = useState(0);
  
  // Fetch projects and all their tasks
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoadingTasks(true);
      try {
        await fetchProjects(false);
      } catch (err) {
        console.error('Error fetching dashboard projects:', err);
      }
    };
    if (currentOrg) {
      loadDashboardData();
    }
  }, [currentOrg, fetchProjects]);

  // Load all tasks for each fetched project
  useEffect(() => {
    const loadAllProjectTasks = async () => {
      if (projects.length === 0) {
        setAllTasks([]);
        setLoadingTasks(false);
        return;
      }

      try {
        const taskPromises = projects.map(async (project) => {
          try {
            // Import and call taskApi.getProjectTasks directly to populate local list
            const { getProjectTasks } = await import('@/api/tasks');
            return await getProjectTasks(project._id);
          } catch (e) {
            console.error(`Failed to fetch tasks for project ${project.name}:`, e);
            return [];
          }
        });

        const results = await Promise.all(taskPromises);
        const flattenedTasks = results.flat();
        setAllTasks(flattenedTasks);
      } catch (err) {
        console.error('Error fetching dashboard tasks:', err);
      } finally {
        setLoadingTasks(false);
      }
    };

    if (projects.length > 0) {
      loadAllProjectTasks();
    } else {
      setLoadingTasks(false);
    }
  }, [projects]);

  useEffect(() => {
    const handleProjectStatusesChanged = () => {
      setStatusVersion((version) => version + 1);
    };

    window.addEventListener(PROJECT_STATUS_CHANGED_EVENT, handleProjectStatusesChanged);
    return () => window.removeEventListener(PROJECT_STATUS_CHANGED_EVENT, handleProjectStatusesChanged);
  }, []);

  // Calculate statistics
  const totalProjectsCount = projects.length;
  const totalTasksCount = allTasks.length;
  const dashboardStatusOrder = useMemo(
    () => normalizeTaskStatusOrder(projects.flatMap((project) => loadProjectStatusOrder(project.key))),
    [projects, statusVersion]
  );
  const statusOverview = getTaskStatusCounts(allTasks, dashboardStatusOrder);
  const doneTasksCount = getCompletedTaskCount(allTasks);

  const currentUserIds = useMemo(
    () =>
      [user?.id, user?._id, typeof user?.userId === 'string' ? user.userId : undefined]
        .filter((id): id is string => Boolean(id)),
    [user]
  );

  // Filter tasks assigned to OR created by the logged-in user
  const myTasks = useMemo(() => {
    const userIds = new Set(currentUserIds);
    if (userIds.size === 0) return [];

    return allTasks.filter((task) => {
      const assigneeId = getAssigneeId(task);
      const creatorId = task.createdBy
        ? typeof task.createdBy === 'object'
          ? (task.createdBy as { _id?: string; id?: string })._id ?? (task.createdBy as { _id?: string; id?: string }).id ?? null
          : task.createdBy
        : null;
      return (assigneeId ? userIds.has(assigneeId) : false) ||
             (creatorId ? userIds.has(creatorId) : false);
    });
  }, [allTasks, currentUserIds]);

  const myFilteredTasks = useMemo(
    () =>
      myTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.taskKey.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [myTasks, searchQuery]
  );

  const assignedTasksTotalPages = Math.max(1, Math.ceil(myFilteredTasks.length / ASSIGNED_TASKS_PER_PAGE));
  const assignedTasksCurrentPage = Math.min(assignedTasksPage, assignedTasksTotalPages);
  const paginatedAssignedTasks = myFilteredTasks.slice(
    (assignedTasksCurrentPage - 1) * ASSIGNED_TASKS_PER_PAGE,
    assignedTasksCurrentPage * ASSIGNED_TASKS_PER_PAGE
  );

  useEffect(() => {
    setAssignedTasksPage(1);
  }, [searchQuery, myTasks.length]);

  useEffect(() => {
    if (assignedTasksPage > assignedTasksTotalPages) {
      setAssignedTasksPage(assignedTasksTotalPages);
    }
  }, [assignedTasksPage, assignedTasksTotalPages]);

  // Deadlines (upcoming tasks sorted by due date)
  const upcomingTasks = allTasks
    .filter((t) => t.dueDate && !isCompletedTaskStatus(t.status))
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  // Productivity overview: mock data based on actual done tasks or project counts
  const completionRate = totalTasksCount ? Math.round((doneTasksCount / totalTasksCount) * 100) : 0;

  const canCreateProject = hasPermission('create_project');
  const canCreateTask = hasPermission('create_task');

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Shield className="w-12 h-12 text-content-tertiary mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-content">No Organization Active</h3>
        <p className="text-sm text-content-tertiary max-w-sm mt-2">
          Please select or create an organization first to view your dashboard.
        </p>
        <Link
          href="/onboarding"
          className="mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-content rounded-lg text-sm font-medium transition-colors"
        >
          Select Workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Zap className="w-3.5 h-3.5" /> Workspace overview
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-content mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-content-tertiary text-sm mt-0.5">
            Here's what's happening in <span className="font-semibold text-content-secondary">{currentOrg.name}</span>.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          {canCreateProject && (
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-content-secondary hover:bg-surface-hover transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          )}
          {canCreateTask && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-content hover:bg-primary-hover transition-colors shadow-md shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" /> Create Task
            </button>
          )}
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: totalProjectsCount, icon: FolderOpen, color: 'border-l-indigo-500 text-indigo-600 bg-indigo-50/50' },
          { label: 'Total Tasks', value: totalTasksCount, icon: Clock, color: 'border-l-amber-500 text-warning bg-amber-50/50' },
          { label: 'Active Tasks', value: totalTasksCount - doneTasksCount, icon: Activity, color: 'border-l-blue-500 text-primary bg-blue-50/50' },
          { label: 'Tasks Completed', value: doneTasksCount, icon: CheckCircle2, color: 'border-l-emerald-500 text-success bg-emerald-50/50' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`rounded-xl border border-slate-200/80 border-l-4 bg-surface p-5 shadow-sm flex items-center justify-between ${stat.color}`}
            >
              <div>
                <p className="text-2xl font-black text-content">{stat.value}</p>
                <p className="text-xs text-content-tertiary font-medium mt-0.5">{stat.label}</p>
              </div>
              <div className="p-2 rounded-lg bg-surface shadow-sm border border-line">
                <Icon className="w-5 h-5 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Projects & Assigned Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Projects Widget */}
          <div className="rounded-xl border border-slate-200/80 bg-surface p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-content">Recent Projects</h2>
              <Link
                href="/projects"
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline flex items-center gap-0.5"
              >
                All Projects <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {storeLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-content-tertiary" />
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <FolderOpen className="w-8 h-8 text-content-tertiary mb-2" />
                <p className="text-sm text-content-tertiary">No projects created yet.</p>
                {canCreateProject && (
                  <button
                    onClick={() => setIsProjectModalOpen(true)}
                    className="text-xs text-primary hover:underline font-semibold mt-1"
                  >
                    Create your first project →
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project) => (
                  <Link
                    key={project._id}
                    href={`/projects/${project.key}/board`}
                    className="group block rounded-lg border border-line hover:border-blue-200 p-4 bg-slate-50/50 hover:bg-surface-hover hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-subtle text-primary flex items-center justify-center rounded-md font-bold text-sm">
                        {project.key.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-semibold text-sm text-content group-hover:text-blue-600 transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-[10px] text-content-tertiary uppercase font-bold tracking-wider">
                          {project.key}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-content-tertiary mt-2 line-clamp-1 h-4">
                      {project.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-content-tertiary mt-3 pt-3 border-t border-line">
                      <span>Tasks: <strong className="text-content-secondary">{project.taskCount}</strong></span>
                      <span className="capitalize px-1.5 py-0.5 rounded bg-surface-hover text-content-secondary font-medium">
                        {project.projectType}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Tasks Widget */}
          <div className="rounded-xl border border-slate-200/80 bg-surface p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-base font-bold text-content">My Tasks ({myTasks.length})</h2>
              
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search my tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs border border-line rounded-lg bg-surface-sunken focus:bg-white text-content placeholder:text-content-tertiary focus:border-line-focus outline-none transition-all"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-content-tertiary" />
              </div>
            </div>

            {loadingTasks ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-content-tertiary" />
              </div>
            ) : myTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 border border-dashed border-line rounded-lg bg-slate-50/20">
                <CheckCircle2 className="w-8 h-8 text-content-tertiary mb-2" />
                <p className="text-sm text-content-tertiary">No tasks assigned to or created by you.</p>
              </div>
            ) : myFilteredTasks.length === 0 ? (
              <div className="text-center py-10 text-xs text-content-tertiary">
                No matching tasks found.
              </div>
            ) : (
              <div>
                <div className="divide-y divide-line">
                  {paginatedAssignedTasks.map((task) => (
                    <div key={task._id} className="py-3 flex items-center justify-between gap-4 group">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-[10px] font-bold text-content-tertiary bg-surface-hover px-1.5 py-0.5 rounded shrink-0">
                          {task.taskKey}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-content truncate group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </p>
                          <p className="text-xs text-content-tertiary truncate">
                            {task.description || 'No description'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Priority Tag */}
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            task.priority === 'high'
                              ? 'bg-danger/10 text-danger'
                              : task.priority === 'medium'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-surface-sunken text-content-secondary'
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Status Dropdown */}
                        <select
                          value={task.status}
                          onChange={async (e) => {
                            try {
                              await updateTask(task._id, { status: e.target.value as any });
                              // Re-fetch to update allTasks state immediately
                              const { getProjectTasks } = await import('@/api/tasks');
                              const allResults = await Promise.all(
                                projects.map((p) => getProjectTasks(p._id).catch(() => []))
                              );
                              setAllTasks(allResults.flat());
                            } catch (err) {
                              console.error('Failed to update task status:', err);
                            }
                          }}
                          className="text-xs bg-surface-sunken hover:bg-surface-hover border border-line rounded px-1.5 py-0.5 font-medium outline-none text-content-secondary"
                        >
                          {statusOverview.map((status) => (
                            <option key={status.status} value={status.status}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {myFilteredTasks.length > ASSIGNED_TASKS_PER_PAGE && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-content-tertiary">
                      Showing {(assignedTasksCurrentPage - 1) * ASSIGNED_TASKS_PER_PAGE + 1}
                      {' '}-
                      {Math.min(assignedTasksCurrentPage * ASSIGNED_TASKS_PER_PAGE, myFilteredTasks.length)}
                      {' '}of {myFilteredTasks.length} tasks
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignedTasksPage((page) => Math.max(1, page - 1))}
                        disabled={assignedTasksCurrentPage === 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-content-tertiary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Previous assigned tasks page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-semibold text-content-secondary">
                        Page {assignedTasksCurrentPage} of {assignedTasksTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAssignedTasksPage((page) => Math.min(assignedTasksTotalPages, page + 1))}
                        disabled={assignedTasksCurrentPage === assignedTasksTotalPages}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-content-tertiary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Next assigned tasks page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Productivity SVG Chart & Deadlines */}
        <div className="space-y-6">
          {/* Productivity Chart Widget */}
          <div className="rounded-xl border border-slate-200/80 bg-surface p-5 shadow-sm">
            <h2 className="text-base font-bold text-content mb-4">Productivity</h2>
            
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                {/* SVG circular progress indicator */}
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    strokeWidth="7"
                    stroke="#E2E8F0"
                    fill="transparent"
                    className=""
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    strokeWidth="7"
                    stroke="#2563EB"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - completionRate / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-black text-content">{completionRate}%</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-content-secondary">Completion Rate</p>
                <p className="text-xs text-content-tertiary mt-1">
                  You've completed <strong className="text-content-secondary">{doneTasksCount}</strong> out of <strong className="text-content-secondary">{totalTasksCount}</strong> total tasks in this organization.
                </p>
              </div>
            </div>

            {/* Custom SVG area charting completion progress over status */}
            <div className="h-28 mt-6 relative">
              <div className="absolute inset-0 flex items-end justify-between px-2">
                {statusOverview.map((item, idx) => {
                  const pct = totalTasksCount ? (item.count / totalTasksCount) * 100 : 0;
                  const barColors = ['bg-amber-500', 'bg-primary', 'bg-violet-500', 'bg-cyan-500', 'bg-success', 'bg-rose-500', 'bg-slate-500'];

                  return (
                    <div key={item.status} className="flex flex-col items-center min-w-16 flex-1 gap-2 group">
                      <div className="w-full flex items-end justify-center h-20 bg-surface-sunken/20 rounded-md p-1">
                        <div
                          style={{ height: `${Math.max(10, pct)}%` }}
                          className={`w-8 rounded-t-sm transition-all duration-500 hover:opacity-80 flex items-center justify-center text-[10px] text-white font-bold ${barColors[idx % barColors.length]}`}
                        >
                          {item.count}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-content-tertiary truncate">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-surface p-5 shadow-sm">
            <h2 className="text-base font-bold text-content mb-4">Task Status Overview</h2>
            <div className="space-y-2">
              {statusOverview.map((item) => (
                <div key={item.status} className="flex items-center justify-between rounded-lg border border-line bg-slate-50/60 px-3 py-2 text-sm">
                  <span className="font-medium text-content-secondary">{item.label}</span>
                  <span className="font-black text-content">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="rounded-xl border border-slate-200/80 bg-surface p-5 shadow-sm">
            <h2 className="text-base font-bold text-content mb-3">Upcoming Deadlines</h2>

            {loadingTasks ? (
              <div className="flex items-center justify-center py-5">
                <Loader2 className="w-4 h-4 animate-spin text-content-tertiary" />
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <Calendar className="w-6 h-6 text-content-tertiary mb-2" />
                <p className="text-xs text-content-tertiary">No pending tasks with due dates.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const daysLeft = Math.ceil(
                    (new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
                  );
                  const isOverdue = daysLeft < 0;

                  return (
                    <div
                      key={task._id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-line bg-slate-50/50 hover:bg-surface-hover transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-content-secondary truncate">
                          {task.title}
                        </p>
                        <p className="text-[10px] text-content-tertiary">
                          Due: {new Date(task.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      <span
                        className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
                          isOverdue
                            ? 'bg-red-100 text-danger'
                            : daysLeft <= 2
                            ? 'bg-amber-100 text-warning'
                            : 'bg-primary-subtle text-primary'
                        }`}
                      >
                        {isOverdue ? 'Overdue' : `${daysLeft}d left`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={async () => {
            setIsTaskModalOpen(false);
            // Refresh local task state
            const { getProjectTasks } = await import('@/api/tasks');
            const allResults = await Promise.all(
              projects.map((p) => getProjectTasks(p._id).catch(() => []))
            );
            setAllTasks(allResults.flat());
          }}
        />
      )}

      {/* Project Creation Modal */}
      {isProjectModalOpen && (
        <ProjectFormModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
        />
      )}
    </div>
  );
}
