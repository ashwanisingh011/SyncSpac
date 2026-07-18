"use client";

import { Draggable } from '@hello-pangea/dnd';
import { IssueTypeIcon } from './IssueIcon';
import { PriorityIcon } from './PriorityIcon';
import { useProjectData } from '@/context/projectDataContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ITaskData } from '@/types/workspace';

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
          className={`bg-white p-3 rounded-md shadow-sm border border-slate-200 mb-2 cursor-pointer hover:bg-slate-50 transition-colors dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 ${snapshot.isDragging ? 'shadow-md ring-2 ring-blue-500 ring-opacity-50 dark:ring-[#579DFF]' : ''}`}
        >
          <div className="text-sm text-slate-800 mb-2 line-clamp-2 dark:text-slate-100">
            {issue.title}
          </div>

          {/* Label indicators */}
          {issue.labels && issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {issue.labels.map((label: any, idx: number) => {
                // Labels can be populated objects or string IDs
                if (typeof label === 'object' && label.name) {
                  return (
                    <span
                      key={label._id}
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
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
                    className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"
                    title="Label"
                  />
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <IssueTypeIcon type={issue.type} />
              <Link
                href={`${issueUrlPrefix}/${projectKey}/issues/${issue.taskKey}`}
                className="text-xs font-medium text-slate-600 hover:text-blue-600 hover:underline dark:text-slate-400 dark:hover:text-[#579DFF]"
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
                <div className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" title="Estimated Time">
                  {issue.estimatedTime}m
                </div>
              ) : null}

              {assignee ? (
                <div
                  className={`w-6 h-6 rounded-full ${assigneeAvatar ? 'bg-transparent' : getAvatarBgColor(assigneeName)} text-white flex items-center justify-center text-[10px] font-medium overflow-hidden ml-1 shrink-0`}
                  title={assigneeName}
                >
                  {assigneeAvatar ? (
                    <img src={assigneeAvatar} alt={assigneeName} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(assigneeName)
                  )}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 border-dashed flex items-center justify-center ml-1 dark:bg-slate-800 dark:border-slate-700 shrink-0" title="Unassigned"></div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
