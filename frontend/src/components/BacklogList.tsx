"use client";

import { Droppable, Draggable } from '@hello-pangea/dnd';
import { IssueTypeIcon } from './IssueIcon';
import { PriorityIcon } from './PriorityIcon';
import { useProjectData } from '@/context/projectDataContext';
import Link from 'next/link';
import type { ITaskData, ISprintData } from '@/types/workspace';

interface BacklogIssueItemProps {
  issue: ITaskData;
  index: number;
  projectKey: string;
  issueUrlPrefix?: string;
}

const BacklogIssueItem = ({ issue, index, projectKey, issueUrlPrefix = '/projects' }: BacklogIssueItemProps): React.JSX.Element => {
  const { getMember } = useProjectData();
  const assignee = issue.assignedTo ? getMember(issue.assignedTo) : null;

  return (
    <Draggable draggableId={issue._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-2 bg-white border border-slate-200 group hover:bg-slate-50 transition-colors -mt-[1px] first:mt-0 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 ${snapshot.isDragging ? 'shadow-lg ring-1 ring-blue-500 z-10 dark:ring-[#579DFF]' : ''}`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <IssueTypeIcon type={issue.type} />

            <Link
              href={`${issueUrlPrefix}/${projectKey}/issues/${issue.taskKey}`}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 hover:underline shrink-0 w-16 dark:text-slate-400 dark:hover:text-[#579DFF]"
            >
              {issue.taskKey}
            </Link>

            <div className="text-sm text-slate-800 truncate dark:text-slate-100">
              {issue.title}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t border-slate-100 pt-2 sm:border-0 sm:pt-0 dark:border-slate-800/50">
            <div className="text-xs text-slate-500 sm:w-20 sm:text-right uppercase dark:text-slate-400 font-medium">
              {issue.status}
            </div>

            <div className="flex items-center gap-2">
              {issue.storyPoints !== undefined && issue.storyPoints > 0 ? (
                <div className="px-1.5 py-0.5 rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" title="Story Points">
                  {issue.storyPoints}
                </div>
              ) : null}

              {issue.estimatedTime ? (
                <div className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" title="Estimated Time">
                  {issue.estimatedTime}m
                </div>
              ) : null}

              <PriorityIcon priority={issue.priority} />

              <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 border-dashed flex items-center justify-center overflow-hidden dark:bg-slate-800 dark:border-slate-700 shrink-0">
                {assignee ? (
                  assignee.avatarUrl ? (
                    <img src={assignee.avatarUrl} alt={assignee.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{assignee.name.charAt(0).toUpperCase()}</span>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

// ─── BacklogList ──────────────────────────────────────────────────────────────

interface BacklogListProps {
  listId: string;
  title: string;
  issues: ITaskData[];
  projectKey: string;
  sprint?: ISprintData;
  onStartSprint?: (sprintId: string) => void;
  onCompleteSprint?: (sprintId: string) => void;
  onCreateSprint?: () => void;
  issueUrlPrefix?: string;
}

export default function BacklogList({ listId, title, issues, projectKey, sprint, onStartSprint, onCompleteSprint, onCreateSprint, issueUrlPrefix = '/projects' }: BacklogListProps): React.JSX.Element {
  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2 px-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base">{title}</h2>
          {sprint && sprint.startDate && sprint.endDate && (
            <span className="text-xs text-slate-500 dark:text-slate-500">
              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
            </span>
          )}
          <span className="text-[11px] sm:text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">
            {issues.length} issues
          </span>
        </div>

        {sprint && sprint.status === 'active' && onCompleteSprint && (
          <button
            onClick={() => onCompleteSprint(sprint._id)}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs sm:text-sm rounded-sm transition-colors dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer text-center"
          >
            Complete sprint
          </button>
        )}
        {sprint && sprint.status === 'planned' && onStartSprint && (
          <button
            onClick={() => onStartSprint(sprint._id)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs sm:text-sm rounded-sm transition-colors dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer text-center"
          >
            Start sprint
          </button>
        )}
        {listId === 'backlog' && onCreateSprint && (
          <button
            onClick={onCreateSprint}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs sm:text-sm rounded-sm transition-colors dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer text-center"
          >
            Create sprint
          </button>
        )}
      </div>

      <Droppable droppableId={listId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[60px] rounded-sm transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}`}
          >
            {issues.length === 0 ? (
              <div className="border border-slate-200 border-dashed rounded-sm p-4 text-center text-sm text-slate-500 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Plan your sprint by dragging issues here
              </div>
            ) : (
              issues.map((issue, index) => (
                <BacklogIssueItem
                  key={issue._id}
                  issue={issue}
                  index={index}
                  projectKey={projectKey}
                  issueUrlPrefix={issueUrlPrefix}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
