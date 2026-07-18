import api from './axios';
import type { ITaskData } from '@/types/workspace';

/**
 * POST /api/tasks
 * Create a new task.
 */
export const createTask = async (payload: {
  title: string;
  projectId: string;
  description?: string;
  type?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  estimatedTime?: number;
  assignedTo?: string;
  labels?: string[];
}): Promise<ITaskData> => {
  const { data } = await api.post('/tasks', payload);
  return data.data;
};

/**
 * GET /api/tasks/project/:projectId
 * Fetch all tasks associated with a project.
 */
export const getProjectTasks = async (projectId: string): Promise<ITaskData[]> => {
  const { data } = await api.get(`/tasks/project/${projectId}`);
  return data.data || [];
};

/**
 * GET /api/tasks/:taskIdentifier
 * Fetch a task by its MongoDB ID or task key (e.g. TASK-1).
 */
export const getTaskById = async (taskIdentifier: string): Promise<ITaskData> => {
  const { data } = await api.get(`/tasks/${taskIdentifier}`);
  return data.data;
};

/**
 * PUT /api/tasks/:id
 * Update task configuration.
 */
export const updateTask = async (
  taskId: string,
  payload: Partial<ITaskData>
): Promise<ITaskData> => {
  const { data } = await api.put(`/tasks/${taskId}`, payload);
  return data.data;
};

/**
 * DELETE /api/tasks/:id
 * Delete a task.
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}`);
};

/**
 * POST /api/tasks/reorder
 * Reorder board/backlog task sequences.
 */
export const reorderTasks = async (
  tasks: Array<{ _id: string; status: string; sequence: number }>
): Promise<void> => {
  await api.post('/tasks/reorder', { tasks });
};

// ─── Watchers ─────────────────────────────────────────────────────────────────

export const watchTask = async (taskId: string): Promise<ITaskData> => {
  const { data } = await api.post(`/tasks/${taskId}/watch`);
  return data.data;
};

export const unwatchTask = async (taskId: string): Promise<ITaskData> => {
  const { data } = await api.post(`/tasks/${taskId}/unwatch`);
  return data.data;
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface ICommentData {
  _id: string;
  task: string;
  author: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
  };
  content: string;
  reactions?: Array<{
    userId: {
      _id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      avatar?: string;
    };
    emoji: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ITimeLogsResponse {
  logs: ITimeLogData[];
  totalLoggedMinutes: number;
}

export const logTime = async (
  taskId: string,
  payload: { duration: number; description?: string; loggedAt?: string }
): Promise<ITimeLogData> => {
  const { data } = await api.post(`/tasks/${taskId}/time-logs`, payload);
  return data.data;
};

export const getTaskTimeLogs = async (taskId: string): Promise<ITimeLogsResponse> => {
  const { data } = await api.get(`/tasks/${taskId}/time-logs`);
  return data.data || { logs: [], totalLoggedMinutes: 0 };
};

export const createComment = async (
  taskId: string,
  content: string
): Promise<ICommentData> => {
  const { data } = await api.post(`/tasks/${taskId}/comments`, { content });
  return data.data;
};

export const getTaskComments = async (taskId: string): Promise<ICommentData[]> => {
  const { data } = await api.get(`/tasks/${taskId}/comments`);
  return data.data || [];
};

export const updateComment = async (
  taskId: string,
  commentId: string,
  content: string
): Promise<ICommentData> => {
  const { data } = await api.put(`/tasks/${taskId}/comments/${commentId}`, { content });
  return data.data;
};

export const deleteComment = async (taskId: string, commentId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}/comments/${commentId}`);
};

export const toggleCommentReaction = async (
  taskId: string,
  commentId: string,
  emoji: string
): Promise<ICommentData> => {
  const { data } = await api.post(`/tasks/${taskId}/comments/${commentId}/react`, { emoji });
  return data.data;
};

// ─── Checklist ────────────────────────────────────────────────────────────────

export interface IChecklistItem {
  _id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const addChecklistItem = async (
  taskId: string,
  title: string
): Promise<IChecklistItem> => {
  const { data } = await api.post(`/tasks/${taskId}/checklist`, { title });
  return data.data;
};

export const updateChecklistItem = async (
  taskId: string,
  itemId: string,
  payload: { title?: string; isCompleted?: boolean }
): Promise<IChecklistItem> => {
  const { data } = await api.put(`/tasks/${taskId}/checklist/${itemId}`, payload);
  return data.data;
};

export const deleteChecklistItem = async (
  taskId: string,
  itemId: string
): Promise<void> => {
  await api.delete(`/tasks/${taskId}/checklist/${itemId}`);
};

// ─── Time Logs ────────────────────────────────────────────────────────────────

export interface ITimeLogData {
  _id: string;
  task: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  duration: number;
  description?: string;
  loggedAt: string;
}

export const deleteTimeLog = async (taskId: string, logId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}/time-logs/${logId}`);
};

// ─── History ──────────────────────────────────────────────────────────────────

export interface IHistoryData {
  _id: string;
  task: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  action: 'create' | 'update' | 'delete' | 'comment' | 'attachment';
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export const getTaskHistory = async (taskId: string): Promise<IHistoryData[]> => {
  const { data } = await api.get(`/tasks/${taskId}/history`);
  return data.data || [];
};

// ─── Attachments ──────────────────────────────────────────────────────────────

export interface IAttachmentData {
  _id: string;
  task: string;
  uploadedBy: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
  };
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export const createAttachment = async (
  taskId: string,
  file: File
): Promise<IAttachmentData> => {
  const formData = new FormData();
  formData.append('attachment', file);
  const { data } = await api.post(`/tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const getTaskAttachments = async (taskId: string): Promise<IAttachmentData[]> => {
  const { data } = await api.get(`/tasks/${taskId}/attachments`);
  return data.data || [];
};

export const deleteAttachment = async (taskId: string, attachmentId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
};

// ─── Dependencies ─────────────────────────────────────────────────────────────

export interface IDependencyData {
  _id: string;
  task: {
    _id: string;
    taskKey: string;
    title: string;
    status: string;
  };
  dependsOn: {
    _id: string;
    taskKey: string;
    title: string;
    status: string;
  };
  type: 'blocks' | 'blocked-by';
  createdBy: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const addDependency = async (
  taskId: string,
  payload: { dependsOn: string; type: 'blocks' | 'blocked-by' }
): Promise<IDependencyData> => {
  const { data } = await api.post(`/tasks/${taskId}/dependencies`, payload);
  return data.data;
};

export const getTaskDependencies = async (taskId: string): Promise<IDependencyData[]> => {
  const { data } = await api.get(`/tasks/${taskId}/dependencies`);
  return data.data || [];
};

export const removeDependency = async (
  taskId: string,
  dependencyId: string
): Promise<void> => {
  await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
};

