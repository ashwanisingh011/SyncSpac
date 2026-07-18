'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTaskBridgeStore } from '@/store/useTaskBridgeStore';
import { useOrganization } from '@/context/useOrganization';
import { TaskFormData, TaskStatusType, TaskPriorityType, TaskTypeType } from '@/types/tasks';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '@/context/useToast';
import { getAssignableMembers } from '@/lib/assignableMembers';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import { isAccessRestrictedError } from '@/lib/accessErrors';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';
import { usePermission } from '@/hooks/usePermission';
import { getProjectTaskStatusOptions, PROJECT_STATUS_CHANGED_EVENT } from '@/lib/taskStatus';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProjectId?: string;
  onSuccess?: () => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  preselectedProjectId,
  onSuccess
}: CreateTaskModalProps) {
  const { currentOrg } = useOrganization();
  const {
    projects,
    members,
    fetchProjects,
    fetchWorkspaceMembers,
    createTask,
    activeProject,
    tasks
  } = useTaskBridgeStore();

  const { showToast } = useToast();
  const { canAssignTask, hasRole, user } = usePermission();
  const canAssign = canAssignTask();
  const isSelfAssignOnly = hasRole('developer') || hasRole('qa_tester') || hasRole('qa');

  const rawAssignableMembers = getAssignableMembers(members);
  const assignableMembers = canAssign ? rawAssignableMembers : [];
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);
  const [statusVersion, setStatusVersion] = useState(0);

  const defaultProjectId = preselectedProjectId || activeProject?._id || (projects.length > 0 ? projects[0]._id : '');

  const [form, setForm] = useState<TaskFormData>({
    title: '',
    projectId: defaultProjectId,
    description: '',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });

  // Fetch projects and members on mount/open
  useEffect(() => {
    if (isOpen && currentOrg) {
      fetchProjects(false);
      fetchWorkspaceMembers(currentOrg.id);
    }
  }, [isOpen, currentOrg, fetchProjects, fetchWorkspaceMembers]);

  useEffect(() => {
    if (isOpen && isSelfAssignOnly && user) {
      setForm((prev) => ({
        ...prev,
        assignedTo: user.id || user._id || ''
      }));
    } else if (isOpen && !isSelfAssignOnly) {
      setForm((prev) => ({
        ...prev,
        assignedTo: ''
      }));
    }
  }, [isOpen, isSelfAssignOnly, user]);

  // Adjust preselected project ID when projects load
  useEffect(() => {
    if (projects.length > 0 && !form.projectId) {
      setForm((prev) => ({
        ...prev,
        projectId: preselectedProjectId || activeProject?._id || projects[0]._id
      }));
    }
  }, [projects, preselectedProjectId, activeProject, form.projectId]);

  useEffect(() => {
    const handleProjectStatusesChanged = () => {
      setStatusVersion((version) => version + 1);
    };

    window.addEventListener(PROJECT_STATUS_CHANGED_EVENT, handleProjectStatusesChanged);
    return () => window.removeEventListener(PROJECT_STATUS_CHANGED_EVENT, handleProjectStatusesChanged);
  }, []);

  const selectedProject = projects.find((project) => project._id === form.projectId);
  const statusOptions = useMemo(
    () => getProjectTaskStatusOptions(selectedProject?.key, tasks, true),
    [selectedProject?.key, statusVersion, tasks]
  );

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Task title is required';
    if (!form.projectId) errs.projectId = 'Project selection is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      // Clean up empty optional fields
      const payload: TaskFormData = {
        title: form.title,
        projectId: form.projectId,
        description: form.description,
        type: form.type,
        status: form.status,
        priority: form.priority,
      };
      if (form.dueDate) payload.dueDate = form.dueDate;
      if (form.assignedTo) payload.assignedTo = form.assignedTo;

      await createTask(payload);
      showToast('Task created successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setErrors({});
        setShowAccessRestricted(true);
        return;
      }

      const msg = getFriendlyApiErrorMessage(err, 'We could not create that task. Please try again.');
      setErrors({ server: msg });
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Create Task</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable inputs wrapper */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {errors.server && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-150 rounded-lg text-xs text-red-650 dark:text-red-400">
                {errors.server}
              </div>
            )}

            {/* Project selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Project *
              </label>
              <select
                value={form.projectId}
                onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                className={`w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-500 ${
                  errors.projectId ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                required
              >
                <option value="" disabled>Select a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name} ({project.key})
                  </option>
                ))}
              </select>
              {errors.projectId && <p className="text-xs text-red-500 mt-1">{errors.projectId}</p>}
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Task Type
              </label>
              <select
                value={form.type || 'task'}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as TaskTypeType }))}
                className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-500"
              >
                <option value="task">📄 Task</option>
                <option value="bug">🐛 Bug</option>
                <option value="epic">⚡ Epic</option>
                <option value="story">📖 User Story</option>
                <option value="subtask">🔑 Subtask</option>
                <option value="improvement">📈 Improvement</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Task Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className={`w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                  errors.title ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="e.g. Design workspace header"
                required
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y"
                placeholder="Detail the tasks specifications, steps to reproduce, or notes..."
              />
            </div>

            {/* Grid: Status, Priority, Due date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as TaskStatusType }))}
                  className="w-full h-10 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.status} value={option.status}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as TaskPriorityType }))}
                  className="w-full h-10 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-500"
                />
              </div>
            </div>

            {/* Assignee */}
            {isSelfAssignOnly ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Assignee
                </label>
                <input
                  type="text"
                  disabled
                  value="Assigned to Me"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Assignee
                </label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {assignableMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-650 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
