import { useState } from 'react';

// ─── Domain Union Types ───────────────────────────────────────────────────────

export type IssueType = 'Epic' | 'Story' | 'Task' | 'Bug';
export type IssuePriority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
export type IssueStatus = 'To Do' | 'In Progress' | 'Review' | 'Done';
export type SprintState = 'active' | 'future' | 'closed';

// ─── Domain Interfaces ────────────────────────────────────────────────────────

export interface MockProject {
  id: string;
  key: string;
  name: string;
  description: string;
  lead: string;
}

export interface MockUser {
  id: string;
  name: string;
  avatar: string;
}

export interface MockIssue {
  id: string;
  key: string;
  projectId: string;
  title: string;
  description: string;
  type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  assigneeId: string | null;
  reporterId: string | null;
  storyPoints: number;
  sprintId: string | null;
}

export interface MockSprint {
  id: string;
  projectId: string;
  name: string;
  state: SprintState;
  startDate: string;
  endDate: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const mockProjects: MockProject[] = [
  {
    id: 'p1',
    key: 'TASK',
    name: 'TaskBridge Overhaul',
    description: 'Rebuilding TaskBridge to look like Jira.',
    lead: 'Jules',
  },
  {
    id: 'p2',
    key: 'WEB',
    name: 'Website Redesign',
    description: 'Updating the marketing website.',
    lead: 'Alice',
  },
];

export const mockUsers: MockUser[] = [
  { id: 'u1', name: 'Jules', avatar: 'https://i.pravatar.cc/150?u=u1' },
  { id: 'u2', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=u2' },
  { id: 'u3', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=u3' },
];

export const mockIssues: MockIssue[] = [
  {
    id: 'i1',
    key: 'TASK-1',
    projectId: 'p1',
    title: 'Setup Next.js routing',
    description: 'We need to set up the app router with protected routes.',
    type: 'Story',
    priority: 'High',
    status: 'Done',
    assigneeId: 'u1',
    reporterId: 'u2',
    storyPoints: 5,
    sprintId: 's1',
  },
  {
    id: 'i2',
    key: 'TASK-2',
    projectId: 'p1',
    title: 'Create TopNavbar component',
    description: 'Global top navigation bar.',
    type: 'Task',
    priority: 'Medium',
    status: 'In Progress',
    assigneeId: 'u1',
    reporterId: 'u1',
    storyPoints: 3,
    sprintId: 's1',
  },
  {
    id: 'i3',
    key: 'TASK-3',
    projectId: 'p1',
    title: 'Implement drag and drop for Kanban',
    description: 'Use @hello-pangea/dnd to build the board.',
    type: 'Story',
    priority: 'Highest',
    status: 'To Do',
    assigneeId: null,
    reporterId: 'u1',
    storyPoints: 8,
    sprintId: 's1',
  },
  {
    id: 'i4',
    key: 'TASK-4',
    projectId: 'p1',
    title: 'Sidebar rendering bug',
    description: 'Sidebar does not collapse properly on mobile.',
    type: 'Bug',
    priority: 'High',
    status: 'Review',
    assigneeId: 'u3',
    reporterId: 'u2',
    storyPoints: 2,
    sprintId: 's1',
  },
  {
    id: 'i5',
    key: 'TASK-5',
    projectId: 'p1',
    title: 'Backlog page UI',
    description: 'Create the backlog view.',
    type: 'Story',
    priority: 'Medium',
    status: 'To Do',
    assigneeId: null,
    reporterId: 'u1',
    storyPoints: 5,
    sprintId: null,
  },
];

export const mockSprints: MockSprint[] = [
  {
    id: 's1',
    projectId: 'p1',
    name: 'Sprint 1',
    state: 'active',
    startDate: '2023-10-01',
    endDate: '2023-10-14',
  },
];

// ─── Hook Return Type ─────────────────────────────────────────────────────────

export interface UseProjectDataReturn {
  projects: MockProject[];
  issues: MockIssue[];
  sprints: MockSprint[];
  users: MockUser[];
  getProjectByKey: (key: string) => MockProject | undefined;
  getIssuesByProject: (projectId: string) => MockIssue[];
  getSprintsByProject: (projectId: string) => MockSprint[];
  updateIssue: (updatedIssue: MockIssue) => void;
  getUser: (userId: string) => MockUser | undefined;
  setIssues: React.Dispatch<React.SetStateAction<MockIssue[]>>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProjectData(): UseProjectDataReturn {
  const [projects, setProjects] = useState<MockProject[]>(mockProjects);
  const [issues, setIssues] = useState<MockIssue[]>(mockIssues);
  const [sprints, setSprints] = useState<MockSprint[]>(mockSprints);
  const [users, setUsers] = useState<MockUser[]>(mockUsers);

  // Suppress unused-variable warnings for setters not yet exposed
  void setProjects;
  void setSprints;
  void setUsers;

  const getProjectByKey = (key: string): MockProject | undefined =>
    projects.find((p) => p.key === key);

  const getIssuesByProject = (projectId: string): MockIssue[] =>
    issues.filter((i) => i.projectId === projectId);

  const getSprintsByProject = (projectId: string): MockSprint[] =>
    sprints.filter((s) => s.projectId === projectId);

  const updateIssue = (updatedIssue: MockIssue): void => {
    setIssues((prev) =>
      prev.map((i) => (i.id === updatedIssue.id ? updatedIssue : i)),
    );
  };

  const getUser = (userId: string): MockUser | undefined =>
    users.find((u) => u.id === userId);

  return {
    projects,
    issues,
    sprints,
    users,
    getProjectByKey,
    getIssuesByProject,
    getSprintsByProject,
    updateIssue,
    getUser,
    setIssues,
  };
}
