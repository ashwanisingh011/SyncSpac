'use client';

import { useState } from 'react';
import { Loader2, X, Check } from 'lucide-react';
import { createTeam, updateTeam, ITeamData, TeamFormData } from '@/api/teams';
import { WorkspaceMember } from '@/types/workspace';
import { Project } from '@/types/projects';
import { useToast } from '@/context/useToast';

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTeam: ITeamData | null;
  members: WorkspaceMember[];
  projects: Project[];
}

export default function TeamFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingTeam,
  members,
  projects,
}: TeamFormModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(editingTeam?.name ?? '');
  const [description, setDescription] = useState(editingTeam?.description ?? '');
  const [lead, setLead] = useState(
    editingTeam?.lead
      ? typeof editingTeam.lead === 'object'
        ? editingTeam.lead._id
        : editingTeam.lead
      : ''
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    editingTeam?.members.map((m) => (typeof m === 'object' ? m._id : m)) ?? []
  );
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    editingTeam?.projectIds.map((p) => (typeof p === 'object' ? p._id : p)) ?? []
  );

  if (!isOpen) return null;

  const handleToggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Team name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    const payload: TeamFormData = {
      name: name.trim(),
      description: description.trim() || undefined,
      lead: lead || undefined,
      members: selectedMembers,
      projectIds: selectedProjects,
    };

    try {
      if (editingTeam) {
        await updateTeam(editingTeam._id, payload);
        showToast('Team updated successfully', 'success');
      } else {
        await createTeam(payload);
        showToast('Team created successfully', 'success');
      }
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to save team', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-250/60 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {editingTeam ? 'Edit Team Details' : 'Create Collaborative Team'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[70vh]">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Team Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Frontend Core, QA Squad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-905 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              placeholder="Describe the focus or purpose of this team..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] p-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-905 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Team Lead</label>
            <select
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-905 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Select a Team Lead...</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Add Team Members</label>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 max-h-[140px] overflow-y-auto space-y-1.5 bg-slate-50/30 dark:bg-slate-950/10">
              {members.map((m) => {
                const isChecked = selectedMembers.includes(m.userId);
                return (
                  <div
                    key={m.userId}
                    onClick={() => handleToggleMember(m.userId)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 flex items-center justify-center font-semibold overflow-hidden">
                        {m.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          m.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                    </div>
                    {isChecked && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Assign Projects</label>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 max-h-[140px] overflow-y-auto space-y-1.5 bg-slate-50/30 dark:bg-slate-950/10">
              {projects.map((p) => {
                const isChecked = selectedProjects.includes(p._id);
                return (
                  <div
                    key={p._id}
                    onClick={() => handleToggleProject(p._id)}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{p.name}</span>
                    {isChecked && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200/50 dark:border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-sm font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingTeam ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
