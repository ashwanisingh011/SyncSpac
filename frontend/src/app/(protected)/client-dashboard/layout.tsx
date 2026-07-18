'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { getProjects } from '@/api/projects';
import { getProjectTasks } from '@/api/tasks';
import { getProjectSprints } from '@/api/sprints';
import { getFiles, type IFile } from '@/api/files';
import type { Project } from '@/types/projects';
import type { Task } from '@/types/tasks';
import type { ISprintData } from '@/types/workspace';
import ClientSidebar from './components/ClientSidebar';
import ClientHeader from './components/ClientHeader';
import { useNotifications } from '@/context/NotificationContext';

interface ClientDashboardContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loadingProjects: boolean;
  tasks: Task[];
  loadingTasks: boolean;
  sprints: ISprintData[];
  recentFiles: IFile[];
  loadProjectData: () => Promise<void>;
}

const ClientDashboardContext = createContext<ClientDashboardContextType | undefined>(undefined);

export function useClientDashboard() {
  const context = useContext(ClientDashboardContext);
  if (!context) {
    throw new Error('useClientDashboard must be used within ClientDashboardProvider');
  }
  return context;
}

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentOrg, organizations, setCurrentOrg } = useOrganization();
  const { unreadCount } = useNotifications();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<ISprintData[]>([]);
  const [recentFiles, setRecentFiles] = useState<IFile[]>([]);

  // 1. Fetch Projects list across all workspaces for this client
  useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const fetchedProjects = await getProjects(false, true);
        if (cancelled) return;

        setProjects(fetchedProjects);
        if (fetchedProjects.length > 0) {
          let savedProjId = null;
          try {
            savedProjId = localStorage.getItem('client_selected_project_id');
          } catch (e) {
            console.error('Failed to access localStorage:', e);
          }
          const match = fetchedProjects.find((p) => p._id === savedProjId);
          const initialProject = match || fetchedProjects[0];
          setSelectedProject(initialProject);

          // Sync organization context with initial project organization
          const targetOrg = organizations.find((o) => o.id === initialProject.organization);
          if (targetOrg && currentOrg?.id !== targetOrg.id) {
            setCurrentOrg(targetOrg);
          }
        } else {
          setSelectedProject(null);
        }
      } catch (err) {
        console.error('Failed to load project details for client:', err);
      } finally {
        if (!cancelled) {
          setLoadingProjects(false);
        }
      }
    };

    if (organizations.length > 0) {
      loadProjects();
    }

    return () => {
      cancelled = true;
    };
  }, [organizations]);

  const handleProjectChange = (proj: Project | null) => {
    setSelectedProject(proj);
    if (proj) {
      localStorage.setItem('client_selected_project_id', proj._id);
      // Sync active organization context
      const targetOrg = organizations.find((o) => o.id === proj.organization);
      if (targetOrg && currentOrg?.id !== targetOrg.id) {
        setCurrentOrg(targetOrg);
      }
    } else {
      localStorage.removeItem('client_selected_project_id');
    }
  };

  // 2. Fetch Project details (tasks, sprints, files) when selected project changes
  const loadProjectData = async () => {
    if (!selectedProject) {
      setTasks([]);
      setSprints([]);
      setRecentFiles([]);
      return;
    }
    setLoadingTasks(true);
    try {
      const [fetchedTasks, fetchedSprints, fetchedFiles] = await Promise.all([
        getProjectTasks(selectedProject._id).catch(() => []),
        getProjectSprints(selectedProject._id).catch(() => []),
        getFiles(selectedProject._id, 'root').catch(() => ({ success: false, data: [] })),
      ]);

      setTasks(fetchedTasks as Task[]);
      setSprints(fetchedSprints);
      if (fetchedFiles?.success) {
        const filesOnly = fetchedFiles.data
          .filter((f) => !f.isFolder)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        setRecentFiles(filesOnly);
      } else {
        setRecentFiles([]);
      }
    } catch (err) {
      console.error('Failed to fetch active project metrics:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [selectedProject]);

  const displayName = currentOrg?.name ?? user?.name ?? 'Client';

  return (
    <ClientDashboardContext.Provider
      value={{
        projects,
        selectedProject,
        setSelectedProject: handleProjectChange,
        loadingProjects,
        tasks,
        loadingTasks,
        sprints,
        recentFiles,
        loadProjectData,
      }}
    >
      <div className="flex h-[calc(100vh-0px)] w-full overflow-hidden bg-slate-50">
        <ClientSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ClientHeader
            displayName={displayName}
            roleLabel={currentOrg?.myRole ?? 'client'}
            unreadCount={unreadCount}
            onMenuClick={() => setSidebarOpen(true)}
            projects={projects}
            selectedProject={selectedProject}
            onProjectChange={handleProjectChange}
          />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-screen-2xl px-4 py-5 lg:px-5">
              {loadingProjects ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </div>
    </ClientDashboardContext.Provider>
  );
}
