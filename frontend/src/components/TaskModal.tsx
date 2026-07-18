"use client";

import { useState, useEffect, useMemo } from 'react';
import { useProjectData } from '@/context/projectDataContext';
import api from '../api/axios';
import type { AxiosError } from 'axios';
import type { TaskStatus, TaskType, ITaskData } from '@/types/workspace';
import { formatMemberRole, getAssignableMembers } from '@/lib/assignableMembers';
import { usePermission } from '@/hooks/usePermission';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import { isAccessRestrictedError } from '@/lib/accessErrors';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';
import { getProjectTaskStatusOptions } from '@/lib/taskStatus';

interface TaskForm {
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  type: TaskType;
  estimatedTime: number | '';
  dueDate: string;
  assignedTo: string;
  storyPoints: number | '';
  sprintId: string;
}

const initialForm: TaskForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  type: 'task',
  estimatedTime: '',
  dueDate: '',
  assignedTo: '',
  storyPoints: '',
  sprintId: '',
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: ITaskData | null;
  refreshTasks?: () => void;
}

const TaskModal = ({ isOpen, onClose, taskToEdit, refreshTasks }: TaskModalProps): React.JSX.Element | null => {
  const { project, tasks, members, sprints } = useProjectData();
  const { canAssignTask, hasRole, user } = usePermission();
  const canAssign = canAssignTask();
  const isSelfAssignOnly = hasRole('developer') || hasRole('qa_tester') || hasRole('qa');

  const rawAssignableMembers = getAssignableMembers(members);
  const assignableMembers = canAssign ? rawAssignableMembers : [];
  const [form, setForm] = useState<TaskForm>(initialForm);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);
  const statusOptions = useMemo(
    () => getProjectTaskStatusOptions(project?.key, tasks, true),
    [project?.key, tasks]
  );

  useEffect(() => {
    if (taskToEdit) {
      setForm({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        status: taskToEdit.status || 'todo',
        priority: taskToEdit.priority || 'medium',
        type: taskToEdit.type || 'task',
        estimatedTime: taskToEdit.estimatedTime ?? '',
        dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '',
        assignedTo: taskToEdit.assignedTo || '',
        storyPoints: taskToEdit.storyPoints ?? '',
        sprintId: taskToEdit.sprintId || '',
      });
    } else {
      setForm({
        ...initialForm,
        assignedTo: isSelfAssignOnly && user ? (user.id || user._id || '') : '',
      });
    }
    setError('');
  }, [taskToEdit, isOpen, isSelfAssignOnly, user]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'estimatedTime' || name === 'storyPoints' ? (value === '' ? '' : Math.max(0, parseInt(value, 10))) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.dueDate) {
        delete payload.dueDate;
      }
      if (payload.estimatedTime === '') {
        payload.estimatedTime = 0;
      }
      if (payload.storyPoints === '') {
        payload.storyPoints = 0;
      }
      if (!payload.assignedTo) {
        delete payload.assignedTo;
      }
      if (!payload.sprintId) {
        delete payload.sprintId;
      }

      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit._id}`, payload);
      } else {
        if (project) {
          payload.projectId = project._id;
        }
        await api.post('/tasks', payload);
      }
      refreshTasks?.();
      onClose();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      if (isAccessRestrictedError(axiosErr)) {
        setError('');
        setShowAccessRestricted(true);
        return;
      }

      setError(getFriendlyApiErrorMessage(axiosErr, 'We could not save that task. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {taskToEdit ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none dark:hover:text-white cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Task Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="task">Task 📄</option>
              <option value="bug">Bug 🐛</option>
              <option value="epic">Epic ⚡</option>
              <option value="story">User Story 📖</option>
              <option value="subtask">Subtask 🔑</option>
              <option value="improvement">Improvement 📈</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Optional description"
            />
          </div>

          {isSelfAssignOnly ? (
            <div>
              <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Assignee</label>
              <input
                type="text"
                disabled
                value={taskToEdit ? (taskToEdit.assignedTo === (user?.id || user?._id) ? "Assigned to Me" : "Assigned to Other") : "Assigned to Me"}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-500 dark:text-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Assignee</label>
              <select
                name="assignedTo"
                value={form.assignedTo}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Unassigned</option>
                {assignableMembers.map((m) => (
                  <option key={m.id} value={m.userId}>
                    {m.name} ({formatMemberRole(m.role, m.roleName)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Original Estimate (min)</label>
              <input
                type="number"
                name="estimatedTime"
                min="0"
                value={form.estimatedTime}
                onChange={handleChange}
                placeholder="e.g. 180"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Sprint</label>
              <select
                name="sprintId"
                value={form.sprintId}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Backlog</option>
                {sprints?.filter(s => s.status === 'active' || s.status === 'planned').map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Story Points</label>
              <input
                type="number"
                name="storyPoints"
                min="0"
                value={form.storyPoints}
                onChange={handleChange}
                placeholder="e.g. 5"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.status} value={option.status}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-slate-200 text-slate-700 mb-1">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-700 border border-slate-300 dark:text-slate-200 rounded hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Saving…' : taskToEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
