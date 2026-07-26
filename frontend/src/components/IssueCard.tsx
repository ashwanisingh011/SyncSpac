"use client";

import { Draggable } from '@hello-pangea/dnd';
import { IssueTypeIcon } from './IssueIcon';
import { PriorityIcon } from './PriorityIcon';
import { useProjectData } from '@/context/projectDataContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ITaskData } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: ITaskData;
  index: number;
  projectKey: string;
  issueUrlPrefix?: string;
}

export default function IssueCard({ issue, index, projectKey, issueUrlPrefix = '/projects' }: IssueCardProps): React.JSX.Element {
  const { getMember } = useProjectData();

  let assignee: any = null;
  if (issue.assignedTo) {
    if (typeof issue.assignedTo === 'object') {
      assignee = issue.assignedTo;
    } else {
      assignee = getMember(issue.assignedTo);
    }
  }

  const assigneeName = assignee?.name || assignee?.user?.name || 'Unknown';
  const assigneeAvatar = assignee?.avatarUrl || assignee?.avatar || assignee?.user?.avatar || assignee?.user?.avatarUrl;

  const getInitials = (name: string) => {
    const trimmed = name?.trim() || '';
    if (!trimmed) return 'U';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return trimmed.substring(0, 2).toUpperCase();
  };

  const getAvatarBgColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
      'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500',
      'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent navigating if clicking an interactive element
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, select, textarea')) {
      return;
    }
    router.push(`${issueUrlPrefix}/${projectKey}/issues/${issue.taskKey}`);
  };

  return (
    <Draggable draggableId={issue._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={handleCardClick}
          style={{
            ...provided.draggableProps.style,
            // Slight tilt while dragging — Linear-style pick-up feel
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform ?? ''} rotate(2deg)`
              : provided.draggableProps.style?.transform,
          }}
          className={cn(
            'group mb-2 cursor-pointer rounded-lg border border-line bg-surface p-3 shadow-card',
            'transition-[border-color,box-shadow,background-color] duration-150',
            'hover:border-line-strong hover:shadow-raised',
            snapshot.isDragging && 'rotate-2 border-primary/40 shadow-overlay ring-1 ring-primary/30'
          )}
        >
          <div className="mb-2 line-clamp-2 text-[13.5px] leading-snug text-content">
            {issue.title}
          </div>

          {/* Label indicators */}
          {issue.labels && issue.labels.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {issue.labels.map((label: any, idx: number) => {
                // Labels can be populated objects or string IDs
                if (typeof label === 'object' && label.name) {
                  return (
                    <span
                      key={label._id}
                      className="rounded-full border px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{
                        backgroundColor: label.color + '18',
                        borderColor: label.color + '40',
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </span>
                  );
                }
                // String ID — show small colored dot placeholder
                return (
                  <span
                    key={typeof label === 'string' ? label : idx}
                    className="h-2 w-2 rounded-full bg-line-strong"
                    title="Label"
                  />
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IssueTypeIcon type={issue.type} />
              <Link
                href={`${issueUrlPrefix}/${projectKey}/issues/${issue.taskKey}`}
                className="text-[11px] font-semibold tracking-wide text-content-tertiary transition-colors hover:text-primary hover:underline"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  // Pre-empt drag if clicking the link
                  e.stopPropagation();
                }}
              >
                {issue.taskKey}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <PriorityIcon priority={issue.priority} />

              {issue.estimatedTime ? (
                <div className="rounded-full bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-content-secondary" title="Estimated Time">
                  {issue.estimatedTime}m
                </div>
              ) : null}

              {assignee ? (
                <div
                  className={cn(
                    'ml-1 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-medium text-white ring-2 ring-surface',
                    assigneeAvatar ? 'bg-transparent' : getAvatarBgColor(assigneeName)
                  )}
                  title={assigneeName}
                >
                  {assigneeAvatar ? (
                    <img src={assigneeAvatar} alt={assigneeName} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(assigneeName)
                  )}
                </div>
              ) : (
                <div className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong bg-surface-hover" title="Unassigned"></div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
