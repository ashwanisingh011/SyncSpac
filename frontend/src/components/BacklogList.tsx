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
 className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-2 bg-surface border border-line group hover:bg-surface-hover transition-colors -mt-[1px] first:mt-0    ${snapshot.isDragging ? 'shadow-lg ring-1 ring-primary z-10' : ''}`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <IssueTypeIcon type={issue.type} />

            <Link
 href={`${issueUrlPrefix}/${projectKey}/issues/${issue.taskKey}`}
 className="text-xs font-semibold text-content-secondary hover:text-primary hover:underline shrink-0 w-16"
            >
              {issue.taskKey}
            </Link>

            <div className="text-sm text-content truncate">
              {issue.title}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t border-line pt-2 sm:border-0 sm:pt-0">
            <div className="text-xs text-content-tertiary sm:w-20 sm:text-right uppercase font-medium">
              {issue.status}
            </div>

            <div className="flex items-center gap-2">
              {issue.storyPoints !== undefined && issue.storyPoints > 0 ? (
                <div className="px-1.5 py-0.5 rounded-full bg-primary-subtle text-[10px] font-semibold text-primary" title="Story Points">
                  {issue.storyPoints}
                </div>
              ) : null}

              {issue.estimatedTime ? (
                <div className="px-1.5 py-0.5 rounded-full bg-surface-hover text-[10px] font-semibold text-content-secondary" title="Estimated Time">
                  {issue.estimatedTime}m
                </div>
              ) : null}

              <PriorityIcon priority={issue.priority} />

              <div className="w-6 h-6 rounded-full bg-surface-hover border border-line-strong border-dashed flex items-center justify-center overflow-hidden shrink-0">
                {assignee ? (
 assignee.avatarUrl ? (
                    <img src={assignee.avatarUrl} alt={assignee.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-medium text-content-secondary">{assignee.name.charAt(0).toUpperCase()}</span>
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
          <h2 className="font-semibold text-content text-sm sm:text-base">{title}</h2>
          {sprint && sprint.startDate && sprint.endDate && (
            <span className="text-xs text-content-tertiary">
              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
            </span>
          )}
          <span className="text-[11px] sm:text-xs font-medium bg-surface-hover text-content-secondary px-2 py-0.5 rounded-full">
            {issues.length} issues
          </span>
        </div>

        {sprint && sprint.status === 'active' && onCompleteSprint && (
          <button
 onClick={() => onCompleteSprint(sprint._id)}
 className="w-full sm:w-auto bg-surface-hover hover:bg-surface-hover text-content-secondary px-3 py-1.5 text-xs sm:text-sm rounded-sm transition-colors cursor-pointer text-center"
          >
 Complete sprint
          </button>
        )}
        {sprint && sprint.status === 'planned' && onStartSprint && (
          <button
 onClick={() => onStartSprint(sprint._id)}
 className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-primary-content px-3 py-1.5 text-xs sm:text-sm rounded-sm transition-colors cursor-pointer text-center"
          >
 Start sprint
          </button>
        )}
        {listId === 'backlog' && onCreateSprint && (
          <button
 onClick={onCreateSprint}
 className="w-full sm:w-auto bg-surface-hover hover:bg-surface-hover text-content-secondary px-3 py-1.5 text-xs sm:text-sm rounded-sm transition-colors cursor-pointer text-center"
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
 className={`min-h-[60px] rounded-sm transition-colors ${snapshot.isDraggingOver ? 'bg-primary-subtle/60 ' : ''}`}
          >
            {issues.length === 0 ? (
              <div className="border border-line border-dashed rounded-sm p-4 text-center text-sm text-content-tertiary bg-surface-sunken">
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
