"use client";

import { useEffect, useState, use } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import BacklogList from '@/components/BacklogList';
import TaskModal from '@/components/TaskModal';
import { CreateSprintModal, StartSprintModal, CompleteSprintModal } from '@/components/SprintModals';
import { useProjectData } from '@/context/projectDataContext';
import { updateTask, reorderTasks } from '@/api/tasks';
import { createSprint, startSprint, completeSprint } from '@/api/sprints';
import { Search, Loader2 } from 'lucide-react';
import type { ITaskData, TaskStatus, ISprintData } from '@/types/workspace';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/context/useToast';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import { isAccessRestrictedError } from '@/lib/accessErrors';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

interface BacklogPageProps {
  params: Promise<{ projectKey: string }>;
}

export default function BacklogPageContent({ projectKey, issueUrlPrefix }: { projectKey: string; issueUrlPrefix?: string }): React.JSX.Element {

  const { project, tasks, sprints, loading, loadingSprints, error, updateMultipleTasksStateInline, fetchProjectContext } = useProjectData();
  const { hasPermission } = usePermission();
  const { showToast } = useToast();
  const canCreateTask = hasPermission('create_task');
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [startSprintData, setStartSprintData] = useState<ISprintData | null>(null);
  const [completeSprintData, setCompleteSprintData] = useState<ISprintData | null>(null);
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);

  const handleCreateSprint = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSprintSubmit = async (name: string) => {
    if (!project) return;
    try {
      await createSprint(project._id, { name });
      fetchProjectContext();
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }
      showToast(getFriendlyApiErrorMessage(err, 'We could not create that sprint. Please try again.'), 'error');
    }
  };

  const handleStartSprint = (sprintId: string) => {
    const activeExists = sprints.some(s => s.status === 'active');
    if (activeExists) {
      showToast('Another sprint is already active. Complete it first.', 'error');
      return;
    }
    const sprint = sprints.find(s => s._id === sprintId) || null;
    setStartSprintData(sprint);
  };

  const handleStartSprintSubmit = async (startDateStr: string, endDateStr: string) => {
    if (!startSprintData) return;
    try {
      await startSprint(startSprintData._id, { startDate: startDateStr, endDate: endDateStr });
      fetchProjectContext();
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }
      showToast(getFriendlyApiErrorMessage(err, 'We could not start that sprint. Please try again.'), 'error');
    }
  };

  const handleCompleteSprint = (sprintId: string) => {
    const sprint = sprints.find(s => s._id === sprintId) || null;
    setCompleteSprintData(sprint);
  };

  const handleCompleteSprintSubmit = async () => {
    if (!completeSprintData) return;
    try {
      await completeSprint(completeSprintData._id);
      fetchProjectContext();
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }
      showToast(getFriendlyApiErrorMessage(err, 'We could not complete that sprint. Please try again.'), 'error');
    }
  };

  const onDragEnd = async (result: DropResult): Promise<void> => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const draggedTask = tasks.find(t => t._id === draggableId);
    if (!draggedTask) return;

    const isMovingToBacklog = destination.droppableId === 'backlog';
    const newSprintId = isMovingToBacklog ? null : destination.droppableId;
    
    const newStatus = (isMovingToBacklog 
      ? 'backlog' 
      : (draggedTask.status === 'backlog' ? 'todo' : draggedTask.status)) as TaskStatus;

    const sourceTasks = tasks.filter(t => (source.droppableId === 'backlog' ? t.sprintId == null : t.sprintId === source.droppableId))
                             .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    
    const destTasks = source.droppableId === destination.droppableId 
      ? sourceTasks 
      : tasks.filter(t => (destination.droppableId === 'backlog' ? t.sprintId == null : t.sprintId === destination.droppableId))
             .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

    let updatedTasks: Array<{ _id: string; status: TaskStatus; sequence: number; sprintId: string | null }> = [];
    const previousState = tasks.map(t => ({ _id: t._id, status: t.status, sequence: t.sequence ?? 0, sprintId: t.sprintId || null }));

    if (source.droppableId === destination.droppableId) {
      const colTasks = [...sourceTasks];
      const [moved] = colTasks.splice(source.index, 1);
      colTasks.splice(destination.index, 0, moved);

      updatedTasks = colTasks.map((t, index) => ({
        _id: t._id,
        status: t.status,
        sequence: index,
        sprintId: t.sprintId || null
      }));
    } else {
      const srcTasks = [...sourceTasks];
      const dstTasks = [...destTasks];

      const [moved] = srcTasks.splice(source.index, 1);
      const updatedMoved = { ...moved, status: newStatus, sprintId: newSprintId };
      dstTasks.splice(destination.index, 0, updatedMoved);

      const updatedSrc = srcTasks.map((t, index) => ({
        _id: t._id,
        status: t.status,
        sequence: index,
        sprintId: t.sprintId || null
      }));

      const updatedDst = dstTasks.map((t, index) => ({
        _id: t._id,
        status: t._id === draggedTask._id ? newStatus : t.status,
        sequence: index,
        sprintId: t._id === draggedTask._id ? newSprintId : (t.sprintId || null)
      }));

      updatedTasks = [...updatedSrc, ...updatedDst];
    }

    // 1. Optimistic Update
    updateMultipleTasksStateInline(
      updatedTasks.map(item => ({
        _id: item._id,
        fields: { status: item.status, sequence: item.sequence, sprintId: item.sprintId },
      }))
    );

    // 2. Persist to DB
    try {
      await reorderTasks(updatedTasks);
    } catch (err: any) {
      console.error('Failed to move task:', err);
      updateMultipleTasksStateInline(
        previousState.map(item => ({
          _id: item._id,
          fields: { status: item.status, sequence: item.sequence, sprintId: item.sprintId },
        }))
      );
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }
      showToast(getFriendlyApiErrorMessage(err, 'We could not move that task. Please try again.'), 'error');
    }
  };

  if (loading || loadingSprints) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 text-red-500 bg-red-50 border border-red-200 rounded-md dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-200 m-4">
        {error || 'We could not load this project backlog. Please try again.'}
      </div>
    );
  }

  const filterIssues = (issueList: ITaskData[]): ITaskData[] => 
    issueList.filter(issue =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.taskKey.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const backlogIssues = tasks.filter(t => !t.sprintId).sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const activeSprints = sprints.filter(s => s.status === 'active');
  const plannedSprints = sprints.filter(s => s.status === 'planned');

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      <div className="px-4 pt-4 pb-4">
        <div className="text-sm text-slate-500 mb-2 dark:text-slate-500">Projects / {project.name}</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Backlog</h1>
          {canCreateTask && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer text-center"
            >
              Create Task
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search backlog"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-sm border border-slate-300 rounded-sm bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-500" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <DragDropContext onDragEnd={onDragEnd}>
          {activeSprints.map(sprint => {
            const sprintTasks = tasks.filter(t => t.sprintId === sprint._id).sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
            return (
              <BacklogList
                key={sprint._id}
                listId={sprint._id}
                title={`Active Sprint: ${sprint.name}`}
                issues={filterIssues(sprintTasks)}
                projectKey={projectKey}
                sprint={sprint}
                onCompleteSprint={handleCompleteSprint}
                issueUrlPrefix={issueUrlPrefix}
              />
            );
          })}

          {plannedSprints.map(sprint => {
            const sprintTasks = tasks.filter(t => t.sprintId === sprint._id).sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
            return (
              <BacklogList
                key={sprint._id}
                listId={sprint._id}
                title={sprint.name}
                issues={filterIssues(sprintTasks)}
                projectKey={projectKey}
                sprint={sprint}
                onStartSprint={handleStartSprint}
                issueUrlPrefix={issueUrlPrefix}
              />
            );
          })}

          <BacklogList
            listId="backlog"
            title="Backlog"
            issues={filterIssues(backlogIssues)}
            projectKey={projectKey}
            onCreateSprint={handleCreateSprint}
            issueUrlPrefix={issueUrlPrefix}
          />
        </DragDropContext>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        refreshTasks={fetchProjectContext}
      />
      <CreateSprintModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSprintSubmit}
        defaultName={`Sprint ${sprints.length + 1}`}
      />
      <StartSprintModal
        isOpen={!!startSprintData}
        onClose={() => setStartSprintData(null)}
        onSubmit={handleStartSprintSubmit}
        sprint={startSprintData}
      />
      <CompleteSprintModal
        isOpen={!!completeSprintData}
        onClose={() => setCompleteSprintData(null)}
        onSubmit={handleCompleteSprintSubmit}
        sprint={completeSprintData}
      />
    </div>
  );
}
