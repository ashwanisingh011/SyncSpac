import api from './axios';

export interface ITeamData {
  _id: string;
  orgId: string;
  name: string;
  description?: string;
  lead?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | string;
  members: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | string>;
  projectIds: Array<{
    _id: string;
    name: string;
    key?: string;
    description?: string;
  } | string>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamFormData {
  name: string;
  description?: string;
  lead?: string;
  members?: string[];
  projectIds?: string[];
}

export const getTeams = async (): Promise<ITeamData[]> => {
  const { data } = await api.get('/teams');
  return data.data;
};

export const getTeamById = async (teamId: string): Promise<ITeamData> => {
  const { data } = await api.get(`/teams/${teamId}`);
  return data.data;
};

export const createTeam = async (payload: TeamFormData): Promise<ITeamData> => {
  const { data } = await api.post('/teams', payload);
  return data.data;
};

export const updateTeam = async (teamId: string, payload: Partial<TeamFormData>): Promise<ITeamData> => {
  const { data } = await api.patch(`/teams/${teamId}`, payload);
  return data.data;
};

export const deleteTeam = async (teamId: string): Promise<any> => {
  const { data } = await api.delete(`/teams/${teamId}`);
  return data.data;
};

export const addTeamMember = async (teamId: string, userId: string): Promise<ITeamData> => {
  const { data } = await api.post(`/teams/${teamId}/members`, { userId });
  return data.data;
};

export const removeTeamMember = async (teamId: string, userId: string): Promise<ITeamData> => {
  const { data } = await api.delete(`/teams/${teamId}/members/${userId}`);
  return data.data;
};
