'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTaskBridgeStore } from '@/store/useTaskBridgeStore';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import { Task, TaskStatusType, TaskPriorityType, TaskTypeType } from '@/types/tasks';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import {
  X,
  Loader2,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  User,
  Shield,
  Save,
  Edit2
} from 'lucide-react';
import { getAssignableMembers } from '@/lib/assignableMembers';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import { isAccessRestrictedError } from '@/lib/accessErrors';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';
import { formatTaskStatusLabel, getProjectTaskStatusOptions } from '@/lib/taskStatus';

interface TaskDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onSuccess?: () => void;
}

export default function TaskDetailsDrawer({
  isOpen,
  onClose,
  task,
  onSuccess
}: TaskDetailsDrawerProps) {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { canEditTask, canDeleteTask, canAssignTask, canChangeTaskStatus, getPermissionLevel, hasRole } = usePermission();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const {
    projects,
    tasks,
    members,
    fetchWorkspaceMembers,
    updateTask,
    deleteTask
  } = useTaskBridgeStore();
  const canAssign = canAssignTask();

  const rawAssignableMembers = getAssignableMembers(members);
  const assignableMembers = canAssign ? rawAssignableMembers : [];

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);
  const projectId = typeof task.project === 'object' ? task.project._id : task.project;
  const projectKey = typeof task.project === 'object'
    ? task.project.key
    : projects.find((project) => project._id === projectId)?.key;
  const statusOptions = useMemo(
    () => getProjectTaskStatusOptions(projectKey, tasks, true),
    [projectKey, tasks]
  );

  // Form states
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState<TaskStatusType>(task.status);
  const [priority, setPriority] = useState<TaskPriorityType>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [assignedTo, setAssignedTo] = useState(
    task.assignedTo
      ? typeof task.assignedTo === 'object'
        ? task.assignedTo._id
        : task.assignedTo
      : ''
  );

  // Sync state if task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setAssignedTo(
      task.assignedTo
        ? typeof task.assignedTo === 'object'
          ? task.assignedTo._id
          : task.assignedTo
        : ''
    );
    setIsEditing(false);
    setErrors({});
  }, [task, isOpen]);

  // Load members
  useEffect(() => {
    if (isOpen && currentOrg && members.length === 0) {
      fetchWorkspaceMembers(currentOrg.id);
    }
  }, [isOpen, currentOrg, members.length, fetchWorkspaceMembers]);

  if (!isOpen) return null;

  // Resolve assignedTo ID vs user ID

  const editLevel = getPermissionLevel('edit_task');
  const canEditAll = editLevel === 'ALLOW';
  const canEditOwn = editLevel === 'OWN' && canEditTask(task);
  const canEditStatusOnly =
    !canEditAll &&
    !canEditOwn &&
    canChangeTaskStatus(task);
  const canUpdate = canEditAll || canEditOwn || canEditStatusOnly;
  const canDelete = canDeleteTask();


  const handleDelete = async () => {
    if (!canDelete) {
      showToast('You do not have permission to delete tasks.', 'error');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    setDeleting(true);
    try {
      await deleteTask(task._id);
      showToast('Task deleted successfully.', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }

      showToast(getFriendlyApiErrorMessage(err, 'We could not delete that task. Please try again.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate) {
      showToast('You do not have permission to update this task.', 'error');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload: Record<string, any> = {};

      if (canEditAll || canEditOwn) {
        payload.title = title;
        payload.description = description;
        payload.status = status;
        payload.priority = priority;
        payload.dueDate = dueDate || null;
        if (canAssign) {
          payload.assignedTo = assignedTo || null;
        }
      } else if (canEditStatusOnly) {
        // Team member can only change status
        payload.status = status;
      }

      await updateTask(task._id, payload);
      showToast('Task updated successfully!', 'success');
      setIsEditing(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setErrors({});
        setShowAccessRestricted(true);
        return;
      }

      const msg = getFriendlyApiErrorMessage(err, 'We could not update that task. Please try again.');
      setErrors({ server: msg });
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 border-l border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
              {task.taskKey}
            </span>
            <span className="text-[10px] text-slate-400">Task details</span>
          </div>

          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                title="Delete task"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                ) : (
                  <Trash2 className="w-4.5 h-4.5" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Permission Info */}
          {!canUpdate && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Read-Only View</span>
                <p className="mt-0.5 leading-relaxed">
                  Only assigned members can update this task's status. Project managers or admins can edit all details.
                </p>
              </div>
            </div>
          )}

          {canEditStatusOnly && !isEditing && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-[11px] text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Limited Edit Permissions</span>
                <p className="mt-0.5 leading-relaxed">
                  You are the assignee. You can adjust the task status indicator below.
                </p>
              </div>
            </div>
          )}

          {errors.server && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
              {errors.server}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleUpdate} className="space-y-5">
            
            {/* Title - Edit / View */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Title
              </label>
              {isEditing && canEditAll ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                  required
                />
              ) : (
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 leading-snug">
                  {task.title}
                </h3>
              )}
            </div>

            {/* Description - Edit / View */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Description
              </label>
              {isEditing && canEditAll ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] p-3 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-y"
                  placeholder="Describe the task details..."
                />
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800 min-h-[60px] whitespace-pre-wrap leading-relaxed">
                  {task.description || <span className="text-slate-400 italic">No description provided.</span>}
                </p>
              )}
            </div>

            {/* Task Type - Read-only badge */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Type
              </label>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {task.type === 'bug' ? '🐛' : task.type === 'epic' ? '⚡' : task.type === 'story' ? '📖' : task.type === 'subtask' ? '🔑' : task.type === 'improvement' ? '📈' : '📄'}
                {(task.type || 'task').charAt(0).toUpperCase() + (task.type || 'task').slice(1)}
              </span>
            </div>

            {/* Task Controls Row */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              
              {/* Status Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Status
                </label>
                {(isEditing && canEditAll) || canEditStatusOnly ? (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatusType)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250 outline-none"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.status} value={option.status}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`inline-block text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                      task.status === 'done'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : task.status === 'in-progress'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                        : task.status === 'review'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400'
                        : task.status === 'testing'
                        ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/20 dark:text-cyan-400'
                        : task.status === 'blocked'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        : task.status === 'backlog'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                    }`}
                  >
                    {formatTaskStatusLabel(task.status)}
                  </span>
                )}
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Priority
                </label>
                {isEditing && canEditAll ? (
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriorityType)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : (
                  <span
                    className={`inline-block text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        : task.priority === 'medium'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-450'
                    }`}
                  >
                    {task.priority}
                  </span>
                )}
              </div>
            </div>

            {/* Assignee & Dates Details */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              
              {/* Assignee */}
              <div className="flex items-center justify-between">
                <span className="text-slate-450 font-medium">Assignee</span>
                {isEditing && canEditAll && !hasRole('developer') && !hasRole('qa_tester') && !hasRole('qa') ? (
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {assignableMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-slate-700 dark:text-slate-350">
                    {task.assignedTo
                      ? typeof task.assignedTo === 'object'
                        ? task.assignedTo.name
                        : task.assignedTo
                      : 'Unassigned'}
                  </span>
                )}
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between">
                <span className="text-slate-450 font-medium">Due Date</span>
                {isEditing && canEditAll ? (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250 outline-none"
                  />
                ) : (
                  <span className="font-semibold text-slate-650 dark:text-slate-400">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'None'}
                  </span>
                )}
              </div>

              {/* Creator */}
              <div className="flex items-center justify-between">
                <span className="text-slate-450 font-medium">Created By</span>
                <span className="font-semibold text-slate-650 dark:text-slate-400">
                  {typeof task.createdBy === 'object' ? task.createdBy.name : 'Unknown User'}
                </span>
              </div>

              {/* Assigned By */}
              {task.assignedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-450 font-medium">Assigned By</span>
                  <span className="font-semibold text-slate-650 dark:text-slate-400">
                    {typeof task.assignedBy === 'object'
                      ? (task.assignedBy as { name?: string }).name ?? 'Unknown'
                      : task.assignedBy}
                  </span>
                </div>
              )}

              {/* Project */}
              {task.project && typeof task.project === 'object' && (task.project as { name?: string }).name && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-450 font-medium">Project</span>
                  <span className="font-semibold text-slate-650 dark:text-slate-400">
                    {(task.project as { name?: string }).name}
                  </span>
                </div>
              )}

              {/* Checklist Progress */}
              {task.checklist && task.checklist.length > 0 && (() => {
                const total = task.checklist.length;
                const done = task.checklist.filter((item: any) => item.isCompleted).length;
                const pct = Math.round((done / total) * 100);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-450 font-medium">Checklist</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{done}/{total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{pct}% complete</p>
                  </div>
                );
              })()}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
              
              {/* Edit Mode Toggle */}
              {!isEditing && canEditAll && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Details
                </button>
              )}

              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset inputs
                    setTitle(task.title);
                    setDescription(task.description || '');
                    setStatus(task.status);
                    setPriority(task.priority);
                    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
                    setAssignedTo(task.assignedTo ? (typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo) : '');
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}

              {/* Save changes */}
              {(isEditing || canEditStatusOnly) && (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
