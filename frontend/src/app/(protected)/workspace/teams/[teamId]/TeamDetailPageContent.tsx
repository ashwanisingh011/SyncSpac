'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import TeamFormModal from '@/components/workspace/TeamFormModal';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import { getTeamById, deleteTeam, ITeamData } from '@/api/teams';
import { getWorkspaceMembers } from '@/api/workspace';
import { getProjects } from '@/api/projects';
import { getProjectTasks } from '@/api/tasks';
import { WorkspaceMember } from '@/types/workspace';
import { Project } from '@/types/projects';
import type { ITaskData } from '@/types/workspace';
import {
  computeTeamMetrics,
  computeMemberPerformance,
  buildTeamActivityTimeline,
  fetchTasksForProjects,
  filterTeamTasks,
  formatTeamDate,
  formatRelativeTime,
  getTeamMemberIds,
  getTeamProjectIds,
} from '@/lib/teamMetrics';
import { formatTaskStatusLabel, getTaskStatusCounts } from '@/lib/taskStatus';
import {
  Loader2,
  Users,
  ArrowLeft,
  Edit2,
  Trash2,
  User,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  ListTodo,
  Mail,
  Calendar,
  Activity,
  Trophy,
  Zap,
  RefreshCw,
} from 'lucide-react';

const CHART_STATUS_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#22c55e', '#ef4444', 'var(--content-tertiary)'];

const getChartStatusColor = (status: string): string => {
  const hash = Array.from(status).reduce((total, char) => total + char.charCodeAt(0), 0);
  return CHART_STATUS_COLORS[hash % CHART_STATUS_COLORS.length];
};

export default function TeamDetailPageContent({ teamId, onBack }: { teamId: string; onBack?: () => void }) {
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const { hasPermission } = usePermission();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [team, setTeam] = useState<ITeamData | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamTasks, setTeamTasks] = useState<ITaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const orgId = currentOrg?.id ?? '';
  const canManageTeams = hasPermission('manage_team');

  const loadData = useCallback(async () => {
    if (!orgId || !teamId) return;
    setIsLoading(true);
    try {
      const [teamData, membersData, projectsData] = await Promise.all([
        getTeamById(teamId),
        getWorkspaceMembers(orgId),
        getProjects(),
      ]);
      setTeam(teamData);
      setMembers(membersData);
      setProjects(projectsData);

      const projectIds = getTeamProjectIds(teamData);
      const tasks = await fetchTasksForProjects(projectIds, getProjectTasks);
      setTeamTasks(filterTeamTasks(tasks, teamData));
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to load team details', 'error');
      setTeam(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, teamId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(
    () => (team ? computeTeamMetrics(team, teamTasks, members) : null),
    [team, teamTasks, members]
  );

  const memberPerformance = useMemo(
    () => (team ? computeMemberPerformance(team, teamTasks) : []),
    [team, teamTasks]
  );

  const projectNameById = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p) => {
      map[p._id] = p.name;
    });
    if (team) {
      team.projectIds.forEach((p) => {
        if (typeof p === 'object') map[p._id] = p.name;
      });
    }
    return map;
  }, [projects, team]);

  const activityTimeline = useMemo(
    () => (team ? buildTeamActivityTimeline(team, teamTasks, projectNameById) : []),
    [team, teamTasks, projectNameById]
  );

  const statusDistribution = useMemo(
    () => getTaskStatusCounts(teamTasks).map((item, index) => ({
      ...item,
      color: CHART_STATUS_COLORS[index % CHART_STATUS_COLORS.length],
    })),
    [teamTasks]
  );

  const handleDelete = async () => {
    if (!team) return;
    const isConfirmed = await confirm({
      title: 'Delete Team',
      message: `Are you sure you want to delete the team "${team.name}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteTeam(team._id);
      showToast('Team deleted successfully', 'success');
      if (onBack) {
        onBack();
      } else {
        router.push('/workspace/teams');
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to delete team', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team || !metrics) {
    return (
      <div className="text-center py-16">
        <Users className="w-12 h-12 text-content-tertiary mx-auto mb-3" />
        <h3 className="text-base font-semibold text-content">Team not found</h3>
        <p className="text-sm text-content-tertiary mt-1">
          This team may have been deleted or you don&apos;t have access.
        </p>
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Teams
          </button>
        ) : (
          <Link
            href="/workspace/teams"
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Teams
          </Link>
        )}
      </div>
    );
  }

  const teamLead =
    typeof team.lead === 'object'
      ? team.lead
      : members.find((m) => m.userId === team.lead);

  const leadName = teamLead ? ('name' in teamLead ? teamLead.name : '') : 'Not assigned';
  const leadEmail = teamLead ? ('email' in teamLead ? teamLead.email : '') : '';
  const leadAvatar = teamLead
    ? 'avatar' in teamLead
      ? teamLead.avatar
      : 'avatarUrl' in teamLead
        ? teamLead.avatarUrl
        : null
    : null;

  const memberIds = getTeamMemberIds(team);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-tertiary mb-2">
            {onBack ? (
              <button onClick={onBack} className="hover:text-primary transition-colors cursor-pointer">
                Teams
              </button>
            ) : (
              <Link href="/workspace/teams" className="hover:text-primary transition-colors">
                Teams
              </Link>
            )}
            <span>/</span>
            <span className="text-content-secondary">{team.name}</span>
          </div>
          <h1 className="text-2xl font-semibold text-content">{team.name}</h1>
          {team.description && (
            <p className="mt-1 text-sm text-content-tertiary">{team.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-content-secondary hover:text-content border border-line rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <Link
              href="/workspace/teams"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-content-secondary hover:text-content border border-line rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          )}
          {canManageTeams && (
            <>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-primary border border-primary/25 rounded-lg hover:bg-primary-subtle transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-danger border border-danger/25 rounded-lg hover:bg-danger/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: metrics.totalMembers, icon: Users, color: 'text-primary bg-primary-subtle' },
          { label: 'Active Members', value: metrics.activeMembers, icon: Zap, color: 'text-success bg-success/10' },
          { label: 'Assigned Projects', value: metrics.assignedProjects, icon: Briefcase, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
          { label: 'Team Performance', value: `${metrics.performance}%`, icon: TrendingUp, color: 'text-warning bg-warning/10' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-content">{stat.value}</p>
                <p className="text-[10px] text-content-tertiary uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Information */}
          <section className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-content mb-4">Team Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[10px] uppercase font-bold tracking-wider text-content-tertiary">Team Name</dt>
                <dd className="mt-1 font-medium text-content">{team.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase font-bold tracking-wider text-content-tertiary">Created Date</dt>
                <dd className="mt-1 font-medium text-content flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-content-tertiary" />
                  {formatTeamDate(team.createdAt)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] uppercase font-bold tracking-wider text-content-tertiary">Description</dt>
                <dd className="mt-1 text-content-secondary">
                  {team.description || 'No description provided.'}
                </dd>
              </div>
            </dl>
          </section>

          {/* Team Lead Details */}
          <section className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-content mb-4">Team Lead Details</h2>
            {teamLead ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center overflow-hidden border border-line shrink-0">
                  {leadAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={leadAvatar} alt={leadName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-content-tertiary" />
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold text-content">{leadName}</p>
                  {leadEmail && (
                    <p className="text-sm text-content-tertiary flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {leadEmail}
                    </p>
                  )}
                  <p className="text-xs text-primary mt-1 font-medium">Team Lead</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-content-tertiary">No team lead assigned.</p>
            )}
          </section>

          {/* Member List */}
          <section className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-content">
                Member List ({memberIds.length})
              </h2>
            </div>
            {memberIds.length === 0 ? (
              <p className="text-sm text-content-tertiary">No members in this team.</p>
            ) : (
              <div className="divide-y divide-line/80">
                {memberIds.map((userId) => {
                  const memberRef = team.members.find(
                    (m) => (m && typeof m === 'object' ? m._id : m) === userId
                  );
                  const wsMember = members.find((m) => m.userId === userId);
                  const profile =
                    typeof memberRef === 'object'
                      ? memberRef
                      : wsMember
                        ? { name: wsMember.name, email: wsMember.email, avatar: wsMember.avatarUrl }
                        : null;
                  const perf = memberPerformance.find((p) => p.userId === userId);
                  const isLead =
                    team.lead &&
                    (typeof team.lead === 'object' ? team.lead._id : team.lead) === userId;

                  return (
                    <div key={userId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center overflow-hidden text-xs font-semibold shrink-0">
                          {profile?.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                          ) : (
                            (profile?.name ?? 'M').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-content">
                            {profile?.name ?? 'Member'}
                            {isLead && (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                                Lead
                              </span>
                            )}
                          </p>
                          {profile?.email && (
                            <p className="text-xs text-content-tertiary">{profile.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-content-secondary">
                          {perf?.completedTasks ?? 0}/{perf?.totalTasks ?? 0} tasks
                        </p>
                        <p className="text-[10px] text-content-tertiary">
                          {wsMember?.status === 'active' ? 'Active' : wsMember?.status ?? 'Unknown'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Assigned Projects */}
          <section className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-content mb-4">
              Assigned Projects ({team.projectIds.length})
            </h2>
            {team.projectIds.length === 0 ? (
              <p className="text-sm text-content-tertiary">No projects assigned to this team.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {team.projectIds.map((proj) => {
                  if (!proj) return null;
                  const projectId = typeof proj === 'object' ? proj._id : proj;
                  const projectName =
                    typeof proj === 'object'
                      ? proj.name
                      : projects.find((p) => p._id === projectId)?.name ?? 'Unknown';
                  const projectKey =
                    typeof proj === 'object'
                      ? proj.key
                      : projects.find((p) => p._id === projectId)?.key;
                  const projectDesc =
                    typeof proj === 'object'
                      ? proj.description
                      : projects.find((p) => p._id === projectId)?.description;

                  return (
                    <Link
                      key={projectId}
                      href={projectKey ? `/projects/${projectKey}` : '#'}
                      className="flex items-start gap-3 p-3 rounded-xl border border-line hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-content group-hover:text-blue-600 transition-colors truncate">
                          {projectName}
                        </p>
                        {projectKey && (
                          <p className="text-[10px] font-mono text-content-tertiary mt-0.5">{projectKey}</p>
                        )}
                        {projectDesc && (
                          <p className="text-xs text-content-tertiary mt-1 line-clamp-2">
                            {projectDesc}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Assigned Tasks */}
          <section className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-content mb-4">
              Assigned Tasks ({teamTasks.length})
            </h2>
            {teamTasks.length === 0 ? (
              <p className="text-sm text-content-tertiary">No tasks assigned to team members yet.</p>
            ) : (
              <div className="divide-y divide-line/80 max-h-80 overflow-y-auto">
                {teamTasks.slice(0, 20).map((task) => {
                  const taskAssignedToId = task.assignedTo && typeof task.assignedTo === 'object' ? (task.assignedTo as any)._id : task.assignedTo;
                  const assignee = members.find((m) => m.userId === taskAssignedToId);
                  return (
                    <div key={task._id} className="flex items-center justify-between py-3 first:pt-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <ListTodo className="w-4 h-4 text-content-tertiary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-content truncate">
                            {task.title}
                          </p>
                          <p className="text-[10px] text-content-tertiary font-mono">{task.taskKey}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize"
                          style={{
                            backgroundColor: `${getChartStatusColor(task.status)}20`,
                            color: getChartStatusColor(task.status),
                          }}
                        >
                          {formatTaskStatusLabel(task.status)}
                        </span>
                        {assignee && (
                          <span className="text-[10px] text-content-tertiary hidden sm:inline">{assignee.name}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Task Progress Summary */}
          <section className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-content mb-4">Task Progress Summary</h2>
            <div className="space-y-3">
              {[
                { label: 'Total Tasks', value: metrics.totalTasks, color: 'bg-slate-500' },
                { label: 'Completed', value: metrics.completedTasks, color: 'bg-success' },
                { label: 'Pending', value: metrics.pendingTasks, color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-content-secondary">{item.label}</span>
                    <span className="font-semibold text-content">{item.value}</span>
                  </div>
                  <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: metrics.totalTasks > 0 ? `${(item.value / metrics.totalTasks) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-line text-center">
              <p className="text-3xl font-bold text-content">{metrics.performance}%</p>
              <p className="text-xs text-content-tertiary mt-0.5">Completion Rate</p>
            </div>
          </section>

          {/* Performance Metrics */}
          <section className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-content">Performance Metrics</h2>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>

            {memberPerformance.length > 0 ? (
              <div className="space-y-3 mb-5">
                {memberPerformance.slice(0, 5).map((member, index) => (
                  <div key={member.userId} className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-bold w-4 shrink-0 ${
                        index === 0
                          ? 'text-warning'
                          : index === 1
                            ? 'text-content-tertiary'
                            : index === 2
                              ? 'text-orange-400'
                              : 'text-content-tertiary'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-primary-subtle flex items-center justify-center text-[10px] font-bold text-primary shrink-0 overflow-hidden">
                      {member.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-content truncate">
                          {member.name}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 ml-2">
                          {member.score}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1 bg-surface-hover rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            style={{ width: `${member.score}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-content-tertiary shrink-0">
                          {member.completedTasks}/{member.totalTasks}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-content-tertiary mb-5">No performance data yet.</p>
            )}

            {statusDistribution.length > 0 && (
              <div className="border-t border-line pt-4">
                <p className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-3">
                  Task Status Distribution
                </p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={statusDistribution} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--content-tertiary)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--content-tertiary)' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 11 }}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={24}>
                      {statusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Team Activity Timeline */}
          <section className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-content">Team Activity Timeline</h2>
                <p className="text-xs text-content-tertiary mt-0.5">Recent task activity</p>
              </div>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>

            {activityTimeline.length === 0 ? (
              <p className="text-sm text-content-tertiary">No recent activity.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-surface-hover" />
                <ul className="space-y-4">
                  {activityTimeline.map((activity) => {
                    const Icon =
                      activity.type === 'completed'
                        ? CheckCircle2
                        : activity.type === 'created'
                          ? Zap
                          : RefreshCw;
                    const iconColor =
                      activity.type === 'completed'
                        ? 'bg-emerald-100 text-success'
                        : activity.type === 'created'
                          ? 'bg-primary-subtle text-primary'
                          : 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400';

                    return (
                      <li key={activity.id} className="flex gap-3 relative">
                        <div
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-content">
                              {activity.userName}
                            </span>
                            <span className="text-xs text-content-tertiary">{activity.message}</span>
                          </div>
                          <p className="text-xs text-content-secondary mt-0.5 truncate font-medium">
                            {activity.detail}
                          </p>
                          {activity.projectName && (
                            <p className="text-[10px] text-indigo-500 mt-0.5">
                              {activity.projectName}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-content-tertiary" />
                            <span className="text-[10px] text-content-tertiary">
                              {formatRelativeTime(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>

      <TeamFormModal
        key={team._id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        editingTeam={team}
        members={members}
        projects={projects}
      />
    </div>
  );
}
