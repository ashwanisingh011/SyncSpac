"use client";

import { Droppable } from '@hello-pangea/dnd';
import IssueCard from './IssueCard';
import type { ITaskData } from '@/types/workspace';

interface KanbanColumnProps {
  columnId: string;
  title: string;
  issues: ITaskData[];
  projectKey: string;
  issueUrlPrefix?: string;
}

export default function KanbanColumn({ columnId, title, issues, projectKey, issueUrlPrefix }: KanbanColumnProps): React.JSX.Element {
  return (
    <div className="flex flex-col bg-slate-50 rounded-md w-full md:w-[280px] md:shrink-0 max-h-[450px] md:max-h-full border border-transparent dark:bg-slate-900 dark:border-slate-800">
      <div className="p-3 pb-2 flex items-center justify-between sticky top-0 bg-slate-50 rounded-t-md z-10 dark:bg-slate-900">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate mr-2 dark:text-slate-400">
          {title} <span className="text-slate-400 font-normal ml-1 dark:text-slate-500">{issues.length}</span>
        </h3>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 min-h-[150px] overflow-y-auto rounded-b-md ${snapshot.isDraggingOver ? 'bg-slate-100 dark:bg-blue-950/30' : ''}`}
          >
            {issues.map((issue, index) => (
              <IssueCard
                key={issue._id}
                issue={issue}
                index={index}
                projectKey={projectKey}
                issueUrlPrefix={issueUrlPrefix}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
