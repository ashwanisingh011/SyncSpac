'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProjects } from '../api/projects';
import { getProjectTasks } from '../api/tasks';
import { getProjectSprints } from '../api/sprints';
import { getWorkspaceMembers } from '../api/workspace';
import { useOrganization } from '@/context/useOrganization';
import { ITaskData, IProjectData, WorkspaceMember, ISprintData, TaskStatus } from '../types/workspace';
import { useSocket } from '@/hooks/useSocket';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

interface ProjectContextType {
    project: IProjectData | null;
    tasks: ITaskData[];
    sprints: ISprintData[];
    members: WorkspaceMember[];
    loading: boolean;
    loadingSprints: boolean;
    error: string | null;
    fetchProjectContext: () => Promise<void>;
    updateTaskStateInline: (taskId: string, updatedFields: Partial<ITaskData>) => void;
    updateMultipleTasksStateInline: (updates: Array<{ _id: string; fields: Partial<ITaskData> }>) => void;
    getMember: (userId: any) => WorkspaceMember | undefined;
}

const ProjectDataContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectDataProvider = ({ children, projectKey }: { children: React.ReactNode; projectKey: string }) => {
    const { currentOrg } = useOrganization();
    const [project, setProject] = useState<IProjectData | null>(null);
    const [tasks, setTasks] = useState<ITaskData[]>([]);
    const [sprints, setSprints] = useState<ISprintData[]>([]);
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSprints, setLoadingSprints] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { joinProject, useEventListener } = useSocket();

    const updateTaskStateInline = useCallback((taskId: string, updatedFields: Partial<ITaskData>) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) => (task._id === taskId ? { ...task, ...updatedFields } : task))
        );
    }, []);

    const updateMultipleTasksStateInline = useCallback((updates: Array<{ _id: string; fields: Partial<ITaskData> }>) => {
        setTasks((prevTasks) =>
            prevTasks.map((task) => {
                const update = updates.find((u) => u._id === task._id);
                return update ? { ...task, ...update.fields } : task;
            })
        );
    }, []);

    // 1. Join project room automatically when project is loaded
    useEffect(() => {
        if (project?._id) {
            joinProject(project._id);
        }
    }, [project?._id, joinProject]);

    // 2. Register real-time Socket.io listeners
    useEventListener('task:created', (newTask: ITaskData) => {
        if (project && newTask.project === project._id) {
            setTasks((prev) => {
                if (prev.some((t) => t._id === newTask._id)) return prev;
                return [...prev, newTask];
            });
        }
    });

    useEventListener('task:updated', (data: { taskId: string; changes: Partial<ITaskData> }) => {
        if (project) {
            updateTaskStateInline(data.taskId, data.changes);
        }
    });

    useEventListener('task:deleted', (data: { taskId: string }) => {
        if (project) {
            setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
        }
    });

    useEventListener('tasks:reordered', (data: { tasks: Array<{ _id: string; status: TaskStatus; sequence: number }> }) => {
        if (project && data.tasks) {
            updateMultipleTasksStateInline(
                data.tasks.map((t) => ({
                    _id: t._id,
                    fields: { status: t.status, sequence: t.sequence }
                }))
            );
        }
    });

    useEventListener('task:status_changed', (data: { taskId: string; status: TaskStatus; order: number }) => {
        if (project) {
            updateTaskStateInline(data.taskId, { status: data.status, sequence: data.order });
        }
    });

    useEventListener('sprint:started', () => {
        fetchProjectContext();
    });

    useEventListener('sprint:completed', () => {
        fetchProjectContext();
    });

    const getMember = useCallback((userId: any) => {
        if (!userId) return undefined;
        const id = typeof userId === 'object' && userId !== null ? (userId._id || userId.id) : userId;
        const found = members.find((m) => m.userId === id);
        if (found) return found;

        // If not found in members list, but userId is a populated user object, return a fallback WorkspaceMember-like object
        if (typeof userId === 'object' && userId !== null && (userId.name || userId.email)) {
            return {
                id: String(id),
                userId: String(id),
                workspaceId: '',
                name: userId.name || 'Unknown',
                email: userId.email || '',
                username: userId.username,
                avatarUrl: userId.avatarUrl ?? userId.avatar,
                role: 'Member',
                joinedAt: new Date().toISOString(),
                status: 'active',
            } as WorkspaceMember;
        }
        return undefined;
    }, [members]);

    const fetchProjectContext = useCallback(async () => {
        if (!projectKey) return;
        try {
            setLoading(true);
            
            // 1. Fetch all projects in organization to find the project matching projectKey
            const allProjects = await getProjects();
            const activeProject = allProjects.find(
                (p) => p.key.toUpperCase() === projectKey.toUpperCase()
            );

            if (!activeProject) {
                throw new Error(`Project with key "${projectKey}" not found`);
            }

            setProject(activeProject as unknown as IProjectData);

            // 2. Fetch workspace members if currentOrg exists
            if (currentOrg?.id) {
                try {
                    const workspaceMembers = await getWorkspaceMembers(currentOrg.id);
                    setMembers(workspaceMembers);
                } catch (memberErr) {
                    console.error('Error loading workspace members:', memberErr);
                }
            }

            // 3. Fetch tasks corresponding to the retrieved project ObjectId
            const projectTasks = await getProjectTasks(activeProject._id);
            setTasks(projectTasks);
            
            // 4. Fetch sprints corresponding to the retrieved project ObjectId
            const projectSprints = await getProjectSprints(activeProject._id);
            setSprints(projectSprints);
            setLoadingSprints(false);

            setError(null);
        } catch (err: any) {
            console.error('Error loading project context:', err);
            setError(getFriendlyApiErrorMessage(err, 'We could not load project details. Please try again.'));
        } finally {
            setLoading(false);
        }
    }, [projectKey, currentOrg]);



    useEffect(() => {
        fetchProjectContext();
    }, [fetchProjectContext]);

    return (
        <ProjectDataContext.Provider value={{ project, tasks, sprints, members, loading, loadingSprints, error, fetchProjectContext, updateTaskStateInline, updateMultipleTasksStateInline, getMember }}>
            {children}
        </ProjectDataContext.Provider>
    );
};

export const useProjectData = () => {
    const context = useContext(ProjectDataContext);
    if (!context) throw new Error('useProjectData must be wrapped within a <ProjectDataProvider />');
    return context;
};
