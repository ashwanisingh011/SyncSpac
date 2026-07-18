import api from './axios';

export interface IBurndownDay {
  day: string;
  remainingPoints: number;
  idealPoints: number;
}

export interface IVelocitySprint {
  sprintName: string;
  planned: number;
  completed: number;
}

/**
 * Fetch Sprint Burndown data
 */
export const getSprintBurndown = async (sprintId: string) => {
  const response = await api.get<{ success: boolean; data: IBurndownDay[] }>(`/reports/sprints/${sprintId}/burndown`);
  return response.data;
};

/**
 * Fetch Project Velocity data
 */
export const getProjectVelocity = async (projectId: string) => {
  const response = await api.get<{ success: boolean; data: IVelocitySprint[] }>(`/reports/projects/${projectId}/velocity`);
  return response.data;
};
