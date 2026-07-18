import axios from './axios';
import { ISprintData } from '../types/workspace';

/**
 * Get all sprints for a specific project
 */
export const getProjectSprints = async (projectId: string): Promise<ISprintData[]> => {
  const response = await axios.get(`/sprints/project/${projectId}`);
  return response.data.data;
};

/**
 * Create a new sprint in the project
 */
export const createSprint = async (projectId: string, payload: { name: string; goal?: string }): Promise<ISprintData> => {
  const response = await axios.post(`/sprints/project/${projectId}`, payload);
  return response.data.data;
};

/**
 * Start a planned sprint
 */
export const startSprint = async (sprintId: string, payload: { startDate: string; endDate: string }): Promise<ISprintData> => {
  const response = await axios.post(`/sprints/${sprintId}/start`, payload);
  return response.data.data;
};

/**
 * Complete an active sprint
 */
export const completeSprint = async (sprintId: string): Promise<ISprintData> => {
  const response = await axios.post(`/sprints/${sprintId}/complete`);
  return response.data.data;
};
