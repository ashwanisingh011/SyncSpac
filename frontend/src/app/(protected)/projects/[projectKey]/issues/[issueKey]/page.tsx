"use client";

import { use, useState, useEffect, useMemo } from 'react';
import { useProjectData } from '@/context/projectDataContext';
import { useAuth } from '@/context/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useSocket } from '@/hooks/useSocket';
import { IssueTypeIcon } from '@/components/IssueIcon';
import { PriorityIcon } from '@/components/PriorityIcon';
import {
  Share2,
  MoreHorizontal,
  Eye,
  EyeOff,
  ThumbsUp,
  Paperclip,
  Link as LinkIcon,
  Trash2,
  Loader2,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
  Tag,
  Plus,
  Check,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import {
  updateTask,
  watchTask,
  unwatchTask,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
  toggleCommentReaction,
  logTime,
  getTaskTimeLogs,
  deleteTimeLog,
  getTaskHistory,
  createAttachment,
  getTaskAttachments,
  deleteAttachment,
  addDependency,
  getTaskDependencies,
  removeDependency,
  type ICommentData,
  type ITimeLogData,
  type IHistoryData,
  type IAttachmentData,
  type IDependencyData
} from '@/api/tasks';
import {
  getLabels,
  createLabel,
  attachLabelToTask,
  detachLabelFromTask,
  type ILabelData
} from '@/api/labels';
import type { TaskStatus, IChecklistItem, WorkspaceMember } from '@/types/workspace';
import { isAccessRestrictedError } from '@/lib/accessErrors';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';
import { getProjectTaskStatusOptions } from '@/lib/taskStatus';
import { useConfirm } from '@/context/useConfirm';
import { isClientMember } from '@/lib/assignableMembers';

interface IssuePageContentProps {
  projectKey: string;
  issueKey: string;
}

export function IssuePageContent({ projectKey, issueKey }: IssuePageContentProps): React.JSX.Element {

  const { user } = useAuth();
  const { hasRole, canEditTask } = usePermission();
  const { project, tasks, sprints, members = [], loading, error, updateTaskStateInline, getMember } = useProjectData();
  const confirm = useConfirm();
  const statusOptions = useMemo(
    () => getProjectTaskStatusOptions(project?.key ?? projectKey, tasks, true),
    [project?.key, projectKey, tasks]
  );

  const [issue, setIssue] = useState<any>(null);
  const [descValue, setDescValue] = useState<string>('');
  const [isEditingDesc, setIsEditingDesc] = useState<boolean>(false);

  // Mentions dropdown state
  const [mentionSearch, setMentionSearch] = useState<string>('');
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState<boolean>(false);
  const [mentionActiveIndex, setMentionActiveIndex] = useState<number>(0);
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState<number>(-1);
  const [mentionInputType, setMentionInputType] = useState<'new' | 'edit'>('new');

  // Checklist state
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState<string>('');

  // Comments state
  const [comments, setComments] = useState<ICommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [isCommentInputFocused, setIsCommentInputFocused] = useState<boolean>(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');
  const [activePickerCommentId, setActivePickerCommentId] = useState<string | null>(null);

  // Time tracking state
  const [timeLogs, setTimeLogs] = useState<ITimeLogData[]>([]);
  const [totalLoggedMinutes, setTotalLoggedMinutes] = useState<number>(0);
  const [timeLogsLoading, setTimeLogsLoading] = useState<boolean>(false);
  const [isLogTimeOpen, setIsLogTimeOpen] = useState<boolean>(false);
  const [isEditingEstimate, setIsEditingEstimate] = useState<boolean>(false);
  const [estimateValue, setEstimateValue] = useState<string>('');
  const [isEditingStoryPoints, setIsEditingStoryPoints] = useState<boolean>(false);
  const [storyPointsValue, setStoryPointsValue] = useState<string>('');

  // Time logging modal inputs
  const [logDuration, setLogDuration] = useState<string>('');
  const [logDescription, setLogDescription] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Activity History state
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [history, setHistory] = useState<IHistoryData[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Attachments state
  const [attachments, setAttachments] = useState<IAttachmentData[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // Labels state
  const [allLabels, setAllLabels] = useState<ILabelData[]>([]);
  const [taskLabelIds, setTaskLabelIds] = useState<string[]>([]);
  const [showLabelDropdown, setShowLabelDropdown] = useState<boolean>(false);
  const [newLabelName, setNewLabelName] = useState<string>('');
  const [newLabelColor, setNewLabelColor] = useState<string>('#3b82f6');
  const [labelLoading, setLabelLoading] = useState<boolean>(false);
  const [actionWarning, setActionWarning] = useState<string>('');
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);

  // Dependencies state
  const [dependencies, setDependencies] = useState<IDependencyData[]>([]);
  const [dependenciesLoading, setDependenciesLoading] = useState<boolean>(false);
  const [isLinkIssueOpen, setIsLinkIssueOpen] = useState<boolean>(false);
  const [linkTargetTaskId, setLinkTargetTaskId] = useState<string>('');
  const [linkType, setLinkType] = useState<'blocks' | 'blocked-by'>('blocked-by');
  const [linking, setLinking] = useState<boolean>(false);

  // Socket-related presence & typing state
  const { joinProject, viewTask, unviewTask, setTypingState, useEventListener } = useSocket();
  const [activeViewers, setActiveViewers] = useState<Array<{ userId: string; name: string; avatar?: string }>>([]);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; name: string }>>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const showIssueWarning = (message: string): void => {
    setActionWarning(message);
    window.setTimeout(() => setActionWarning(''), 5000);
  };

  const handleIssueActionError = (err: unknown, fallback: string): void => {
    if (isAccessRestrictedError(err)) {
      setShowAccessRestricted(true);
      return;
    }

    showIssueWarning(getFriendlyApiErrorMessage(err, fallback));
  };

  // 1. Join Project room
  useEffect(() => {
    if (project?._id) {
      joinProject(project._id);
    }
  }, [project?._id, joinProject]);

  // 2. View/Unview Task
  useEffect(() => {
    if (issue?._id && project?._id) {
      viewTask(issue._id, project._id);
      return () => {
        unviewTask(issue._id, project._id);
      };
    }
  }, [issue?._id, project?._id, viewTask, unviewTask]);

  // 3. Monitor comment text changes for typing indicator
  useEffect(() => {
    if (!issue?._id || !project?._id) return;
    if (newCommentText.trim().length > 0) {
      if (!isTyping) {
        setIsTyping(true);
        setTypingState(issue._id, project._id, true);
      }
      const timeout = setTimeout(() => {
        setIsTyping(false);
        setTypingState(issue._id, project._id, false);
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      if (isTyping) {
        setIsTyping(false);
        setTypingState(issue._id, project._id, false);
      }
    }
  }, [newCommentText, issue?._id, project?._id, isTyping, setTypingState]);

  // 4. Socket event listeners
  useEventListener('comment:created', (data: { comment: ICommentData; taskId: string }) => {
    if (data.taskId === issue?._id) {
      setComments((prev) => {
        if (!data?.comment?._id || prev.some((c) => c._id === data.comment._id)) return prev;
        return [...prev, data.comment];
      });
    }
  });

  useEventListener('comment:updated', (data: { comment: ICommentData; taskId: string }) => {
    if (data.taskId === issue?._id) {
      setComments((prev) => prev.map((c) => (c._id === data.comment._id ? data.comment : c)));
    }
  });

  const handleTextareaChange = (
    val: string,
    selectionStart: number,
    inputType: 'new' | 'edit'
  ) => {
    if (inputType === 'new') {
      setNewCommentText(val);
    } else {
      setEditingCommentText(val);
    }

    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAtOffset = textBeforeCursor.lastIndexOf('@');

    if (lastAtOffset !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtOffset + 1);
      const hasSpace = /\s/.test(textAfterAt);
      const isStartOfWord = lastAtOffset === 0 || /\s/.test(textBeforeCursor[lastAtOffset - 1]);

      if (!hasSpace && isStartOfWord) {
        setMentionTriggerIndex(lastAtOffset);
        setMentionSearch(textAfterAt);
        setMentionDropdownOpen(true);
        setMentionInputType(inputType);
        setMentionActiveIndex(0);
        return;
      }
    }

    setMentionDropdownOpen(false);
    setMentionTriggerIndex(-1);
    setMentionSearch('');
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    text: string,
    inputType: 'new' | 'edit'
  ) => {
    if (!mentionDropdownOpen) return;

    const filtered = members
      .filter((m) => !isClientMember(m))
      .filter((m) => {
        const searchLower = mentionSearch.toLowerCase();
        const username = m.username || '';
        return (
          m.name.toLowerCase().includes(searchLower) ||
          m.email.toLowerCase().includes(searchLower) ||
          username.toLowerCase().includes(searchLower)
        );
      });

    if (filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectMention(filtered[mentionActiveIndex], inputType);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMentionDropdownOpen(false);
      setMentionTriggerIndex(-1);
    }
  };

  const selectMention = (member: WorkspaceMember, inputType: 'new' | 'edit') => {
    const username = member.username || member.name.toLowerCase().replace(/\s+/g, '');
    const mentionText = `@${username} `;

    if (inputType === 'new') {
      const before = newCommentText.slice(0, mentionTriggerIndex);
      const after = newCommentText.slice(mentionTriggerIndex + mentionSearch.length + 1);
      setNewCommentText(before + mentionText + after);
    } else {
      const before = editingCommentText.slice(0, mentionTriggerIndex);
      const after = editingCommentText.slice(mentionTriggerIndex + mentionSearch.length + 1);
      setEditingCommentText(before + mentionText + after);
    }

    setMentionDropdownOpen(false);
    setMentionTriggerIndex(-1);
    setMentionSearch('');
  };

  const handleToggleReaction = async (commentId: string, emoji: string): Promise<void> => {
    try {
      const updated = await toggleCommentReaction(issue._id, commentId, emoji);
      setComments((prev) => prev.map((c) => (c._id === commentId ? updated : c)));
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const renderMentionDropdown = (inputType: 'new' | 'edit') => {
    if (!mentionDropdownOpen || mentionInputType !== inputType) return null;

    const filtered = members
      .filter((m) => !isClientMember(m))
      .filter((m) => {
        const searchLower = mentionSearch.toLowerCase();
        const username = m.username || '';
        return (
          m.name.toLowerCase().includes(searchLower) ||
          m.email.toLowerCase().includes(searchLower) ||
          username.toLowerCase().includes(searchLower)
        );
      });

    if (filtered.length === 0) return null;

    return (
      <div className="absolute z-50 mt-1 max-h-48 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-950">
        {filtered.map((member, idx) => {
          const isActive = idx === mentionActiveIndex;
          const username = member.username || member.name.toLowerCase().replace(/\s+/g, '');
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => selectMention(member, inputType)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${isActive
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/50 dark:hover:text-slate-100'
                }`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-705 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center text-[9px] font-semibold overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                {member.avatarUrl ? (
                  <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate leading-tight text-slate-800 dark:text-slate-200">{member.name}</p>
                <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">@{username}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  useEventListener('task:view_joined', (data: { taskId: string; userId: string; name: string; avatar?: string }) => {
    if (data.taskId !== issue?._id) return;
    if (data.userId === user?._id || data.userId === user?.id) return; // ignore ourselves
    setActiveViewers((prev) => {
      if (prev.some((v) => v.userId === data.userId)) return prev;
      return [...prev, { userId: data.userId, name: data.name, avatar: data.avatar }];
    });
  });

  useEventListener('task:view_left', (data: { taskId: string; userId: string }) => {
    if (data.taskId !== issue?._id) return;
    setActiveViewers((prev) => prev.filter((v) => v.userId !== data.userId));
  });

  useEventListener('task:typing', (data: { taskId: string; userId: string; name: string; isTyping: boolean }) => {
    if (data.taskId !== issue?._id) return;
    if (data.userId === user?._id || data.userId === user?.id) return; // ignore ourselves
    setTypingUsers((prev) => {
      if (data.isTyping) {
        if (prev.some((u) => u.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, name: data.name }];
      } else {
        return prev.filter((u) => u.userId !== data.userId);
      }
    });
  });

  useEventListener('user:offline', (data: { userId: string }) => {
    setActiveViewers((prev) => prev.filter((v) => v.userId !== data.userId));
    setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
  });

  // Sync issue from context tasks array
  useEffect(() => {
    if (!loading && tasks.length > 0 && project) {
      const foundIssue = tasks.find(
        (t) => t.taskKey.toUpperCase() === issueKey.toUpperCase() && t.project === project._id
      );
      if (foundIssue) {
        setIssue(foundIssue);
        setDescValue(foundIssue.description || '');
        // Extract label IDs from the task (may be string IDs or populated objects)
        const labelIds = (foundIssue.labels || []).map((l: any) =>
          typeof l === 'string' ? l : l._id
        );
        setTaskLabelIds(labelIds);
      }
    }
  }, [projectKey, issueKey, tasks, loading, project]);

  // Update estimateValue when issue estimate changes
  useEffect(() => {
    if (issue) {
      setEstimateValue(issue.estimatedTime?.toString() || '');
      setStoryPointsValue(issue.storyPoints?.toString() || '');
    }
  }, [issue?.estimatedTime, issue?.storyPoints]);

  // Fetch comments when task is identified
  useEffect(() => {
    if (issue?._id) {
      const fetchComments = async (): Promise<void> => {
        setCommentsLoading(true);
        try {
          const data = await getTaskComments(issue._id);
          setComments(data);
        } catch (err) {
          console.error('Failed to fetch comments:', err);
        } finally {
          setCommentsLoading(false);
        }
      };
      fetchComments();
    }
  }, [issue?._id]);

  const fetchTimeLogs = async (): Promise<void> => {
    if (!issue?._id) return;
    setTimeLogsLoading(true);
    try {
      const data = await getTaskTimeLogs(issue._id);
      setTimeLogs(data.logs || []);
      setTotalLoggedMinutes(data.totalLoggedMinutes || 0);
    } catch (err) {
      console.error('Failed to fetch time logs:', err);
    } finally {
      setTimeLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeLogs();
  }, [issue?._id]);

  const fetchHistory = async (): Promise<void> => {
    if (!issue?._id) return;
    setHistoryLoading(true);
    try {
      const data = await getTaskHistory(issue._id);
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to fetch task history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [issue?._id, activeTab]);

  // Fetch attachments
  const fetchAttachments = async (): Promise<void> => {
    if (!issue?._id) return;
    setAttachmentsLoading(true);
    try {
      const data = await getTaskAttachments(issue._id);
      setAttachments(data);
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  useEffect(() => {
    if (issue?._id) {
      fetchAttachments();
    }
  }, [issue?._id]);

  // Fetch dependencies
  const fetchDependencies = async (): Promise<void> => {
    if (!issue?._id) return;
    setDependenciesLoading(true);
    try {
      const data = await getTaskDependencies(issue._id);
      setDependencies(data || []);
    } catch (err) {
      console.error('Failed to fetch dependencies:', err);
    } finally {
      setDependenciesLoading(false);
    }
  };

  useEffect(() => {
    if (issue?._id) {
      fetchDependencies();
    }
  }, [issue?._id]);

  const handleAddDependency = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!issue?._id || !linkTargetTaskId) return;
    setLinking(true);
    try {
      await addDependency(issue._id, {
        dependsOn: linkTargetTaskId,
        type: linkType,
      });
      // Refresh dependencies and history
      await fetchDependencies();
      if (activeTab === 'history') {
        fetchHistory();
      }
      setIsLinkIssueOpen(false);
      setLinkTargetTaskId('');
      setLinkType('blocked-by');
    } catch (err: any) {
      console.error('Failed to add dependency:', err);
      handleIssueActionError(err, 'We could not link that issue. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  const handleRemoveDependency = async (depId: string): Promise<void> => {
    if (!issue?._id) return;
    try {
      await removeDependency(issue._id, depId);
      setDependencies((prev) => prev.filter((d) => d._id !== depId));
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to remove dependency:', err);
      handleIssueActionError(err, 'We could not remove that issue link. Please try again.');
    }
  };

  // Attachment handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !issue?._id) return;

    setUploading(true);
    try {
      const newAttachment = await createAttachment(issue._id, file);
      setAttachments((prev) => [newAttachment, ...prev]);
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to upload attachment:', err);
      handleIssueActionError(err, 'We could not upload that attachment. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string): Promise<void> => {
    const isConfirmed = await confirm({
      title: 'Delete Attachment',
      message: 'Are you sure you want to delete this attachment?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    if (!issue?._id) return;

    try {
      await deleteAttachment(issue._id, attachmentId);
      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to delete attachment:', err);
      handleIssueActionError(err, 'We could not delete that attachment. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ─── Labels Handlers ────────────────────────────────────────────────────────

  const fetchAllLabels = async (): Promise<void> => {
    try {
      const data = await getLabels();
      setAllLabels(data);
    } catch (err) {
      console.error('Failed to fetch labels:', err);
    }
  };

  useEffect(() => {
    if (issue?._id) {
      fetchAllLabels();
    }
  }, [issue?._id]);

  const handleAttachLabel = async (labelId: string): Promise<void> => {
    if (!issue?._id) return;
    setLabelLoading(true);
    try {
      const updatedTask = await attachLabelToTask(issue._id, labelId);
      const labelIds = (updatedTask.labels || []).map((l: any) =>
        typeof l === 'string' ? l : l._id
      );
      setTaskLabelIds(labelIds);
      // Also update the task inline so board reflects changes
      updateTaskStateInline(issue._id, {
        labels: updatedTask.labels,
      });
    } catch (err: any) {
      console.error('Failed to attach label:', err);
      handleIssueActionError(err, 'We could not add that label. Please try again.');
    } finally {
      setLabelLoading(false);
    }
  };

  const handleDetachLabel = async (labelId: string): Promise<void> => {
    if (!issue?._id) return;
    setLabelLoading(true);
    try {
      const updatedTask = await detachLabelFromTask(issue._id, labelId);
      const labelIds = (updatedTask.labels || []).map((l: any) =>
        typeof l === 'string' ? l : l._id
      );
      setTaskLabelIds(labelIds);
      updateTaskStateInline(issue._id, {
        labels: updatedTask.labels,
      });
    } catch (err: any) {
      console.error('Failed to detach label:', err);
      handleIssueActionError(err, 'We could not remove that label. Please try again.');
    } finally {
      setLabelLoading(false);
    }
  };

  const handleCreateAndAttachLabel = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newLabelName.trim() || !issue?._id) return;
    setLabelLoading(true);
    try {
      const created = await createLabel({
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      setAllLabels((prev) => [...prev, created]);
      // Immediately attach the new label
      const updatedTask = await attachLabelToTask(issue._id, created._id);
      const labelIds = (updatedTask.labels || []).map((l: any) =>
        typeof l === 'string' ? l : l._id
      );
      setTaskLabelIds(labelIds);
      updateTaskStateInline(issue._id, {
        labels: updatedTask.labels,
      });
      setNewLabelName('');
      setNewLabelColor('#3b82f6');
    } catch (err: any) {
      console.error('Failed to create/attach label:', err);
      handleIssueActionError(err, 'We could not create that label. Please try again.');
    } finally {
      setLabelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 text-red-500 bg-red-50 border border-red-200 rounded-md dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-200 m-4">
        {error || 'Project data could not be loaded.'}
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-6 text-slate-500 dark:text-slate-400">
        Issue <span className="font-semibold">{issueKey}</span> not found in project <span className="font-semibold">{project.name}</span>.
      </div>
    );
  }

  const assignee = issue.assignedTo ? getMember(issue.assignedTo) : null;
  const reporter = issue.createdBy ? getMember(issue.createdBy) : null;

  // Watchers indicators
  const isWatching = issue.watchers?.includes(user?._id) || issue.watchers?.includes(user?.id) || false;
  const watchersCount = issue.watchers?.length || 0;

  // Checklist indicators
  const totalChecklistCount = issue.checklist?.length || 0;
  const completedChecklistCount = issue.checklist?.filter((item: IChecklistItem) => item.isCompleted).length || 0;

  const handleSaveDesc = async (): Promise<void> => {
    const oldDesc = issue.description || '';
    updateTaskStateInline(issue._id, { description: descValue });
    setIsEditingDesc(false);

    try {
      await updateTask(issue._id, { description: descValue });
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to update task description:', err);
      updateTaskStateInline(issue._id, { description: oldDesc });
      setDescValue(oldDesc);
      handleIssueActionError(err, 'We could not update the task description. Please try again.');
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    const newStatus = e.target.value as TaskStatus;
    const oldStatus = issue.status;

    updateTaskStateInline(issue._id, { status: newStatus });

    try {
      await updateTask(issue._id, { status: newStatus });
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      updateTaskStateInline(issue._id, { status: oldStatus });
      handleIssueActionError(err, 'We could not update the task status. Please try again.');
    }
  };

  const handleToggleWatch = async (): Promise<void> => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const oldWatchers = issue.watchers || [];
    const isCurrentlyWatching = oldWatchers.includes(userId);

    const newWatchers = isCurrentlyWatching
      ? oldWatchers.filter((id: string) => id !== userId)
      : [...oldWatchers, userId];

    updateTaskStateInline(issue._id, { watchers: newWatchers });

    try {
      if (isCurrentlyWatching) {
        await unwatchTask(issue._id);
      } else {
        await watchTask(issue._id);
      }
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to update watch status:', err);
      updateTaskStateInline(issue._id, { watchers: oldWatchers });
      handleIssueActionError(err, 'We could not update your watch preference. Please try again.');
    }
  };

  // Checklist handlers
  const handleAddChecklistItem = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newChecklistItemTitle.trim()) return;

    const titleText = newChecklistItemTitle.trim();
    setNewChecklistItemTitle('');

    try {
      const createdItem = await addChecklistItem(issue._id, titleText);
      const updatedChecklist = [...(issue.checklist || []), createdItem];
      updateTaskStateInline(issue._id, { checklist: updatedChecklist });
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to add checklist item:', err);
      handleIssueActionError(err, 'We could not add that checklist item. Please try again.');
    }
  };

  const handleToggleChecklistItem = async (itemId: string, currentCompleted: boolean): Promise<void> => {
    const oldChecklist = issue.checklist || [];
    const updatedChecklist = oldChecklist.map((item: IChecklistItem) =>
      item._id === itemId ? { ...item, isCompleted: !currentCompleted } : item
    );

    updateTaskStateInline(issue._id, { checklist: updatedChecklist });

    try {
      await updateChecklistItem(issue._id, itemId, { isCompleted: !currentCompleted });
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to update checklist item status:', err);
      updateTaskStateInline(issue._id, { checklist: oldChecklist });
      handleIssueActionError(err, 'We could not update that checklist item. Please try again.');
    }
  };

  const handleDeleteChecklistItem = async (itemId: string): Promise<void> => {
    const oldChecklist = issue.checklist || [];
    const updatedChecklist = oldChecklist.filter((item: IChecklistItem) => item._id !== itemId);

    updateTaskStateInline(issue._id, { checklist: updatedChecklist });

    try {
      await deleteChecklistItem(issue._id, itemId);
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to delete checklist item:', err);
      updateTaskStateInline(issue._id, { checklist: oldChecklist });
      handleIssueActionError(err, 'We could not delete that checklist item. Please try again.');
    }
  };

  // Comments handlers
  const handleAddComment = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const text = newCommentText.trim();
    setNewCommentText('');
    setIsCommentInputFocused(false);

    try {
      const created = await createComment(issue._id, text);
      setComments((prev) => {
        if (!created?._id || prev.some((c) => c._id === created._id)) return prev;
        return [...prev, created];
      });
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      handleIssueActionError(err, 'We could not add that comment. Please try again.');
    }
  };

  const handleUpdateComment = async (commentId: string): Promise<void> => {
    if (!editingCommentText.trim()) return;

    const text = editingCommentText.trim();

    try {
      const updated = await updateComment(issue._id, commentId, text);
      setComments((prev) => prev.map((c) => (c._id === commentId ? updated : c)));
      setEditingCommentId(null);
      setEditingCommentText('');
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to update comment:', err);
      handleIssueActionError(err, 'We could not update that comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string): Promise<void> => {
    const isConfirmed = await confirm({
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteComment(issue._id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      handleIssueActionError(err, 'We could not delete that comment. Please try again.');
    }
  };

  const handleSaveEstimate = async (): Promise<void> => {
    const parsed = estimateValue.trim() ? parseInt(estimateValue, 10) : undefined;
    if (parsed !== undefined && isNaN(parsed)) {
      showIssueWarning('Please enter a valid number of minutes.');
      return;
    }

    const oldEstimate = issue.estimatedTime;
    updateTaskStateInline(issue._id, { estimatedTime: parsed });
    setIsEditingEstimate(false);

    try {
      await updateTask(issue._id, { estimatedTime: parsed });
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to update estimated time:', err);
      updateTaskStateInline(issue._id, { estimatedTime: oldEstimate });
      setEstimateValue(oldEstimate?.toString() || '');
      handleIssueActionError(err, 'We could not update the estimate. Please try again.');
    }
  };

  const handleSaveStoryPoints = async (): Promise<void> => {
    const parsed = storyPointsValue.trim() ? parseInt(storyPointsValue, 10) : undefined;
    if (parsed !== undefined && isNaN(parsed)) {
      showIssueWarning('Please enter a valid number of story points.');
      return;
    }

    const oldPoints = issue.storyPoints;
    updateTaskStateInline(issue._id, { storyPoints: parsed });
    setIsEditingStoryPoints(false);

    try {
      await updateTask(issue._id, { storyPoints: parsed });
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to update story points:', err);
      updateTaskStateInline(issue._id, { storyPoints: oldPoints });
      setStoryPointsValue(oldPoints?.toString() || '');
      handleIssueActionError(err, 'We could not update the story points. Please try again.');
    }
  };

  const handleSprintChange = async (e: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
    const newSprintId = e.target.value === 'backlog' ? null : e.target.value;
    const oldSprintId = issue.sprintId;

    let newStatus = issue.status;
    if (!newSprintId && newStatus !== 'backlog') {
      newStatus = 'backlog';
    } else if (newSprintId && newStatus === 'backlog') {
      newStatus = 'todo';
    }

    updateTaskStateInline(issue._id, { sprintId: newSprintId, status: newStatus });

    try {
      await updateTask(issue._id, { sprintId: newSprintId, status: newStatus });
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to update sprint:', err);
      updateTaskStateInline(issue._id, { sprintId: oldSprintId, status: issue.status });
      handleIssueActionError(err, 'We could not update the sprint. Please try again.');
    }
  };

  const handleLogTime = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const durationNum = parseInt(logDuration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      showIssueWarning('Please enter a valid duration in minutes greater than 0.');
      return;
    }

    try {
      await logTime(issue._id, {
        duration: durationNum,
        description: logDescription.trim() || undefined,
        loggedAt: logDate ? new Date(logDate).toISOString() : undefined,
      });
      setLogDuration('');
      setLogDescription('');
      setIsLogTimeOpen(false);
      await fetchTimeLogs();
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to log time:', err);
      handleIssueActionError(err, 'We could not log that time entry. Please try again.');
    }
  };

  const handleDeleteLog = async (logId: string): Promise<void> => {
    const isConfirmed = await confirm({
      title: 'Delete Time Entry',
      message: 'Are you sure you want to delete this time entry?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await deleteTimeLog(issue._id, logId);
      await fetchTimeLogs();
      if (activeTab === 'history') {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Failed to delete time log:', err);
      handleIssueActionError(err, 'We could not delete that time entry. Please try again.');
    }
  };

  const formatHistoryDescription = (item: IHistoryData): React.ReactNode => {
    const userDisplayName = item.user
      ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || item.user.username
      : 'Someone';

    switch (item.action) {
      case 'create':
        return (
          <span>
            <strong className="font-semibold text-slate-805 dark:text-slate-200">{userDisplayName}</strong> created the task.
          </span>
        );
      case 'update': {
        const fieldName = item.field || 'task';
        const formattedField = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
        const oldVal = item.oldValue || 'None';
        const newVal = item.newValue || 'None';

        return (
          <span>
            <strong className="font-semibold text-slate-805 dark:text-slate-200">{userDisplayName}</strong> updated{' '}
            <span className="font-medium text-slate-605 dark:text-slate-350">{formattedField}</span> from{' '}
            <span className="italic text-slate-500">"{oldVal}"</span> to{' '}
            <span className="italic font-semibold text-slate-808 dark:text-slate-200">"{newVal}"</span>.
          </span>
        );
      }
      case 'comment':
        return (
          <span>
            <strong className="font-semibold text-slate-805 dark:text-slate-200">{userDisplayName}</strong> added a comment.
          </span>
        );
      case 'attachment':
        return (
          <span>
            <strong className="font-semibold text-slate-805 dark:text-slate-200">{userDisplayName}</strong> added an attachment.
          </span>
        );
      default:
        return (
          <span>
            <strong className="font-semibold text-slate-805 dark:text-slate-200">{userDisplayName}</strong> performed {item.action}.
          </span>
        );
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      {actionWarning && (
        <div className="fixed right-5 bottom-10 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-xl dark:border-amber-900/60 dark:bg-amber-950/90 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionWarning}</span>
        </div>
      )}
      {/* Top Header */}
      <div className="px-4 pt-4 pb-4 flex items-center justify-between border-b border-transparent dark:border-slate-800">
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-500">
          <Link href={`/projects/${projectKey}/board`} className="hover:underline">
            Projects
          </Link>
          <span>/</span>
          <Link href={`/projects/${projectKey}/board`} className="hover:underline">
            {project.name}
          </Link>
          <span>/</span>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium ml-1 dark:text-slate-300">
            <IssueTypeIcon type={issue.type} />
            <span>{issue.taskKey}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          {activeViewers.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-xs text-slate-400">Viewing now:</span>
              <div className="flex -space-x-1.5">
                {activeViewers.map((viewer) => {
                  const initials = viewer.name ? viewer.name.charAt(0).toUpperCase() : 'U';
                  return (
                    <div
                      key={viewer.userId}
                      className="w-6 h-6 rounded-full border border-white bg-slate-200 text-slate-700 dark:border-slate-950 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-semibold overflow-hidden"
                      title={`${viewer.name} is viewing this task`}
                    >
                      {viewer.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={viewer.avatar} alt={viewer.name} className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* <button className="p-1.5 hover:bg-slate-100 rounded-sm transition-colors flex items-center gap-1.5 text-sm dark:hover:bg-slate-900">
            <Share2 className="w-4 h-4" /> Share
          </button> */}
          <button
            onClick={handleToggleWatch}
            className={`p-1.5 rounded-sm transition-colors flex items-center gap-1.5 text-sm ${isWatching
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-[#85B8FF] dark:hover:bg-blue-950/60'
              : 'hover:bg-slate-100 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            title={isWatching ? 'Stop watching this issue' : 'Watch this issue'}
          >
            {isWatching ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isWatching ? 'Watching' : 'Watch'}</span>
            <span className="ml-0.5 px-1 bg-slate-200 dark:bg-slate-800 text-xs rounded-sm text-slate-600 dark:text-slate-400">
              {watchersCount}
            </span>
          </button>
          {/* <button className="p-1.5 hover:bg-slate-100 rounded-sm transition-colors flex items-center gap-1.5 text-sm dark:hover:bg-slate-900">
            <ThumbsUp className="w-4 h-4" />
          </button> */}
          {/* <button className="p-1.5 hover:bg-slate-100 rounded-sm transition-colors dark:hover:bg-slate-900">
            <MoreHorizontal className="w-5 h-5" />
          </button> */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col lg:flex-row gap-10">
        {/* Left Column - Main Content */}
        <div className="flex-[2] min-w-0">
          <h1 className="text-2xl font-semibold mb-4 hover:bg-slate-55 p-1 -ml-1 rounded-sm cursor-text transition-colors dark:hover:bg-slate-900">
            {issue.title}
          </h1>

          <div className="flex items-center gap-2 mb-4 text-sm text-slate-600 font-medium dark:text-slate-300">
            <input
              type="file"
              id="attachment-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
            />
            <button
              onClick={() => document.getElementById('attachment-upload')?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-sm transition-colors dark:bg-slate-900 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Attach'}
            </button>
            <button
              onClick={() => setIsLinkIssueOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-sm transition-colors dark:bg-slate-900 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" /> Link issue
            </button>
          </div>

          {/* Description Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-3 dark:text-slate-100">Description</h3>
            {isEditingDesc ? (
              <div className="space-y-3">
                <textarea
                  value={descValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescValue(e.target.value)}
                  className="w-full min-h-[150px] p-3 border border-blue-500 rounded-sm outline-none resize-y text-sm focus:ring-1 focus:ring-blue-500 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-[#579DFF]"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDesc}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingDesc(false);
                      setDescValue(issue.description || '');
                    }}
                    className="text-slate-650 hover:bg-slate-100 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  if (canEditTask(issue) && !(hasRole('developer') || hasRole('qa_tester'))) {
                    setIsEditingDesc(true);
                  }
                }}
                className={'text-slate-700 text-sm min-h-[100px] p-2 -ml-2 rounded-sm transition-colors dark:text-slate-300 ' + ((canEditTask(issue) && !(hasRole('developer') || hasRole('qa_tester'))) ? 'cursor-text hover:bg-slate-50 dark:hover:bg-slate-900' : 'cursor-default')}
              >
                {issue.description || (
                  <span className="text-slate-400 italic dark:text-slate-500">Add a description...</span>
                )}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {(attachments.length > 0 || attachmentsLoading) && (
            <div className="mb-6 border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Attachments</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-400 font-medium">
                    {attachments.length}
                  </span>
                </div>
                <button
                  onClick={() => document.getElementById('attachment-upload')?.click()}
                  disabled={uploading}
                  className="text-xs text-blue-600 hover:underline dark:text-[#579DFF] font-medium cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : '+ Add'}
                </button>
              </div>

              {attachmentsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((attachment) => {
                    const isImage = attachment.mimeType.startsWith('image/');
                    const uploader = attachment.uploadedBy;
                    const uploaderName = uploader
                      ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || uploader.username || 'User'
                      : 'Unknown';

                    return (
                      <div
                        key={attachment._id}
                        className="group flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
                      >
                        {/* Thumbnail / Icon */}
                        {isImage ? (
                          <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <img
                              src={attachment.fileUrl}
                              alt={attachment.fileName}
                              className="w-12 h-12 object-cover rounded-md border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ) : (
                          <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                              <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </div>
                          </a>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate block hover:text-blue-600 dark:hover:text-[#579DFF] transition-colors"
                            title={attachment.fileName}
                          >
                            {attachment.fileName}
                          </a>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatFileSize(attachment.fileSize)} · {uploaderName} · {formatDate(attachment.createdAt)}
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteAttachment(attachment._id)}
                          className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer shrink-0"
                          title="Delete attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Checklist Section */}
          <div className="mb-8 border-t border-slate-100 pt-6 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Checklist</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-400 font-medium">
                  {completedChecklistCount}/{totalChecklistCount}
                </span>
              </div>
            </div>

            {/* Checklist Progress Bar */}
            {totalChecklistCount > 0 && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden dark:bg-slate-800">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(completedChecklistCount / totalChecklistCount) * 100}%` }}
                />
              </div>
            )}

            {/* Checklist Items list */}
            {totalChecklistCount > 0 ? (
              <div className="space-y-1 mb-3">
                {issue.checklist.map((item: IChecklistItem) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between group py-1.5 px-2 hover:bg-slate-50 rounded-md transition-colors dark:hover:bg-slate-900/40"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => handleToggleChecklistItem(item._id, item.isCompleted)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 cursor-pointer"
                      />
                      <span
                        className={`text-sm text-slate-700 dark:text-slate-300 truncate ${item.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                      >
                        {item.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteChecklistItem(item._id)}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                      title="Delete checklist item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Add Checklist Item Form */}
            <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add checklist item..."
                value={newChecklistItemTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewChecklistItemTitle(e.target.value)}
                className="flex-1 h-8 px-3 border border-slate-300 rounded-sm text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 h-8 px-3 rounded-sm text-sm font-medium transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Activity / Comments Section */}
          <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Activity</h3>
              <div className="flex bg-slate-100 p-0.5 rounded-md dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer ${activeTab === 'comments'
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-805 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                    }`}
                >
                  Comments
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-all cursor-pointer ${activeTab === 'history'
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-805 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
                    }`}
                >
                  History
                </button>
              </div>
            </div>

            {activeTab === 'comments' ? (
              <>
                {/* Comment Input */}
                <div className="flex gap-4 mb-6">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden select-none">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <form onSubmit={handleAddComment} className="flex-1">
                    {isCommentInputFocused ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <textarea
                            placeholder="Add a comment..."
                            value={newCommentText}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              handleTextareaChange(e.target.value, e.target.selectionStart, 'new');
                            }}
                            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                              handleTextareaKeyDown(e, newCommentText, 'new');
                            }}
                            className="w-full min-h-[100px] p-3 border border-slate-300 rounded-sm outline-none resize-y text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            autoFocus
                          />
                          {renderMentionDropdown('new')}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCommentInputFocused(false);
                              setNewCommentText('');
                            }}
                            className="text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-905 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        onFocus={() => setIsCommentInputFocused(true)}
                        className="w-full h-9 px-3 border border-slate-300 rounded-sm text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 cursor-text"
                      />
                    )}
                  </form>
                </div>

                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 italic mb-3 ml-12 dark:text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    <span>
                      {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                )}

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => {
                      const author = comment.author;
                      const isAuthor = author?._id === user?._id || author?._id === user?.id;
                      const displayName = author
                        ? author.firstName && author.lastName
                          ? `${author.firstName} ${author.lastName}`
                          : author.name || author.username || 'Team Member'
                        : 'Unknown User';

                      const isEditing = editingCommentId === comment._id;

                      return (
                        <div key={comment._id} className="flex gap-4 group">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-705 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden select-none border border-slate-100 dark:border-slate-800">
                            {author?.avatar ? (
                              <img src={author.avatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-semibold text-sm text-slate-800 dark:text-slate-205">
                                {displayName}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>

                            {isEditing ? (
                              <div className="space-y-2 mt-1">
                                <div className="relative">
                                  <textarea
                                    value={editingCommentText}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                      handleTextareaChange(e.target.value, e.target.selectionStart, 'edit');
                                    }}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                      handleTextareaKeyDown(e, editingCommentText, 'edit');
                                    }}
                                    className="w-full min-h-[80px] p-2 border border-blue-500 rounded-sm outline-none text-sm bg-white text-slate-900 dark:bg-slate-909 dark:text-slate-100 dark:border-[#579DFF]"
                                  />
                                  {renderMentionDropdown('edit')}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateComment(comment._id)}
                                    className="bg-blue-600 hover:bg-blue-707 text-white px-2.5 py-1 rounded-sm text-xs font-medium transition-colors cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditingCommentText('');
                                    }}
                                    className="text-slate-600 hover:bg-slate-101 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors dark:text-slate-303 dark:hover:bg-slate-900 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-sm text-slate-700 dark:text-slate-300 break-words pr-4 whitespace-pre-wrap">
                                  {comment.content}
                                </div>
                                <div className="flex items-center flex-wrap gap-2 mt-2">
                                  {/* Grouped Reactions */}
                                  {(() => {
                                    const grouped: Record<string, string[]> = {};
                                    if (comment.reactions) {
                                      comment.reactions.forEach((r) => {
                                        if (r.userId && r.emoji) {
                                          if (!grouped[r.emoji]) {
                                            grouped[r.emoji] = [];
                                          }
                                          const rUid = typeof r.userId === 'object' && r.userId !== null ? r.userId._id : String(r.userId);
                                          grouped[r.emoji].push(rUid);
                                        }
                                      });
                                    }

                                    return Object.entries(grouped).map(([emoji, userIds]) => {
                                      const hasReacted = userIds.includes(user?._id || user?.id || '');
                                      return (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleToggleReaction(comment._id, emoji)}
                                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer border ${hasReacted
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                            : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                                            }`}
                                          title={emoji}
                                        >
                                          <span>{emoji}</span>
                                          <span className="text-[10px]">{userIds.length}</span>
                                        </button>
                                      );
                                    });
                                  })()}

                                  {/* Add reaction emoji trigger */}
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setActivePickerCommentId(activePickerCommentId === comment._id ? null : comment._id)}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 text-slate-500 border border-slate-105 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800 cursor-pointer"
                                      title="Add reaction"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>

                                    {activePickerCommentId === comment._id && (
                                      <div className="absolute z-40 bottom-8 left-0 flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-lg dark:bg-slate-950 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                        {['👍', '❤️', '🔥', '👏', '😂', '🎉', '🚀'].map((emoji) => {
                                          const isReacted = comment.reactions?.some(
                                            (r) => {
                                              const rUid = typeof r.userId === 'object' && r.userId !== null ? r.userId._id : String(r.userId);
                                              return rUid === (user?._id || user?.id) && r.emoji === emoji;
                                            }
                                          );
                                          return (
                                            <button
                                              key={emoji}
                                              type="button"
                                              onClick={() => {
                                                handleToggleReaction(comment._id, emoji);
                                                setActivePickerCommentId(null);
                                              }}
                                              className={`w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-sm transition-transform hover:scale-110 cursor-pointer ${isReacted ? 'bg-blue-50 dark:bg-blue-950/60' : ''
                                                }`}
                                            >
                                              {emoji}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {isAuthor && (
                                    <div className="flex items-center gap-2 ml-1 text-slate-300 dark:text-slate-700">
                                      <span className="text-[10px] select-none">•</span>
                                      <button
                                        onClick={() => {
                                          setEditingCommentId(comment._id);
                                          setEditingCommentText(comment.content);
                                        }}
                                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:underline cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                      <span className="text-[10px] select-none">•</span>
                                      <button
                                        onClick={() => handleDeleteComment(comment._id)}
                                        className="text-xs text-slate-400 hover:text-red-500 hover:underline cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-400 border border-slate-200 border-dashed rounded-sm bg-slate-50 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-500">
                    No activity yet. Start the conversation by leaving a comment.
                  </div>
                )}
              </>
            ) : (
              /* History List */
              historyLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((item) => {
                    const author = item.user;
                    const displayName = author
                      ? author.firstName && author.lastName
                        ? `${author.firstName} ${author.lastName}`
                        : author.username || 'Team Member'
                      : 'Unknown User';

                    return (
                      <div key={item._id} className="flex gap-4 items-start text-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden select-none border border-slate-200 dark:border-slate-800">
                          {author?.avatar ? (
                            <img src={author.avatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 py-1">
                          <div className="text-slate-600 dark:text-slate-300">
                            {formatHistoryDescription(item)}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-slate-400 border border-slate-200 border-dashed rounded-sm bg-slate-50 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-500">
                  No history recorded for this task yet.
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="flex-1 max-w-sm">
          <div className="mb-4">
            <select
              value={issue.status}
              onChange={handleStatusChange}
              className="w-auto bg-slate-100 hover:bg-slate-200 border border-transparent font-semibold text-slate-700 text-sm rounded-sm px-3 py-1.5 outline-none transition-colors appearance-none cursor-pointer uppercase tracking-wider dark:bg-blue-950/50 dark:text-[#85B8FF] dark:hover:bg-blue-950 dark:border-blue-900/40"
            >
              {statusOptions.map((option) => (
                <option key={option.status} value={option.status}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="border border-slate-200 rounded-sm dark:border-slate-800">
            <div className="px-4 py-3 font-semibold text-sm border-b border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900">
              Details
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="flex">
                <div className="w-1/3 text-slate-500 font-medium dark:text-slate-500">Assignee</div>
                <div className="w-2/3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-medium overflow-hidden shrink-0">
                    {assignee ? (
                      assignee.avatarUrl ? (
                        <img src={assignee.avatarUrl} alt={assignee.name} className="w-full h-full object-cover" />
                      ) : (
                        assignee.name.charAt(0).toUpperCase()
                      )
                    ) : (
                      '?'
                    )}
                  </div>
                  <span className="text-slate-700 hover:bg-slate-100 px-1 py-0.5 rounded-sm cursor-pointer dark:text-slate-300 dark:hover:bg-slate-900 truncate">
                    {assignee ? assignee.name : 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="flex">
                <div className="w-1/3 text-slate-500 font-medium dark:text-slate-500">Reporter</div>
                <div className="w-2/3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px] font-medium overflow-hidden shrink-0">
                    {reporter ? (
                      reporter.avatarUrl ? (
                        <img src={reporter.avatarUrl} alt={reporter.name} className="w-full h-full object-cover" />
                      ) : (
                        reporter.name.charAt(0).toUpperCase()
                      )
                    ) : (
                      '?'
                    )}
                  </div>
                  <span className="text-slate-700 hover:bg-slate-100 px-1 py-0.5 rounded-sm cursor-pointer dark:text-slate-300 dark:hover:bg-slate-900 truncate">
                    {reporter ? reporter.name : 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="flex">
                <div className="w-1/3 text-slate-500 font-medium dark:text-slate-500">Priority</div>
                <div className="w-2/3 flex items-center gap-2 hover:bg-slate-100 px-1 py-0.5 rounded-sm cursor-pointer -ml-1 w-max dark:hover:bg-slate-900">
                  <PriorityIcon priority={issue.priority} />
                  <span className="text-slate-700 dark:text-slate-300 capitalize">{issue.priority}</span>
                </div>
              </div>

              <div className="flex">
                <div className="w-1/3 text-slate-500 font-medium dark:text-slate-500">Sprint</div>
                <div className="w-2/3">
                  <select
                    value={issue.sprintId || 'backlog'}
                    onChange={handleSprintChange}
                    className="w-auto bg-transparent hover:bg-slate-100 border border-transparent font-medium text-blue-600 text-sm rounded-sm px-1 py-0.5 outline-none transition-colors cursor-pointer dark:text-[#579DFF] dark:hover:bg-slate-900"
                  >
                    <option value="backlog">Backlog</option>
                    {sprints?.filter(s => s.status === 'active' || s.status === 'planned').map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-1/3 text-slate-500 font-medium dark:text-slate-500">Story point</div>
                <div className="w-2/3">
                  {isEditingStoryPoints ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={storyPointsValue}
                        onChange={(e) => setStoryPointsValue(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-16 h-7 px-1.5 border border-slate-300 rounded-sm text-xs bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveStoryPoints}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded-sm hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingStoryPoints(false);
                          setStoryPointsValue(issue.storyPoints?.toString() || '');
                        }}
                        className="text-slate-500 hover:bg-slate-100 text-xs px-2 py-1 rounded-sm transition-colors dark:text-slate-300 dark:hover:bg-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    (() => {
                      const createdById = typeof issue?.createdBy === 'object' ? issue.createdBy?._id : issue?.createdBy;
                      const currentUserId = user?._id || user?.id;
                      const isCreator = createdById && currentUserId && String(createdById) === String(currentUserId);
                      const isOrgAdmin = hasRole('org_admin') || hasRole('superadmin');
                      const canEditStoryPoints = isCreator || isOrgAdmin;

                      return (
                        <span
                          onClick={() => {
                            if (canEditStoryPoints) {
                              setIsEditingStoryPoints(true);
                            }
                          }}
                          className={`bg-slate-100 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-700 transition-colors dark:bg-slate-800 dark:text-slate-300 ${canEditStoryPoints
                              ? 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700'
                              : 'cursor-default opacity-80'
                            }`}
                        >
                          {issue.storyPoints || 'Add points'}
                        </span>
                      );
                    })()
                  )}
                </div>
              </div>              {/* Labels */}
              <div className="flex items-start relative">
                <div className="w-1/3 text-slate-500 font-medium dark:text-slate-500 pt-0.5">Labels</div>
                <div className="w-2/3">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {taskLabelIds.length > 0 ? (
                      taskLabelIds.map((labelId) => {
                        const label = allLabels.find((l) => l._id === labelId);
                        if (!label) return null;
                        return (
                          <span
                            key={labelId}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors"
                            style={{
                              backgroundColor: label.color + '18',
                              borderColor: label.color + '40',
                              color: label.color,
                            }}
                          >
                            {label.name}
                            <button
                              onClick={() => handleDetachLabel(labelId)}
                              className="hover:opacity-70 cursor-pointer ml-0.5"
                              title="Remove label"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-slate-400 italic text-xs">No labels</span>
                    )}
                    <button
                      onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 cursor-pointer"
                      title="Add label"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Label Dropdown */}
                  {showLabelDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-30 dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-1">
                          Select labels
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {allLabels.length > 0 ? (
                          allLabels.map((label) => {
                            const isAttached = taskLabelIds.includes(label._id);
                            return (
                              <button
                                key={label._id}
                                disabled={labelLoading}
                                onClick={() =>
                                  isAttached
                                    ? handleDetachLabel(label._id)
                                    : handleAttachLabel(label._id)
                                }
                                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 text-left"
                              >
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 border"
                                  style={{ backgroundColor: label.color, borderColor: label.color }}
                                />
                                <span className="flex-1 text-slate-700 dark:text-slate-300 truncate text-xs font-medium">
                                  {label.name}
                                </span>
                                {isAttached && (
                                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-[#579DFF] shrink-0" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-xs text-slate-400 italic">No labels yet</div>
                        )}
                      </div>
                      {/* Create new label inline */}
                      <form
                        onSubmit={handleCreateAndAttachLabel}
                        className="border-t border-slate-100 dark:border-slate-800 p-2"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-1.5">
                          Create new label
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                            className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                            title="Pick label color"
                          />
                          <input
                            type="text"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            placeholder="Label name..."
                            className="flex-1 h-7 px-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                          />
                          <button
                            type="submit"
                            disabled={labelLoading || !newLabelName.trim()}
                            className="h-7 px-2 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      </form>
                      {/* Close button */}
                      <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-1.5">
                        <button
                          onClick={() => setShowLabelDropdown(false)}
                          className="w-full text-center text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Watchers Avatar List */}
              <div className="flex items-start">
                <div className="w-1/3 text-slate-500 font-medium dark:text-slate-500">Watchers</div>
                <div className="w-2/3">
                  <div className="flex flex-wrap gap-1 items-center">
                    {issue.watchers && issue.watchers.length > 0 ? (
                      issue.watchers.map((watcherId: string) => {
                        const member = getMember(watcherId);
                        if (!member) return null;
                        return (
                          <div
                            key={watcherId}
                            title={member.name}
                            className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-semibold border border-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-205 overflow-hidden shrink-0"
                          >
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name.charAt(0).toUpperCase()
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-slate-400 italic text-xs">No watchers</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Tracking Widget */}
              <div className="border-t border-slate-200 pt-4 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-slate-500 font-medium dark:text-slate-500">Time tracking</div>
                  <button
                    onClick={() => setIsLogTimeOpen(true)}
                    className="text-xs text-blue-600 hover:underline dark:text-[#579DFF] font-medium cursor-pointer"
                  >
                    Log work
                  </button>
                </div>

                <div className="space-y-1">
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden dark:bg-slate-800 relative">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(issue.estimatedTime || 0) > 0 ? Math.min(Math.round((totalLoggedMinutes / (issue.estimatedTime || 1)) * 100), 100) : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{totalLoggedMinutes}m logged</span>
                    <span>{(issue.estimatedTime || 0) > 0 ? `${issue.estimatedTime}m estimated` : 'No estimate'}</span>
                  </div>
                </div>

                {/* Estimate Editor */}
                <div className="flex items-center">
                  <div className="w-1/3 text-slate-500 font-medium dark:text-slate-500">Estimate</div>
                  <div className="w-2/3">
                    {isEditingEstimate ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={estimateValue}
                          onChange={(e) => setEstimateValue(e.target.value)}
                          placeholder="e.g. 60"
                          className="w-16 h-7 px-1.5 border border-slate-300 rounded-sm text-xs bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEstimate}
                          className="bg-blue-600 text-white text-xs px-2 py-1 rounded-sm hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingEstimate(false);
                            setEstimateValue(issue.estimatedTime?.toString() || '');
                          }}
                          className="text-slate-500 hover:bg-slate-100 text-xs px-2 py-1 rounded-sm transition-colors dark:text-slate-300 dark:hover:bg-slate-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => setIsEditingEstimate(true)}
                        className="bg-slate-100 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-205 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-707"
                      >
                        {issue.estimatedTime ? `${issue.estimatedTime}m` : 'Add estimate'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Logged Work List */}
                {timeLogs.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto pr-1 border-t border-slate-100 pt-2 dark:border-slate-800/60">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400 mb-1">Time Logs</div>
                    {timeLogs.map((log) => {
                      const logAuthor = log.user;
                      const logDisplayName = logAuthor
                        ? `${logAuthor.firstName || ''} ${logAuthor.lastName || ''}`.trim() || logAuthor.username
                        : 'Unknown User';

                      return (
                        <div key={log._id} className="flex justify-between items-start text-xs border-b border-slate-101 pb-1.5 dark:border-slate-808/60 last:border-0 last:pb-0">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{logDisplayName}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500">{log.duration}m</span>
                            </div>
                            {log.description && <div className="text-slate-500 dark:text-slate-400 truncate mt-0.5 italic" title={log.description}>{log.description}</div>}
                          </div>
                          <button
                            onClick={() => handleDeleteLog(log._id)}
                            className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                            title="Delete work log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dependencies Widget */}
              <div className="border-t border-slate-200 pt-4 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-slate-500 font-medium dark:text-slate-500">Dependencies</div>
                  <button
                    onClick={() => setIsLinkIssueOpen(true)}
                    className="text-xs text-blue-600 hover:underline dark:text-[#579DFF] font-medium cursor-pointer"
                  >
                    Link issue
                  </button>
                </div>

                {dependenciesLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                ) : dependencies.length > 0 ? (
                  <div className="space-y-2">
                    {dependencies.map((dep) => {
                      const isTaskSubject = dep.task._id === issue._id;
                      const otherTask = isTaskSubject ? dep.dependsOn : dep.task;

                      let relationshipLabel = '';
                      if (dep.type === 'blocked-by') {
                        relationshipLabel = isTaskSubject ? 'is blocked by' : 'blocks';
                      } else {
                        relationshipLabel = isTaskSubject ? 'blocks' : 'is blocked by';
                      }

                      return (
                        <div
                          key={dep._id}
                          className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                                {relationshipLabel}
                              </span>
                              <Link
                                href={`/projects/${projectKey}/issues/${otherTask.taskKey}`}
                                className="font-semibold text-blue-600 hover:underline dark:text-[#579DFF]"
                              >
                                {otherTask.taskKey}
                              </Link>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded-sm font-medium ${otherTask.status === 'done'
                                  ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/40'
                                  : otherTask.status === 'blocked'
                                    ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                  }`}
                              >
                                {otherTask.status}
                              </span>
                            </div>
                            <div className="text-slate-600 dark:text-slate-400 truncate mt-1" title={otherTask.title}>
                              {otherTask.title}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveDependency(dep._id)}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer shrink-0 ml-1.5"
                            title="Remove dependency"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3 text-xs text-slate-400 italic">
                    No dependencies linked yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Work Modal */}
      {isLogTimeOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Log work</h3>
            <form onSubmit={handleLogTime} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Duration (minutes) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 60"
                  value={logDuration}
                  onChange={(e) => setLogDuration(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 rounded-sm text-sm bg-white text-slate-900 placeholder:text-slate-505 focus:border-blue-505 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 uppercase tracking-wider mb-1 dark:text-slate-400">Date Logged</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 rounded-sm text-sm bg-white text-slate-900 placeholder:text-slate-505 focus:border-blue-505 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 uppercase tracking-wider mb-1 dark:text-slate-400">Description</label>
                <textarea
                  placeholder="What did you work on?"
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  className="w-full min-h-[80px] p-3 border border-slate-300 rounded-sm outline-none resize-y text-sm focus:border-blue-505 focus:ring-1 focus:ring-blue-500 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogTimeOpen(false)}
                  className="text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-sm text-sm font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer"
                >
                  Log time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Issue Modal */}
      {isLinkIssueOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsLinkIssueOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg cursor-pointer"
            >
              &times;
            </button>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Link issue</h3>

            <form onSubmit={handleAddDependency} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">This issue...</label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as 'blocks' | 'blocked-by')}
                  className="w-full h-9 px-3 border border-slate-300 rounded-sm text-sm bg-white text-slate-900 focus:border-blue-505 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="blocked-by">is blocked by</option>
                  <option value="blocks">blocks</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Target Issue</label>
                <select
                  required
                  value={linkTargetTaskId}
                  onChange={(e) => setLinkTargetTaskId(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 rounded-sm text-sm bg-white text-slate-900 focus:border-blue-505 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Select a task...</option>
                  {tasks
                    .filter((t) => t._id !== issue?._id)
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.taskKey} - {t.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkIssueOpen(false)}
                  className="text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-sm text-sm font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || !linkTargetTaskId}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {linking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface IssuePageProps {
  params: Promise<{ projectKey: string; issueKey: string }>;
}

export default function IssuePage({ params }: IssuePageProps): React.JSX.Element {
  const unwrappedParams = use(params);
  return <IssuePageContent projectKey={unwrappedParams.projectKey} issueKey={unwrappedParams.issueKey} />;
}
