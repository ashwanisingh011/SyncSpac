export type TaskStatusType = string;
export type TaskPriorityType = 'low' | 'medium' | 'high';
export type TaskTypeType = 'task' | 'bug' | 'epic' | 'story' | 'subtask' | 'improvement';

export interface ChecklistItem {
  _id: string;
  title: string;
  isCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  type?: TaskTypeType;
  status: TaskStatusType;
  priority: TaskPriorityType;
  project: string | { _id: string; name: string; key: string };
  organization: string;
  taskKey: string;
  sequence: number;
  dueDate?: string;
  assignedTo?: string | { _id: string; name: string; email: string; avatar?: string };
  assignedBy?: string | { _id: string; name: string; email: string; avatar?: string };
  createdBy: string | { _id: string; name: string; email: string };
  labels?: string[] | Array<{ _id: string; name: string; color: string }>;
  checklist?: ChecklistItem[];
  watchers?: string[];
  estimatedTime?: number;
  storyPoints?: number;
  sprintId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormData {
  title: string;
  projectId: string;
  description?: string;
  type?: TaskTypeType;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  dueDate?: string;
  assignedTo?: string; // userId
}

