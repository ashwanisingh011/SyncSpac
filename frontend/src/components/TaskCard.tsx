"use client";

import api from '../api/axios';
import type { AxiosError } from 'axios';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

// ─── Task type (used by both TaskCard and TaskModal) ─────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-primary-subtle text-primary',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  refreshTasks?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TaskCard = ({ task, onEdit, refreshTasks }: TaskCardProps): React.JSX.Element => {
  const { showToast } = useToast();
  const confirm = useConfirm();
  let isOverdue = false;
  let daysRemaining: number | null = null;

  if (task.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);

    if (due < today) {
      isOverdue = true;
    } else {
      const diffTime = due.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }

  const handleDelete = async (): Promise<void> => {
    const isConfirmed = await confirm({
      title: 'Delete Task',
      message: 'Delete this task?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (isConfirmed) {
      try {
        await api.delete(`/tasks/${task._id}`);
        refreshTasks?.();
      } catch (err) {
        const axiosErr = err as AxiosError;
        console.error('Failed to delete task:', axiosErr.message);
        showToast(getFriendlyApiErrorMessage(axiosErr, 'We could not delete that task. Please try again.'), 'error');
      }
    }
  };

  return (
    <div className={`bg-surface rounded-lg shadow-sm border ${isOverdue ? 'border-red-500' : 'border-line'} p-4 flex flex-col gap-2 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-content leading-snug flex-1">{task.title}</h3>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${PRIORITY_COLORS[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-content-tertiary line-clamp-2">{task.description}</p>
      )}

      {isOverdue && (
        <p className="text-xs font-bold text-danger">OVERDUE</p>
      )}
      {daysRemaining !== null && (
        <p className="text-xs text-content-tertiary">Due in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</p>
      )}

      {task.status && (
        <p className="text-xs text-content-tertiary capitalize">{task.status}</p>
      )}

      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onEdit(task)}
          className="text-xs text-primary hover:underline"
        >
          Edit
        </button>
        <span className="text-content-tertiary">|</span>
        <button
          onClick={handleDelete}
          className="text-xs text-danger hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
