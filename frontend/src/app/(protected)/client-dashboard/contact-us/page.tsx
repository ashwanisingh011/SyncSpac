'use client';

import { useOrganization } from '@/context/useOrganization';
import { Mail, PhoneCall, Loader2 } from 'lucide-react';
import { getWorkspaceMembers } from '@/api/workspace';
import { useState, useEffect } from 'react';
import type { WorkspaceMember } from '@/types/workspace';
import { useToast } from '@/context/useToast';

export default function ContactUsPage(): React.JSX.Element {
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;

    const loadMembers = async () => {
      setLoading(true);
      try {
        const data = await getWorkspaceMembers(currentOrg.id);
        setMembers(data);
      } catch (err) {
        showToast('Failed to load contacts directory.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [currentOrg]);

  if (!currentOrg) {
    return (
      <div className="flex justify-center items-center py-20 text-xs text-slate-400">
        No active organization selected.
      </div>
    );
  }

  // Filter only organization admin, project manager, team lead
  const allowedRoles = ['owner', 'admin', 'org_admin', 'project_manager', 'team_lead'];
  const contacts = members.filter((member) =>
    allowedRoles.includes(member.role?.toLowerCase() || '')
  );

  const getRoleBadge = (role: string) => {
    const roleLower = role.toLowerCase();
    if (['owner', 'admin', 'org_admin'].includes(roleLower)) {
      return {
        label: 'Organization Admin',
        classes: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-900/30',
      };
    }
    if (roleLower === 'project_manager') {
      return {
        label: 'Project Manager',
        classes: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/40 dark:border-blue-900/30',
      };
    }
    if (roleLower === 'team_lead') {
      return {
        label: 'Team Lead',
        classes: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-900/30',
      };
    }
    return {
      label: 'Stakeholder',
      classes: 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200/50',
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
          <PhoneCall className="h-5 w-5 text-blue-600" /> Contact Us
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Reach out to the appropriate workspace administrators and project leads.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Workspace Stakeholders</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Key contact list for {currentOrg.name}</p>
          </div>

          {contacts.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">No contact leads found for this organization.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {contacts.map((contact) => {
                const badge = getRoleBadge(contact.role);
                const mailToUrl = `mailto:${contact.email}`;

                return (
                  <div
                    key={contact.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/45 dark:bg-slate-950/20 p-5 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm overflow-hidden font-bold">
                        {contact.avatarUrl ? (
                          <img src={contact.avatarUrl} alt={contact.name} className="h-full w-full object-cover" />
                        ) : (
                          contact.name.substring(0, 2).toUpperCase()
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">
                            {contact.name}
                          </p>
                          <a
                            href={mailToUrl}
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-indigo-400 transition-colors p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                            aria-label={`Mail ${contact.name}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="mt-1 flex">
                          <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.classes}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Email display line */}
                    <div className="mt-4 pt-3.5 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Email Address</span>
                      <a
                        href={mailToUrl}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[160px]"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
