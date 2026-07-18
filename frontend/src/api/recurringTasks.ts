import api from './axios';

export interface IRecurringTaskData {
  _id: string;
  organization: string;
  project: {
    _id: string;
    name: string;
  };
  title: string;
  description?: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number;
  assignee?: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  labels?: Array<{
    _id: string;
    name: string;
    color: string;
  }>;
  cronExpression: string;
  nextRunTime: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const createRecurringTask = async (payload: {
  projectId: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  estimatedTime?: number;
  assignee?: string;
  labels?: string[];
  cronExpression: string;
}): Promise<IRecurringTaskData> => {
  const { data } = await api.post('/recurring-tasks', payload);
  return data.data;
};

export const getRecurringTasks = async (projectId?: string): Promise<IRecurringTaskData[]> => {
  const params = projectId ? { projectId } : {};
  const { data } = await api.get('/recurring-tasks', { params });
  return data.data || [];
};

export const updateRecurringTask = async (
  templateId: string,
  payload: Partial<{
    title: string;
    description: string;
    type: string;
    priority: string;
    estimatedTime: number | null;
    assignee: string | null;
    labels: string[];
    isActive: boolean;
    cronExpression: string;
  }>
): Promise<IRecurringTaskData> => {
  const { data } = await api.put(`/recurring-tasks/${templateId}`, payload);
  return data.data;
};

export const deleteRecurringTask = async (templateId: string): Promise<void> => {
  await api.delete(`/recurring-tasks/${templateId}`);
};
