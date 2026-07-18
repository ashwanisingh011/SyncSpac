import api from './axios';

export interface ISearchResults {
  projects: any[];
  tasks: any[];
  users: any[];
}

/**
 * Perform a global search across projects, tasks, and users in the organization
 */
export const globalSearch = async (query: string) => {
  const response = await api.get<{ success: boolean; data: ISearchResults }>('/search', {
    params: { q: query }
  });
  return response.data;
};
