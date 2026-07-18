export type ProjectType = 'software' | 'marketing' | 'hr' | 'client';
export type ProjectVisibility = 'public' | 'private';
export type ProjectStatusType = 'active' | 'on-hold' | 'completed';
export type ProjectLayoutType = 'kanban' | 'list' | 'calendar' | 'timeline';

export interface Project {
  _id: string;
  name: string;
  key: string;
  description: string;
  logo?: string;
  projectType: ProjectType;
  visibility: ProjectVisibility;
  isArchived: boolean;
  status: ProjectStatusType;
  organization: string;
  owner: string | { _id: string; name: string; email: string };
  taskCount: number;
  defaultLayout: ProjectLayoutType;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormData {
  name: string;
  key: string;
  description?: string;
  logo?: string;
  projectType?: ProjectType;
  visibility?: ProjectVisibility;
  defaultLayout?: ProjectLayoutType;
}
