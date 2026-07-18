"use client";

import { useEffect, useMemo, useState, use, useRef } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import KanbanColumn from '@/components/KanbanColumn';
import TaskModal from '@/components/TaskModal';
import AddProjectMemberModal from '@/components/project/AddProjectMemberModal';
import { useProjectData } from '@/context/projectDataContext';
import { reorderTasks } from '@/api/tasks';
import { getProjectMembers, removeUserFromProject, type ProjectMember } from '@/api/projects';
import { AlertTriangle, ChevronLeft, ChevronRight, Search, Loader2, X, Plus, UserMinus, Trash2 } from 'lucide-react';
import type { IProjectData, TaskStatus, WorkspaceMember } from '@/types/workspace';
import { useSocket } from '@/hooks/useSocket';
import { formatMemberRole } from '@/lib/assignableMembers';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import { isAccessRestrictedError, isAccessRestrictedMessage } from '@/lib/accessErrors';
import {
  DEFAULT_TASK_STATUS_ORDER,
  getTaskStatusCounts,
  loadProjectStatusOrder,
  normalizeTaskStatusOrder,
  saveProjectStatusOrder,
  slugifyTaskStatus,
} from '@/lib/taskStatus';
import { usePermission } from '@/hooks/usePermission';
import { useOrganization } from '@/context/useOrganization';
import { useToast } from '@/context/useToast';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

interface BoardPageProps {
  params: Promise<{ projectKey: string }>;
}

const MEMBERS_PER_PAGE = 10;

// Statuses that are always visible and cannot be removed
const DEFAULT_STATUSES: TaskStatus[] = [...DEFAULT_TASK_STATUS_ORDER];

type ProjectTeamMember = Pick<WorkspaceMember, 'userId' | 'name' | 'email' | 'avatarUrl' | 'role' | 'roleName' | 'status' | 'joinedAt'> & {
  boardRole: string;
  roleRank: number;
  assignedTaskCount: number;
};

type ProjectOwner = IProjectData['owner'] | { _id: string; name: string; email: string; avatar?: string; avatarUrl?: string };

const IMPORTANT_ROLE_RANKS: Array<{ match: string; label: string; rank: number }> = [
  { match: 'owner', label: 'Owner', rank: 0 },
  { match: 'project manager', label: 'Project Manager', rank: 1 },
  { match: 'project_manager', label: 'Project Manager', rank: 1 },
  { match: 'manager', label: 'Project Manager', rank: 2 },
  { match: 'lead', label: 'Lead', rank: 3 },
];

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
];

const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'U';
};

const getImportantRole = (member: Pick<WorkspaceMember, 'role' | 'roleName'>): { label: string; rank: number } => {
  const roleText = `${member.roleName ?? ''} ${member.role ?? ''}`.toLowerCase();
  return IMPORTANT_ROLE_RANKS.find(role => roleText.includes(role.match)) ?? {
    label: formatMemberRole(member.role, member.roleName),
    rank: 8,
  };
};

const getProjectOwnerId = (owner: ProjectOwner): string => {
  if (typeof owner === 'object' && owner !== null) {
    return owner._id;
  }

  return owner;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function BoardPageContent({ projectKey, issueUrlPrefix }: { projectKey: string; issueUrlPrefix?: string }): React.JSX.Element {

  const { project, tasks, sprints, loading, error, members, updateMultipleTasksStateInline, fetchProjectContext } = useProjectData();
  const { hasPermission } = usePermission();
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();
  const canCreateTask = hasPermission('create_task');
  const canManageProjectMembers = hasPermission('manage_project_members');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState<boolean>(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState<boolean>(false);
  const [membersPage, setMembersPage] = useState<number>(1);
  const [membersSearchQuery, setMembersSearchQuery] = useState<string>('');
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [showAccessRestricted, setShowAccessRestricted] = useState<boolean>(false);
  const [memberToRemove, setMemberToRemove] = useState<ProjectTeamMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState<boolean>(false);

  // ── Column visibility state (persisted per project) ──────────────────────
  const [visibleStatuses, setVisibleStatuses] = useState<TaskStatus[]>(() =>
    loadProjectStatusOrder(projectKey)
  );
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusError, setNewStatusError] = useState('');
  const addColumnRef = useRef<HTMLDivElement>(null);
  const addColumnMobileRef = useRef<HTMLDivElement>(null);

  // Keep columns in sync if the route changes to another project.
  useEffect(() => {
    setVisibleStatuses(loadProjectStatusOrder(projectKey));
    setNewStatusName('');
    setNewStatusError('');
  }, [projectKey]);

  // If task data already contains a custom status, keep its column visible.
  useEffect(() => {
    const taskStatuses = tasks
      .map(task => task.status)
      .filter((status): status is TaskStatus => Boolean(status) && status !== 'backlog');

    if (taskStatuses.length === 0) return;

    setVisibleStatuses(prev => {
      const next = normalizeTaskStatusOrder([...prev, ...taskStatuses]);
      if (next.length === prev.length && next.every((status, index) => status === prev[index])) {
        return prev;
      }
      saveProjectStatusOrder(projectKey, next);
      return next;
    });
  }, [projectKey, tasks]);

  // Close "add column" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const clickOutsideDesktop = !addColumnRef.current || !addColumnRef.current.contains(e.target as Node);
      const clickOutsideMobile = !addColumnMobileRef.current || !addColumnMobileRef.current.contains(e.target as Node);
      if (clickOutsideDesktop && clickOutsideMobile) {
        setIsAddColumnOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { moveTask } = useSocket();
  const activeSprint = sprints?.find(s => s.status === 'active');
  const orgId = currentOrg?.id ?? '';

  // Filter tasks that are on the board (exclude backlog) and match search query
  const filteredIssues = useMemo(() => (
    activeSprint ? tasks.filter(task =>
      task.sprintId === activeSprint._id &&
      task.status !== 'backlog' &&
      (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskKey.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : []
  ), [activeSprint, searchQuery, tasks]);

  useEffect(() => {
    if (!project?._id) {
      setProjectMembers([]);
      return;
    }

    let isMounted = true;

    getProjectMembers(project._id)
      .then((nextMembers) => {
        if (isMounted) setProjectMembers(nextMembers);
      })
      .catch((err) => {
        console.error('Failed to load project members:', err);
        if (isMounted) setProjectMembers([]);
      });

    return () => {
      isMounted = false;
    };
  }, [project?._id]);

  const fallbackProjectMembers = useMemo<ProjectTeamMember[]>(() => {
    if (!project) return [];

    const assignedTaskCounts = tasks.reduce<Map<string, number>>((counts, task) => {
      if (!task.assignedTo) return counts;
      counts.set(task.assignedTo, (counts.get(task.assignedTo) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());

    const projectOwnerId = getProjectOwnerId(project.owner as ProjectOwner);

    return members
      .filter(member => member.status === 'active')
      .map(member => {
        const importantRole = member.userId === projectOwnerId
          ? { label: 'Owner', rank: 0 }
          : getImportantRole(member);

        return {
          ...member,
          boardRole: importantRole.label,
          roleRank: importantRole.rank,
          assignedTaskCount: assignedTaskCounts.get(member.userId) ?? 0,
        };
      })
      .filter(member => member.userId === projectOwnerId || member.assignedTaskCount > 0)
      .sort((first, second) => {
        if (first.roleRank !== second.roleRank) return first.roleRank - second.roleRank;
        if (first.assignedTaskCount !== second.assignedTaskCount) {
          return second.assignedTaskCount - first.assignedTaskCount;
        }
        return first.name.localeCompare(second.name);
      });
  }, [members, project, tasks]);

  const projectTeamMembers = useMemo<ProjectTeamMember[]>(() => {
    const sourceMembers = projectMembers.length > 0 ? projectMembers : fallbackProjectMembers;

    return sourceMembers
      .map((member) => {
        const importantRole = getImportantRole(member);

        return {
          ...member,
          boardRole: formatMemberRole(member.role, member.roleName || importantRole.label),
          roleRank: importantRole.rank,
          assignedTaskCount: member.assignedTaskCount ?? 0,
        };
      })
      .sort((first, second) => {
        if (first.assignedTaskCount !== second.assignedTaskCount) {
          return second.assignedTaskCount - first.assignedTaskCount;
        }
        if (first.roleRank !== second.roleRank) return first.roleRank - second.roleRank;
        return first.name.localeCompare(second.name);
      });
  }, [fallbackProjectMembers, projectMembers]);

  const boardAvatarUsers = useMemo<ProjectTeamMember[]>(() => (
    projectTeamMembers.slice(0, 4)
  ), [projectTeamMembers]);

  // All available status columns (from project settings and tasks), kept in canonical order
  const allBoardStatusColumns = useMemo(() => {
    return getTaskStatusCounts(tasks, visibleStatuses).map((item) => ({
      id: item.status as TaskStatus,
      title: item.label,
    }));
  }, [tasks, visibleStatuses]);

  // Columns currently shown on the board, in canonical order
  const boardStatusColumns = useMemo(
    () => allBoardStatusColumns.filter(col => visibleStatuses.includes(col.id)),
    [allBoardStatusColumns, visibleStatuses]
  );

  // Statuses available to add (not yet visible, not default)
  const addableStatuses = useMemo(
    () => allBoardStatusColumns.filter(col => !visibleStatuses.includes(col.id)),
    [allBoardStatusColumns, visibleStatuses]
  );

  const handleAddColumn = (status: TaskStatus) => {
    setVisibleStatuses(prev => {
      const next = normalizeTaskStatusOrder([...prev, status]);
      saveProjectStatusOrder(projectKey, next);
      return next;
    });
    setIsAddColumnOpen(false);
  };

  const handleCreateColumn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const status = slugifyTaskStatus(newStatusName);

    if (!status) {
      setNewStatusError('Enter a column name.');
      return;
    }

    if (status === 'backlog') {
      setNewStatusError('Backlog is not a board column.');
      return;
    }

    if (visibleStatuses.includes(status)) {
      setNewStatusError('That column already exists.');
      return;
    }

    setVisibleStatuses(prev => {
      const next = normalizeTaskStatusOrder([...prev, status]);
      saveProjectStatusOrder(projectKey, next);
      return next;
    });
    setNewStatusName('');
    setNewStatusError('');
    setIsAddColumnOpen(false);
    showToast(`Added "${newStatusName.trim()}" column.`, 'success');
  };

  const handleRemoveColumn = (status: TaskStatus) => {
    if (DEFAULT_STATUSES.includes(status)) return; // guard — shouldn't happen

    const tasksInColumn = tasks.filter(task => task.status === status && task.status !== 'backlog');

    if (tasksInColumn.length > 0) {
      showToast(
        `Cannot remove this column because it contains ${tasksInColumn.length} task${tasksInColumn.length === 1 ? '' : 's'}. Move or update the task${tasksInColumn.length === 1 ? '' : 's'} first.`,
        'error'
      );
      return;
    }

    setVisibleStatuses(prev => {
      const next = normalizeTaskStatusOrder(prev.filter(s => s !== status));
      saveProjectStatusOrder(projectKey, next);
      return next;
    });
  };

  const filteredTeamMembers = useMemo(() => {
    const query = membersSearchQuery.trim().toLowerCase();
    if (!query) return projectTeamMembers;

    return projectTeamMembers.filter((member) => (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.boardRole.toLowerCase().includes(query) ||
      member.status.toLowerCase().includes(query)
    ));
  }, [membersSearchQuery, projectTeamMembers]);

  useEffect(() => {
    setMembersPage(1);
  }, [membersSearchQuery]);

  const totalMemberPages = Math.max(1, Math.ceil(filteredTeamMembers.length / MEMBERS_PER_PAGE));
  const currentMembersPage = Math.min(membersPage, totalMemberPages);
  const paginatedTeamMembers = useMemo(() => (
    filteredTeamMembers.slice(
      (currentMembersPage - 1) * MEMBERS_PER_PAGE,
      currentMembersPage * MEMBERS_PER_PAGE,
    )
  ), [currentMembersPage, filteredTeamMembers]);

  const formatJoinedDate = (joinedAt?: string): string => {
    if (!joinedAt) return 'Not available';
    const date = new Date(joinedAt);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const onDragEnd = async (result: DropResult): Promise<void> => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const draggedTask = tasks.find(t => t._id === draggableId);
    if (!draggedTask) return;

    const newStatus = destination.droppableId as TaskStatus;

    const sourceColumnTasks = tasks
      .filter(t => t.status === source.droppableId && t.status !== 'backlog')
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    const destColumnTasks = tasks
      .filter(t => t.status === destination.droppableId && t.status !== 'backlog')
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    let updatedTasks: Array<{ _id: string; status: TaskStatus; sequence: number }> = [];
    const previousState = tasks.map(t => ({ _id: t._id, status: t.status, sequence: t.sequence ?? 0 }));

    if (source.droppableId === destination.droppableId) {
      const colTasks = [...sourceColumnTasks];
      const [moved] = colTasks.splice(source.index, 1);
      colTasks.splice(destination.index, 0, moved);

      updatedTasks = colTasks.map((t, index) => ({
        _id: t._id,
        status: source.droppableId as TaskStatus,
        sequence: index,
      }));
    } else {
      const srcTasks = [...sourceColumnTasks];
      const dstTasks = [...destColumnTasks];

      const [moved] = srcTasks.splice(source.index, 1);
      const updatedMoved = { ...moved, status: newStatus };
      dstTasks.splice(destination.index, 0, updatedMoved);

      const updatedSrc = srcTasks.map((t, index) => ({
        _id: t._id,
        status: source.droppableId as TaskStatus,
        sequence: index,
      }));

      const updatedDst = dstTasks.map((t, index) => ({
        _id: t._id,
        status: newStatus,
        sequence: index,
      }));

      updatedTasks = [...updatedSrc, ...updatedDst];
    }

    updateMultipleTasksStateInline(
      updatedTasks.map(item => ({
        _id: item._id,
        fields: { status: item.status, sequence: item.sequence },
      }))
    );

    if (project) {
      moveTask(draggableId, project._id, newStatus, destination.index);
    }

    try {
      await reorderTasks(updatedTasks);
    } catch (err: any) {
      console.error('Failed to reorder tasks:', err);
      updateMultipleTasksStateInline(
        previousState.map(item => ({
          _id: item._id,
          fields: { status: item.status, sequence: item.sequence },
        }))
      );
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
      } else {
        showToast(getFriendlyApiErrorMessage(err, 'We could not move that task. Please try again.'), 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && isAccessRestrictedMessage(error)) {
    return (
      <AccessRestrictedModal isOpen onClose={() => window.history.back()} />
    );
  }

  if (error || !project) {
    return (
      <div className="m-4 flex max-w-xl items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h2 className="text-sm font-semibold">Board unavailable</h2>
          <p className="mt-1 text-sm leading-6">
            {error && isAccessRestrictedMessage(error)
              ? 'You do not have access to this project board.'
              : 'We could not load this project board. Please refresh the page or try again in a moment.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      <div className="px-4 pt-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="text-sm text-slate-500 mb-2 dark:text-slate-500">Projects / {project.name}</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{projectKey} board</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canCreateTask && (
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer text-center"
              >
                Create Task
              </button>
            )}

            {/* Mobile-only New Status Dropdown (side-by-side with Create Task) */}
            <div className="block sm:hidden flex-1 relative" ref={addColumnMobileRef}>
              <button
                type="button"
                onClick={() => setIsAddColumnOpen(prev => !prev)}
                className="w-full justify-center inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                aria-haspopup="dialog"
                aria-expanded={isAddColumnOpen}
                title="Create a new status"
              >
                <Plus className="h-4 w-4" />
                New status
              </button>

              {isAddColumnOpen && (
                <div
                  role="dialog"
                  aria-label="Create board status"
                  className="absolute right-0 top-10 z-20 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  <form onSubmit={handleCreateColumn} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStatusName}
                        onChange={(event) => {
                          setNewStatusName(event.target.value);
                          setNewStatusError('');
                        }}
                        placeholder="Status name"
                        className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-955 dark:text-slate-100"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                        aria-label="Create status"
                        title="Create status"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {newStatusError && (
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">{newStatusError}</p>
                    )}
                  </form>

                  {addableStatuses.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                      {addableStatuses.map(col => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleAddColumn(col.id)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {col.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-wrap">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search board"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-sm border border-slate-300 rounded-sm bg-white text-slate-900 placeholder:text-slate-505 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-700 dark:bg-slate-909 dark:text-slate-100 dark:placeholder:text-slate-505"
            />
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-500" />
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            {boardAvatarUsers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMembersPage(1);
                  setIsMembersModalOpen(true);
                }}
                className="flex items-center -space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white cursor-pointer dark:focus:ring-offset-slate-950"
                aria-label="View project team members"
              >
                {boardAvatarUsers.map((member, index) => (
                  <span
                    key={member.userId}
                    title={`${member.name} - ${member.boardRole}${member.assignedTaskCount > 0 ? `, ${member.assignedTaskCount} assigned task${member.assignedTaskCount === 1 ? '' : 's'}` : ''}`}
                    className={`relative w-8 h-8 rounded-full border-2 border-white text-white flex items-center justify-center text-xs font-semibold overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5 dark:border-slate-950 ${member.avatarUrl ? 'bg-slate-202 dark:bg-slate-800' : AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                    style={{ zIndex: boardAvatarUsers.length - index }}
                  >
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(member.name)
                    )}
                  </span>
                ))}
                {projectTeamMembers.length > boardAvatarUsers.length && (
                  <span
                    className="relative w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-[11px] font-semibold text-slate-707 flex items-center justify-center shadow-sm dark:border-slate-950 dark:bg-slate-800 dark:text-slate-200"
                    style={{ zIndex: 0 }}
                    title={`${projectTeamMembers.length - boardAvatarUsers.length} more project member${projectTeamMembers.length - boardAvatarUsers.length === 1 ? '' : 's'}`}
                  >
                    +{projectTeamMembers.length - boardAvatarUsers.length}
                  </span>
                )}
              </button>
            )}

            {canManageProjectMembers && (
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </button>
            )}

            {/* ── New Status dropdown (DESKTOP ONLY) ──────────────────────────────────────── */}
            <div className="hidden sm:block relative" ref={addColumnRef}>
              <button
                type="button"
                onClick={() => setIsAddColumnOpen(prev => !prev)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 cursor-pointer"
                aria-haspopup="dialog"
                aria-expanded={isAddColumnOpen}
                title="Create a new status"
              >
                <Plus className="h-4 w-4" />
                New status
              </button>

              {isAddColumnOpen && (
                <div
                  role="dialog"
                  aria-label="Create board status"
                  className="absolute left-0 sm:left-auto sm:right-0 top-9 z-20 w-72 rounded-lg border border-slate-202 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  <form onSubmit={handleCreateColumn} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStatusName}
                        onChange={(event) => {
                          setNewStatusName(event.target.value);
                          setNewStatusError('');
                        }}
                        placeholder="Status name"
                        className="h-8 min-w-0 flex-1 rounded-md border border-slate-202 bg-white px-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-404 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                        aria-label="Create status"
                        title="Create status"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {newStatusError && (
                      <p className="text-xs font-medium text-red-655 dark:text-red-400">{newStatusError}</p>
                    )}
                  </form>

                  {addableStatuses.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                      {addableStatuses.map(col => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => handleAddColumn(col.id)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-202 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {col.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto md:overflow-y-hidden p-3">
        {!activeSprint ? (
          <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 dark:border-slate-800 dark:bg-slate-900 mx-4 mt-4">
            <div className="text-center p-8">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Active Sprint</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">There are no active sprints right now. Go to the Backlog to plan and start a new sprint.</p>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4 h-full pb-4">
              {boardStatusColumns.map(column => {
                const isRemovable = !DEFAULT_STATUSES.includes(column.id);
                return (
                  // Wrapper gives us a relative container so we can overlay
                  // the remove button on the KanbanColumn header area
                  <div key={column.id} className="relative w-full md:w-auto md:flex-shrink-0 group">
                    <KanbanColumn
                      columnId={column.id}
                      title={column.title}
                      issues={filteredIssues
                        .filter(i => i.status === column.id)
                        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))}
                      projectKey={projectKey}
                      issueUrlPrefix={issueUrlPrefix}
                    />
                    {isRemovable && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(column.id)}
                        title={`Remove "${column.title}" column`}
                        aria-label={`Remove "${column.title}" column`}
                        className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        refreshTasks={fetchProjectContext}
      />

      {isMembersModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-members-title"
          onClick={() => setIsMembersModalOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
              <div>
                <h2 id="project-members-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Project team members
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {projectTeamMembers.length} member{projectTeamMembers.length === 1 ? '' : 's'} working on {project.name}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canManageProjectMembers && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMembersModalOpen(false);
                      setIsAddMemberModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    <Plus className="h-4 w-4" />
                    Add Member
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMembersModalOpen(false)}
                  className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  aria-label="Close project members modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-4 py-4 sm:px-6">
              <div className="relative mb-4">
                <input
                  type="text"
                  value={membersSearchQuery}
                  onChange={(event) => setMembersSearchQuery(event.target.value)}
                  placeholder="Search members"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>

              {paginatedTeamMembers.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {membersSearchQuery.trim() ? 'No matching members found' : 'No project members found'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {membersSearchQuery.trim()
                      ? 'Try a different name, email, role, or status.'
                      : 'Assign tasks to team members to show them here.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 md:block">
                    <table className="w-full table-fixed text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        <tr>
                          <th className="w-[30%] px-4 py-3 font-semibold">Member</th>
                          <th className="w-[20%] px-4 py-3 font-semibold">Role</th>
                          <th className="w-[14%] px-4 py-3 font-semibold">Tasks</th>
                          <th className="w-[14%] px-4 py-3 font-semibold">Joined</th>
                          <th className="w-[12%] px-4 py-3 font-semibold">Status</th>
                          {canManageProjectMembers && <th className="w-[10%] px-4 py-3 font-semibold">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {paginatedTeamMembers.map((member, index) => (
                          <tr key={member.userId} className="bg-white dark:bg-slate-900">
                            <td className="px-4 py-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full text-white flex items-center justify-center text-sm font-semibold ${member.avatarUrl ? 'bg-slate-200 dark:bg-slate-800' : AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                                  {member.avatarUrl ? (
                                    <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                  ) : (
                                    getInitials(member.name)
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-slate-900 dark:text-slate-100">{member.name}</p>
                                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{member.email || 'No email available'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{member.boardRole}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {member.assignedTaskCount} assigned
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatJoinedDate(member.joinedAt)}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium capitalize text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                {member.status}
                              </span>
                            </td>
                            {canManageProjectMembers && (
                              <td className="px-4 py-3">
  <button
    type="button"
    onClick={() => setMemberToRemove(member)}
    title={`Remove ${member.name} from project`}
    className="inline-flex items-center justify-center rounded-md border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
  >
    <Trash2 className="h-4 w-4" />
  </button>
</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {paginatedTeamMembers.map((member, index) => (
                      <div key={member.userId} className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex items-start gap-3">
                          <div className={`h-11 w-11 shrink-0 overflow-hidden rounded-full text-white flex items-center justify-center text-sm font-semibold ${member.avatarUrl ? 'bg-slate-200 dark:bg-slate-800' : AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                            ) : (
                              getInitials(member.name)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900 dark:text-slate-100">{member.name}</p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{member.email || 'No email available'}</p>
                              </div>
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium capitalize text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                {member.status}
                              </span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-slate-500 dark:text-slate-400">Role</p>
                                <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{member.boardRole}</p>
                              </div>
                              <div>
                                <p className="text-slate-500 dark:text-slate-400">Tasks</p>
                                <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{member.assignedTaskCount} assigned</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-slate-500 dark:text-slate-400">Joined</p>
                                <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{formatJoinedDate(member.joinedAt)}</p>
                              </div>
                              {canManageProjectMembers && (
                                <button
                                  type="button"
                                  onClick={() => setMemberToRemove(member)}
                                  className="col-span-2 mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                  Remove from Project
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {(currentMembersPage - 1) * MEMBERS_PER_PAGE + (paginatedTeamMembers.length > 0 ? 1 : 0)}-
                {(currentMembersPage - 1) * MEMBERS_PER_PAGE + paginatedTeamMembers.length} of {filteredTeamMembers.length}
              </p>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setMembersPage(page => Math.max(1, page - 1))}
                  disabled={currentMembersPage === 1}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {currentMembersPage} / {totalMemberPages}
                </span>
                <button
                  type="button"
                  onClick={() => setMembersPage(page => Math.min(totalMemberPages, page + 1))}
                  disabled={currentMembersPage === totalMemberPages}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove Member Confirmation Modal ─────────────────────────────────── */}
      {memberToRemove && project && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-member-title"
          onClick={() => !isRemovingMember && setMemberToRemove(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                  <UserMinus className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 id="remove-member-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Remove Member
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={isRemovingMember}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              {/* Member chip */}
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${AVATAR_COLORS[0]}`}>
                  {memberToRemove.avatarUrl ? (
                    <img src={memberToRemove.avatarUrl} alt={memberToRemove.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    getInitials(memberToRemove.name)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{memberToRemove.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{memberToRemove.email}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  {memberToRemove.boardRole}
                </span>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/20">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Removing <strong>{memberToRemove.name}</strong> will revoke their access to{' '}
                  <strong>{project.name}</strong>. Their existing tasks will remain but they will no longer appear as an assignee option.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={isRemovingMember}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemovingMember}
                onClick={async () => {
                  if (!memberToRemove || !project) return;
                  setIsRemovingMember(true);
                  try {
                    await removeUserFromProject(project._id, memberToRemove.userId);
                    showToast(`${memberToRemove.name} has been removed from the project.`, 'success');
                    setProjectMembers((prev) => prev.filter((m) => m.userId !== memberToRemove.userId));
                    setMemberToRemove(null);
                  } catch (err: unknown) {
                    showToast(
                      getFriendlyApiErrorMessage(err, 'Could not remove member. Please try again.'),
                      'error'
                    );
                  } finally {
                    setIsRemovingMember(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {isRemovingMember ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )}
                {isRemovingMember ? 'Removing…' : 'Yes, Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddMemberModalOpen && currentOrg && project && (
        <AddProjectMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          orgId={currentOrg.id}
          projectId={project._id}
          projectName={project.name}
          existingMemberIds={projectMembers.map((m) => m.userId)}
          onMemberAdded={() => {
            // Refresh project members list after adding
            getProjectMembers(project._id)
              .then((members) => setProjectMembers(members))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
