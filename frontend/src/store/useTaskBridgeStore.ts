import { create } from 'zustand';
import { Project, ProjectFormData } from '@/types/projects';
import { Task, TaskFormData } from '@/types/tasks';
import { WorkspaceMember } from '@/types/workspace';
import * as projectApi from '@/api/projects';
import * as taskApi from '@/api/tasks';
import { getWorkspaceMembers } from '@/api/workspace';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

interface TaskBridgeFilters {
  searchQuery: string;
  priority: string;
  assigneeId: string;
  status: string;
}

interface TaskBridgeState {
  projects: Project[];
  tasks: Task[];
  members: WorkspaceMember[];
  activeProject: Project | null;
  loading: boolean;
  error: string | null;
  filters: TaskBridgeFilters;
  
  // Actions
  fetchProjects: (archived?: boolean) => Promise<void>;
  fetchProjectTasks: (projectId: string) => Promise<void>;
  fetchWorkspaceMembers: (orgId: string) => Promise<void>;
  createProject: (payload: ProjectFormData) => Promise<Project>;
  updateProject: (projectId: string, payload: Partial<ProjectFormData> & { status?: string }) => Promise<Project>;
  archiveProject: (projectId: string) => Promise<void>;
  createTask: (payload: TaskFormData) => Promise<Task>;
  updateTask: (taskId: string, payload: Partial<TaskFormData> & { status?: string }) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  setActiveProject: (project: Project | null) => void;
  setFilters: (filters: Partial<TaskBridgeFilters>) => void;
  resetFilters: () => void;
}

export const useTaskBridgeStore = create<TaskBridgeState>((set, get) => ({
  projects: [],
  tasks: [],
  members: [],
  activeProject: null,
  loading: false,
  error: null,
  filters: {
    searchQuery: '',
    priority: 'all',
    assigneeId: 'all',
    status: 'all',
  },

  setActiveProject: (project) => set({ activeProject: project }),

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  resetFilters: () => set({
    filters: {
      searchQuery: '',
      priority: 'all',
      assigneeId: 'all',
      status: 'all',
    }
  }),

  fetchProjects: async (archived = false) => {
    set({ loading: true, error: null });
    try {
      const projects = await projectApi.getProjects(archived);
      set({ projects, loading: false });
    } catch (err: any) {
      set({ error: getFriendlyApiErrorMessage(err, 'We could not load projects. Please try again.'), loading: false });
    }
  },

  fetchProjectTasks: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskApi.getProjectTasks(projectId);
      set({ tasks, loading: false });
    } catch (err: any) {
      set({ error: getFriendlyApiErrorMessage(err, 'We could not load tasks. Please try again.'), loading: false });
    }
  },

  fetchWorkspaceMembers: async (orgId: string) => {
    try {
      const members = await getWorkspaceMembers(orgId);
      set({ members });
    } catch (err: any) {
      console.error('Failed to fetch workspace members:', err);
    }
  },

  createProject: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newProject = await projectApi.createProject(payload);
      set((state) => ({
        projects: [newProject, ...state.projects],
        loading: false
      }));
      return newProject;
    } catch (err: any) {
      set({ error: getFriendlyApiErrorMessage(err, 'We could not create that project. Please try again.'), loading: false });
      throw err;
    }
  },

  updateProject: async (projectId, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await projectApi.updateProject(projectId, payload);
      set((state) => ({
        projects: state.projects.map((p) => (p._id === projectId ? updated : p)),
        activeProject: state.activeProject?._id === projectId ? updated : state.activeProject,
        loading: false
      }));
      return updated;
    } catch (err: any) {
      set({ error: getFriendlyApiErrorMessage(err, 'We could not update that project. Please try again.'), loading: false });
      throw err;
    }
  },

  archiveProject: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await projectApi.archiveProject(projectId);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== projectId),
        activeProject: state.activeProject?._id === projectId ? null : state.activeProject,
        loading: false
      }));
    } catch (err: any) {
      set({ error: getFriendlyApiErrorMessage(err, 'We could not archive that project. Please try again.'), loading: false });
      throw err;
    }
  },

  createTask: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newTask = await taskApi.createTask(payload);
      set((state) => ({
        tasks: [...state.tasks, newTask],
        loading: false
      }));
      // Increment task count in active project locally
      set((state) => {
        if (state.activeProject && state.activeProject._id === payload.projectId) {
          return {
            activeProject: {
              ...state.activeProject,
              taskCount: state.activeProject.taskCount + 1
            },
            projects: state.projects.map((p) =>
              p._id === payload.projectId ? { ...p, taskCount: p.taskCount + 1 } : p
            )
          };
        }
        return {};
      });
      return newTask;
    } catch (err: any) {
      set({ error: getFriendlyApiErrorMessage(err, 'We could not create that task. Please try again.'), loading: false });
      throw err;
    }
  },

  updateTask: async (taskId, payload) => {
    // Optimistic UI updates
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t._id === taskId) {
          // Map backend status lowercase format or partials
          return { ...t, ...payload } as Task;
        }
        return t;
      })
    }));

    try {
      const updated = await taskApi.updateTask(taskId, payload);
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === taskId ? updated : t))
      }));
      return updated;
    } catch (err: any) {
      // Revert if call fails
      set({ tasks: previousTasks, error: getFriendlyApiErrorMessage(err, 'We could not update that task. Please try again.') });
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    const taskToDelete = get().tasks.find((t) => t._id === taskId);
    if (!taskToDelete) return;
    
    set({ loading: true, error: null });
    try {
      await taskApi.deleteTask(taskId);
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== taskId),
        loading: false
      }));
      // Decrement task count in active project
      set((state) => {
        const pId = typeof taskToDelete.project === 'object' ? taskToDelete.project._id : taskToDelete.project;
        if (state.activeProject && state.activeProject._id === pId) {
          return {
            activeProject: {
              ...state.activeProject,
              taskCount: Math.max(0, state.activeProject.taskCount - 1)
            },
            projects: state.projects.map((p) =>
              p._id === pId ? { ...p, taskCount: Math.max(0, p.taskCount - 1) } : p
            )
          };
        }
        return {};
      });
    } catch (err: any) {
      set({ error: getFriendlyApiErrorMessage(err, 'We could not delete that task. Please try again.'), loading: false });
      throw err;
    }
  }
}));
