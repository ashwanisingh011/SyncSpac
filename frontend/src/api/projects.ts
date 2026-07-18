import api from './axios';
import { Project, ProjectFormData } from '@/types/projects';
import type { WorkspaceMember } from '@/types/workspace';

export type ProjectMember = WorkspaceMember & {
  assignedTaskCount: number;
  projectRole?: string;
};

export const getProjects = async (archived = false, allOrganizations = false): Promise<Project[]> => {
  const { data } = await api.get('/projects', {
    params: {
      archived: archived.toString(),
      ...(allOrganizations ? { allOrganizations: 'true' } : {})
    }
  });
  return data.data;
};

export const createProject = async (payload: ProjectFormData): Promise<Project> => {
  const { data } = await api.post('/projects', payload);
  return data.data;
};

export const getProjectById = async (projectId: string): Promise<Project> => {
  const { data } = await api.get(`/projects/${projectId}`);
  return data.data;
};

export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return Array.isArray(data.data) ? data.data : [];
};

export const updateProject = async (
  projectId: string,
  payload: Partial<ProjectFormData> & { status?: string }
): Promise<Project> => {
  const { data } = await api.put(`/projects/${projectId}`, payload);
  return data.data;
};

export const archiveProject = async (projectId: string): Promise<Project> => {
  const { data } = await api.patch(`/projects/${projectId}/archive`);
  return data.data;
};

export const assignUserToProject = async (
  projectId: string,
  userId: string,
  role: string
): Promise<any> => {
  const { data } = await api.post(`/projects/${projectId}/assign`, { userId, role });
  return data.data;
};

export const removeUserFromProject = async (
  projectId: string,
  userId: string
): Promise<void> => {
  await api.delete(`/projects/${projectId}/members/${userId}`);
};
