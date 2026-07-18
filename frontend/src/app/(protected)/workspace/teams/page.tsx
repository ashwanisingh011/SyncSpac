'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import TeamFormModal from '@/components/workspace/TeamFormModal';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import { getTeams, deleteTeam, ITeamData } from '@/api/teams';
import { getWorkspaceMembers } from '@/api/workspace';
import { getProjects } from '@/api/projects';
import { getProjectTasks } from '@/api/tasks';
import { WorkspaceMember } from '@/types/workspace';
import { Project } from '@/types/projects';
import {
  computeTeamMetrics,
  fetchTasksForProjects,
  formatTeamDate,
  getTeamProjectIds,
} from '@/lib/teamMetrics';
import type { TeamMetrics } from '@/lib/teamMetrics';
import type { ITaskData } from '@/types/workspace';
import {
  Plus,
  Search,
  Users,
  Trash2,
  Edit2,
  Loader2,
  User,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

function PerformanceBadge({ value }: { value: number }) {
  const color =
    value >= 75
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
      : value >= 50
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${color}`}>
      <TrendingUp className="w-3 h-3" />
      {value}%
    </span>
  );
}

interface TeamsPageProps {
  onTeamSelect?: (teamId: string) => void;
}

export default function TeamsPage({ onTeamSelect }: TeamsPageProps = {}) {
  const { currentOrg } = useOrganization();
  const { hasPermission } = usePermission();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [teams, setTeams] = useState<ITeamData[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<ITaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ITeamData | null>(null);

  const orgId = currentOrg?.id ?? '';
  const canManageTeams = hasPermission('manage_team');

  const loadData = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [teamsData, membersData, projectsData] = await Promise.all([
        getTeams(),
        getWorkspaceMembers(orgId),
        getProjects(),
      ]);
      setTeams(teamsData);
      setMembers(membersData);
      setProjects(projectsData);

      const projectIds = [
        ...new Set(teamsData.flatMap((team) => getTeamProjectIds(team))),
      ];
      const tasks = await fetchTasksForProjects(projectIds, getProjectTasks);
      setAllTasks(tasks);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to load teams data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (team: ITeamData | null = null) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Team',
      message: `Are you sure you want to delete the team "${teamName}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteTeam(teamId);
      showToast('Team deleted successfully', 'success');
      loadData();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to delete team', 'error');
    }
  };

  const teamMetricsMap = useMemo(() => {
    const map = new Map<string, TeamMetrics>();
    teams.forEach((team) => {
      map.set(team._id, computeTeamMetrics(team, allTasks, members));
    });
    return map;
  }, [teams, allTasks, members]);

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getLeadName = (team: ITeamData) => {
    const teamLead =
      typeof team.lead === 'object'
        ? team.lead
        : members.find((m) => m.userId === team.lead);
    return teamLead ? ('name' in teamLead ? teamLead.name : '') : 'No Lead';
  };

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Teams"
        subtitle="Manage collaborative teams with full visibility into members, projects, and performance."
        action={
          canManageTeams && (
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Team
            </button>
          )
        }
      />

      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        />
        <Search className="w-4.5 h-4.5 absolute left-3 top-2.5 text-slate-400" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No teams found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search keywords.' : 'Create your first team to start collaborating.'}
          </p>
        </div>
      ) : (
        <>
          {/* Responsive card grid for all screen sizes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => {
              const metrics = teamMetricsMap.get(team._id)!;
              const teamLead =
                typeof team.lead === 'object'
                  ? team.lead
                  : members.find((m) => m.userId === team.lead);
              const leadName = teamLead ? ('name' in teamLead ? teamLead.name : '') : 'No Lead assigned';
              const leadAvatar = teamLead
                ? 'avatar' in teamLead
                  ? teamLead.avatar
                  : 'avatarUrl' in teamLead
                    ? teamLead.avatarUrl
                    : null
                : null;

              const cardContent = (
                <>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                        {team.name}
                      </h2>
                      {team.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <PerformanceBadge value={metrics.performance} />
                  </div>

                  <div className="flex items-center gap-2.5 py-3 border-t border-slate-100 dark:border-slate-900/60">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden border border-slate-200/40 dark:border-slate-800">
                      {leadAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={leadAvatar} alt={leadName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Team Lead</p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{leadName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100 dark:border-slate-900/60">
                    {[
                      { label: 'Members', value: metrics.totalMembers },
                      { label: 'Active', value: metrics.activeMembers },
                      { label: 'Projects', value: metrics.assignedProjects },
                      { label: 'Tasks', value: metrics.totalTasks },
                      { label: 'Done', value: metrics.completedTasks },
                      { label: 'Pending', value: metrics.pendingTasks },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{stat.value}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-900/60 flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Created {formatTeamDate(team.createdAt)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </>
              );

              if (onTeamSelect) {
                return (
                  <button
                    key={team._id}
                    onClick={() => onTeamSelect(team._id)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all block group w-full text-left cursor-pointer"
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <Link
                  key={team._id}
                  href={`/workspace/teams/${team._id}`}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all block group"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <TeamFormModal
        key={editingTeam?._id ?? 'new'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        editingTeam={editingTeam}
        members={members}
        projects={projects}
      />
    </div>
  );
}
