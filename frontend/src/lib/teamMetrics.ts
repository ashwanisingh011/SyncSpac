import type { ITeamData } from '@/api/teams';
import type { ITaskData, WorkspaceMember } from '@/types/workspace';
import { isCompletedTaskStatus } from '@/lib/taskStatus';

export interface TeamMetrics {
  totalMembers: number;
  activeMembers: number;
  assignedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  performance: number;
}

export interface TeamActivityItem {
  id: string;
  type: 'created' | 'completed' | 'updated' | 'assigned';
  userName: string;
  userAvatar?: string;
  message: string;
  detail: string;
  projectName?: string;
  timestamp: string;
}

export interface MemberPerformance {
  userId: string;
  name: string;
  avatar?: string;
  totalTasks: number;
  completedTasks: number;
  score: number;
}

export function getTeamMemberIds(team: ITeamData): string[] {
  const ids = new Set<string>();
  if (team.lead) {
    const leadId = typeof team.lead === 'object' ? team.lead._id : team.lead;
    if (leadId) ids.add(leadId);
  }
  team.members.forEach((member) => {
    const memberId = typeof member === 'object' ? member._id : member;
    if (memberId) ids.add(memberId);
  });
  return Array.from(ids);
}

export function getTeamProjectIds(team: ITeamData): string[] {
  return team.projectIds.map((project) =>
    typeof project === 'object' ? project._id : project
  );
}

export function filterTeamTasks(tasks: ITaskData[], team: ITeamData): ITaskData[] {
  const memberIds = new Set(getTeamMemberIds(team));
  const projectIds = new Set(getTeamProjectIds(team));

  return tasks.filter((task) => {
    const taskProjectId = task.project && typeof task.project === 'object' ? (task.project as any)._id : task.project;
    const taskAssignedToId = task.assignedTo && typeof task.assignedTo === 'object' ? (task.assignedTo as any)._id : task.assignedTo;

    return (
      projectIds.has(taskProjectId) &&
      taskAssignedToId &&
      memberIds.has(taskAssignedToId)
    );
  });
}

export function computeTeamMetrics(
  team: ITeamData,
  tasks: ITaskData[],
  workspaceMembers: WorkspaceMember[]
): TeamMetrics {
  const teamTasks = filterTeamTasks(tasks, team);
  const memberIds = getTeamMemberIds(team);

  const activeMembers = memberIds.filter((id) => {
    const member = workspaceMembers.find((m) => m.userId === id);
    return member?.status === 'active';
  }).length;

  const completedTasks = teamTasks.filter((task) => isCompletedTaskStatus(task.status)).length;
  const totalTasks = teamTasks.length;
  const pendingTasks = teamTasks.filter((task) => !isCompletedTaskStatus(task.status)).length;
  const performance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalMembers: memberIds.length,
    activeMembers,
    assignedProjects: team.projectIds.length,
    totalTasks,
    completedTasks,
    pendingTasks,
    performance,
  };
}

export function computeMemberPerformance(
  team: ITeamData,
  tasks: ITaskData[]
): MemberPerformance[] {
  const teamTasks = filterTeamTasks(tasks, team);
  const memberIds = getTeamMemberIds(team);

  return memberIds
    .map((userId) => {
      const memberRef = team.members.find(
        (m) => (typeof m === 'object' ? m._id : m) === userId
      );
      const leadRef =
        team.lead && (typeof team.lead === 'object' ? team.lead._id : team.lead) === userId
          ? team.lead
          : null;

      const profile =
        typeof memberRef === 'object'
          ? memberRef
          : typeof leadRef === 'object'
            ? leadRef
            : null;

      const memberTasks = teamTasks.filter((task) => {
        const taskAssignedToId = task.assignedTo && typeof task.assignedTo === 'object' ? (task.assignedTo as any)._id : task.assignedTo;
        return taskAssignedToId === userId;
      });
      const completedTasks = memberTasks.filter((task) => isCompletedTaskStatus(task.status)).length;
      const totalTasks = memberTasks.length;
      const score = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        userId,
        name: profile?.name ?? 'Member',
        avatar: profile?.avatar,
        totalTasks,
        completedTasks,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || b.completedTasks - a.completedTasks);
}

export function buildTeamActivityTimeline(
  team: ITeamData,
  tasks: ITaskData[],
  projectNameById: Record<string, string>
): TeamActivityItem[] {
  const teamTasks = filterTeamTasks(tasks, team);
  const activities: TeamActivityItem[] = [];

  teamTasks.forEach((task) => {
    const taskAssignedToId = task.assignedTo && typeof task.assignedTo === 'object' ? (task.assignedTo as any)._id : task.assignedTo;
    const taskProjectId = task.project && typeof task.project === 'object' ? (task.project as any)._id : task.project;

    const assignee = team.members.find(
      (m) => (typeof m === 'object' ? m._id : m) === taskAssignedToId
    );
    const assigneeProfile = typeof assignee === 'object' ? assignee : null;

    activities.push({
      id: `${task._id}-updated`,
      type: isCompletedTaskStatus(task.status) ? 'completed' : 'updated',
      userName: assigneeProfile?.name ?? 'Team member',
      userAvatar: assigneeProfile?.avatar,
      message: isCompletedTaskStatus(task.status) ? 'completed' : 'updated',
      detail: task.title,
      projectName: projectNameById[taskProjectId],
      timestamp: task.updatedAt,
    });

    if (task.createdAt !== task.updatedAt) {
      activities.push({
        id: `${task._id}-created`,
        type: 'created',
        userName: assigneeProfile?.name ?? 'Team member',
        userAvatar: assigneeProfile?.avatar,
        message: 'was assigned',
        detail: task.title,
        projectName: projectNameById[taskProjectId],
        timestamp: task.createdAt,
      });
    }
  });

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);
}

export async function fetchTasksForProjects(
  projectIds: string[],
  getProjectTasks: (projectId: string) => Promise<ITaskData[]>
): Promise<ITaskData[]> {
  const uniqueIds = [...new Set(projectIds)];
  const results = await Promise.all(
    uniqueIds.map(async (projectId) => {
      try {
        return await getProjectTasks(projectId);
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}

export function formatTeamDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatTeamDate(dateString);
}
