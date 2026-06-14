// src/types/index.ts

export type TaskStatus = 'todo' | 'inProgress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignedTo?: User;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  workspaceId: string;
  columns: {
    todo: Task[];
    inProgress: Task[];
    done: Task[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  _id: string;
  name: string;
  owner: string | User;
  members: string[] | User[];
  projects: string[] | Project[];
}