'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Briefcase,
  Compass,
  Loader2,
  User as UserIcon,
  Shield,
  Layers,
} from 'lucide-react';
import { getWorkspaceMembers } from '@/api/workspace';
import { getTeams, type ITeamData } from '@/api/teams';
import { getDepartments, type IDepartmentData } from '@/api/departments';
import { useOrganization } from '@/context/useOrganization';
import type { WorkspaceMember } from '@/types/workspace';
import { useToast } from '@/context/useToast';

interface ClientWorkspaceViewProps {
  orgId: string;
}

export default function ClientWorkspaceView({
  orgId,
}: ClientWorkspaceViewProps): React.JSX.Element {
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [teams, setTeams] = useState<ITeamData[]>([]);
  const [departments, setDepartments] = useState<IDepartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [membersData, teamsData, deptsData] = await Promise.all([
          getWorkspaceMembers(orgId).catch(() => []),
          getTeams().catch(() => []),
          getDepartments().catch(() => []),
        ]);
        setMembers(membersData);
        setTeams(teamsData);
        setDepartments(deptsData);
      } catch {
        showToast('Failed to load workspace directory details', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orgId]);

  return (
    <div className="space-y-6">
      {/* Workspace Summary details */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-650 border border-slate-100">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">{currentOrg?.name}</h2>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700 tracking-wide">
                {currentOrg?.plan} Plan
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 max-w-2xl leading-relaxed">
              {currentOrg?.description || 'Your collaboration hub on TaskBridge. Manage and track project timelines and deliverables.'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-blue-650" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Members list - takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-50">
              <Users className="h-4.5 w-4.5 text-blue-650" />
              <h3 className="text-sm font-bold text-slate-800">Members Directory</h3>
            </div>

            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[480px] scrollbar-thin">
              {members.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-450">No members found.</p>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 overflow-hidden">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                          member.name[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800">{member.name}</p>
                        <p className="truncate text-[10px] text-slate-450">{member.email}</p>
                      </div>
                    </div>
                    <span className="rounded bg-slate-50 border border-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                      {member.roleName || member.role || 'Member'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Teams & Departments sidebar - takes 1 column */}
          <div className="space-y-6">
            {/* Teams panel */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
                <Briefcase className="h-4 w-4 text-blue-650" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Teams</h3>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[220px] scrollbar-thin">
                {teams.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-3">No teams created.</p>
                ) : (
                  teams.map((team) => (
                    <div key={team._id} className="border border-slate-50 rounded-xl p-3 bg-slate-50/30">
                      <p className="text-xs font-bold text-slate-800">{team.name}</p>
                      <p className="text-[10px] text-slate-450 truncate mt-0.5">{team.description || 'No description.'}</p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2 font-semibold">
                        <span>Lead: {typeof team.lead === 'object' ? team.lead?.name : 'None'}</span>
                        <span className="bg-slate-100 rounded px-1.5 py-0.5 text-[8px]">{team.members?.length || 0} Members</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Departments panel */}
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
                <Layers className="h-4 w-4 text-blue-650" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Departments</h3>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[220px] scrollbar-thin">
                {departments.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-3">No departments created.</p>
                ) : (
                  departments.map((dept) => (
                    <div key={dept._id} className="border border-slate-50 rounded-xl p-3 bg-slate-50/30 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{dept.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Head: {typeof dept.head === 'object' ? dept.head?.name : 'None'}
                        </p>
                      </div>
                      <span className="rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[9px] font-bold">
                        {dept.memberCount || 0} Headcount
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
