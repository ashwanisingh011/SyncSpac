import api from './axios';

// ─── Label Types ──────────────────────────────────────────────────────────────

export interface ILabelData {
  _id: string;
  name: string;
  color: string;
  organization: string;
  project?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Label CRUD (org/project level) ──────────────────────────────────────────

export const createLabel = async (payload: {
  name: string;
  color?: string;
  projectId?: string;
}): Promise<ILabelData> => {
  const { data } = await api.post('/labels', payload);
  return data.data;
};

export const getLabels = async (projectId?: string): Promise<ILabelData[]> => {
  const params = projectId ? { projectId } : {};
  const { data } = await api.get('/labels', { params });
  return data.data || [];
};

export const updateLabel = async (
  labelId: string,
  payload: { name?: string; color?: string }
): Promise<ILabelData> => {
  const { data } = await api.put(`/labels/${labelId}`, payload);
  return data.data;
};

export const deleteLabel = async (labelId: string): Promise<void> => {
  await api.delete(`/labels/${labelId}`);
};

// ─── Attach / Detach labels on tasks ─────────────────────────────────────────

export const attachLabelToTask = async (
  taskId: string,
  labelId: string
): Promise<any> => {
  const { data } = await api.post(`/tasks/${taskId}/labels`, { labelId });
  return data.data;
};

export const detachLabelFromTask = async (
  taskId: string,
  labelId: string
): Promise<any> => {
  const { data } = await api.delete(`/tasks/${taskId}/labels`, {
    data: { labelId },
  });
  return data.data;
};
