import api from './axios';

export interface IDepartmentData {
  _id: string;
  orgId: string;
  name: string;
  head?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentFormData {
  name: string;
  head?: string;
  memberCount?: number;
}

export const getDepartments = async (): Promise<IDepartmentData[]> => {
  const { data } = await api.get('/departments');
  return data.data;
};

export const createDepartment = async (payload: DepartmentFormData): Promise<IDepartmentData> => {
  const { data } = await api.post('/departments', payload);
  return data.data;
};

export const updateDepartment = async (deptId: string, payload: Partial<DepartmentFormData>): Promise<IDepartmentData> => {
  const { data } = await api.patch(`/departments/${deptId}`, payload);
  return data.data;
};

export const deleteDepartment = async (deptId: string): Promise<any> => {
  const { data } = await api.delete(`/departments/${deptId}`);
  return data.data;
};
