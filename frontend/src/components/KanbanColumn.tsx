"use client";

import { Droppable } from '@hello-pangea/dnd';
import IssueCard from './IssueCard';
import type { ITaskData } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  columnId: string;
  title: string;
  issues: ITaskData[];
  projectKey: string;
  issueUrlPrefix?: string;
}

/** Column accent by common status names; falls back to neutral. */
function columnAccent(title: string): string {
  const t = title.toLowerCase();
  if (/(progress|doing|develop|review)/.test(t)) return 'bg-status-progress';
  if (/(done|complete|closed|shipped)/.test(t)) return 'bg-status-done';
  if (/(block|stuck|hold)/.test(t)) return 'bg-status-blocked';
  return 'bg-status-todo';
}

export default function KanbanColumn({ columnId, title, issues, projectKey, issueUrlPrefix }: KanbanColumnProps): React.JSX.Element {
  return (
    <div className="flex max-h-[450px] w-full flex-col rounded-xl border border-line/60 bg-surface-sunken md:max-h-full md:w-[284px] md:shrink-0">
      {/* Column header */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl bg-surface-sunken px-3 pb-2 pt-3">
        <h3 className="mr-2 flex min-w-0 items-center gap-2 truncate">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', columnAccent(title))} />
          <span className="truncate text-xs font-semibold uppercase tracking-wider text-content-secondary">
            {title}
          </span>
          <span className="shrink-0 rounded-full bg-surface-hover px-1.5 py-px text-[10.5px] font-semibold tabular-nums text-content-tertiary">
            {issues.length}
          </span>
        </h3>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'min-h-[150px] flex-1 overflow-y-auto rounded-b-xl px-2 pb-2 transition-colors duration-150',
              snapshot.isDraggingOver && 'bg-primary-subtle/60 ring-1 ring-inset ring-primary/25'
            )}
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
