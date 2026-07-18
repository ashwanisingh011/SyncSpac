'use client';

/**
 * orgDashboardContext.tsx
 *
 * Shared data context for the org-owner dashboard shell.
 * Provided by (protected)/dashboard/layout.tsx so all child route
 * pages share the same data without re-fetching on navigation.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useOrganization } from '@/context/useOrganization';
import { getProjects } from '@/api/projects';
import { getProjectTasks } from '@/api/tasks';
import { getWorkspaceMembers } from '@/api/workspace';
import { getProjectSprints } from '@/api/sprints';
import type { Project } from '@/types/projects';
import type { Task } from '@/types/tasks';
import type { WorkspaceMember, ISprintData } from '@/types/workspace';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgDashboardContextValue {
  // Data
  projects: Project[];
  allTasks: Task[];
  members: WorkspaceMember[];
  sprints: ISprintData[];
  loading: boolean;

  // Filtered data
  filteredTasks: Task[];
  filteredProjects: Project[];

  // Filters
  daysFilter: string;
  setDaysFilter: (days: string) => void;

  // Data reload
  loadDashboardData: () => Promise<void>;

  // Modal states
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (open: boolean) => void;

  // Task drawer
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  isTaskDrawerOpen: boolean;
  setIsTaskDrawerOpen: (open: boolean) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OrgDashboardContext = createContext<OrgDashboardContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OrgDashboardProvider({ children }: { children: React.ReactNode }) {
  const { currentOrg } = useOrganization();

  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [sprints, setSprints] = useState<ISprintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState('30');

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Task drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);

  // ── Filtered data ────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    if (daysFilter === 'all') return allTasks;
    const daysLimit = parseInt(daysFilter, 10);
    if (isNaN(daysLimit)) return allTasks;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysLimit);
    return allTasks.filter((t) => {
      const taskDate = new Date(t.updatedAt || t.createdAt);
      return taskDate >= cutoff;
    });
  }, [allTasks, daysFilter]);

  const filteredProjects = useMemo(() => {
    if (daysFilter === 'all') return projects;
    const daysLimit = parseInt(daysFilter, 10);
    if (isNaN(daysLimit)) return projects;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysLimit);
    return projects.filter((p) => {
      const projectDate = new Date(p.updatedAt || p.createdAt);
      return projectDate >= cutoff;
    });
  }, [projects, daysFilter]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    if (!currentOrg?.id) return;
    setLoading(true);
    try {
      const [projs, mems] = await Promise.all([
        getProjects(false),
        getWorkspaceMembers(currentOrg.id),
      ]);
      setProjects(projs);
      setMembers(mems);

      const taskPromises = projs.map((project) =>
        getProjectTasks(project._id).catch((err) => {
          console.error(`Failed to fetch tasks for project ${project.name}:`, err);
          return [] as Task[];
        })
      );

      const sprintPromises = projs.map((project) =>
        getProjectSprints(project._id).catch((err) => {
          console.error(`Failed to fetch sprints for project ${project.name}:`, err);
          return [] as ISprintData[];
        })
      );

      const [taskResults, sprintResults] = await Promise.all([
        Promise.all(taskPromises),
        Promise.all(sprintPromises),
      ]);

      setAllTasks(taskResults.flat());
      setSprints(sprintResults.flat());
    } catch (err) {
      console.error('Error fetching org dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Value ─────────────────────────────────────────────────────────────────
  const value: OrgDashboardContextValue = {
    projects,
    allTasks,
    members,
    sprints,
    loading,
    filteredTasks,
    filteredProjects,
    daysFilter,
    setDaysFilter,
    loadDashboardData,
    isTaskModalOpen,
    setIsTaskModalOpen,
    isProjectModalOpen,
    setIsProjectModalOpen,
    selectedTask,
    setSelectedTask,
    isTaskDrawerOpen,
    setIsTaskDrawerOpen,
  };

  return (
    <OrgDashboardContext.Provider value={value}>
      {children}
    </OrgDashboardContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrgDashboard(): OrgDashboardContextValue {
  const ctx = useContext(OrgDashboardContext);
  if (!ctx) {
    throw new Error('useOrgDashboard must be used within OrgDashboardProvider');
  }
  return ctx;
}
