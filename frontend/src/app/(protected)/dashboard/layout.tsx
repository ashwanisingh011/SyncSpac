'use client';

/**
 * (protected)/dashboard/layout.tsx
 *
 * Shared shell for all /dashboard/* routes when the user is an org-owner.
 * Provides:
 *  - OrgSidebar (persistent, navigation driven by URL)
 *  - OrgHeader (search, date filter, workspace switcher)
 *  - OrgDashboardProvider (shared data context)
 *  - Global modals: CreateTask, CreateProject, TaskDetailsDrawer
 */

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import OrgSidebar from '@/components/org-dashboard/OrgSidebar';
import OrgHeader from '@/components/org-dashboard/OrgHeader';
import { OrgDashboardProvider, useOrgDashboard } from '@/context/orgDashboardContext';

import CreateTaskModal from '@/components/task/CreateTaskModal';
import ProjectFormModal from '@/components/project/ProjectFormModal';
import TaskDetailsDrawer from '@/components/task/TaskDetailsDrawer';
import { Loader2 } from 'lucide-react';

// ─── Inner shell (needs context) ─────────────────────────────────────────────

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    projects,
    allTasks,
    members,
    sprints,
    loading,
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
  } = useOrgDashboard();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle click selects from the autocomplete search bar in Header
  const handleSearchSelect = (type: 'project' | 'task' | 'user', item: any) => {
    if (type === 'project') {
      router.push(`/dashboard/projects/${item.key}`);
    } else if (type === 'user') {
      router.push('/dashboard/members');
    } else if (type === 'task') {
      setSelectedTask(item);
      setIsTaskDrawerOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 dark:bg-slate-950 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm text-slate-500">Loading workspace dashboard…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-slate-50 font-sans dark:bg-slate-950">
      {/* Sidebar — active state driven by usePathname inside OrgSidebar */}
      <OrgSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        membersCount={members.length}
        projectsCount={projects.length}
        tasksCount={allTasks.length}
        sprintsCount={sprints.length}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <OrgHeader
          onMenuClick={() => setSidebarOpen(true)}
          onSearchSelect={handleSearchSelect}
          daysFilter={daysFilter}
          setDaysFilter={setDaysFilter}
          onProfileClick={() => router.push('/dashboard/profile')}
          onSettingsClick={() => router.push('/dashboard/user-settings')}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-screen-2xl px-4 py-5 space-y-5 lg:px-5">
            {children}
          </div>
        </main>
      </div>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={async () => {
            setIsTaskModalOpen(false);
            loadDashboardData();
          }}
        />
      )}

      {/* Project Creation Modal */}
      {isProjectModalOpen && (
        <ProjectFormModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            loadDashboardData();
          }}
        />
      )}

      {/* Search Task Details Drawer */}
      {isTaskDrawerOpen && selectedTask && (
        <TaskDetailsDrawer
          isOpen={isTaskDrawerOpen}
          onClose={() => {
            setIsTaskDrawerOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onSuccess={loadDashboardData}
        />
      )}
    </div>
  );
}

// ─── Layout export ────────────────────────────────────────────────────────────

import { useOrganization } from '@/context/useOrganization';
import { useAuth } from '@/context/useAuth';
import { isClientUser } from '@/lib/clientAccess';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isOrgAdmin = currentOrg?.myRole === 'owner' || currentOrg?.myRole === 'admin' || currentOrg?.myRole === 'org_admin';
  const isClient = isClientUser(user, currentOrg);

  useEffect(() => {
    if (!isOrgAdmin && !isClient && pathname !== '/dashboard') {
      router.replace('/dashboard');
    }
  }, [isOrgAdmin, isClient, pathname, router]);

  if (!isOrgAdmin) {
    return pathname === '/dashboard' || isClient ? <>{children || <Outlet />}</> : null;
  }

  return (
    <OrgDashboardProvider>
      <DashboardShell>{children || <Outlet />}</DashboardShell>
    </OrgDashboardProvider>
  );
}