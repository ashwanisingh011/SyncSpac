'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckSquare,
  Paperclip,
  MessageSquare,
  User as UserIcon,
  Calendar,
  AlertCircle,
  ThumbsUp,
  Trash2,
  Download,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Smile,
  Type,
} from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useConfirm } from '@/context/useConfirm';
import { useToast } from '@/context/useToast';
import {
  getTaskById,
  updateTask,
  watchTask,
  unwatchTask,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getTaskComments,
  createComment,
  deleteComment,
  toggleCommentReaction,
  getTaskAttachments,
  createAttachment,
  deleteAttachment,
  type ICommentData,
  type IAttachmentData,
} from '@/api/tasks';
import { getWorkspaceMembers } from '@/api/workspace';
import type { IChecklistItem, WorkspaceMember } from '@/types/workspace';
import type { Task } from '@/types/tasks';
import { isClientMember } from '@/lib/assignableMembers';

interface TaskDetailsDialogProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: any) => void;
  orgId: string;
}

const EMOJI_PRESETS = ['👍', '❤️', '🔥', '👏', '😂', '🎉', '🚀'];

export default function TaskDetailsDialog({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  orgId,
}: TaskDetailsDialogProps): React.JSX.Element | null {
  const { user } = useAuth();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Collaboration stats
  const [comments, setComments] = useState<ICommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [attachments, setAttachments] = useState<IAttachmentData[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  // New Comment state
  const [newCommentText, setNewCommentText] = useState('');
  const [creatingComment, setCreatingComment] = useState(false);

  // Checklist state
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [creatingChecklist, setCreatingChecklist] = useState(false);

  // Active emoji picker
  const [activeCommentEmojiPicker, setActiveCommentEmojiPicker] = useState<string | null>(null);

  // Mentions autocomplete
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState(false);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Task details, comments, and attachments
  useEffect(() => {
    if (!isOpen || !taskId) return;

    const loadAll = async () => {
      setLoading(true);
      try {
        const [taskData, commentsData, attachmentsData, membersData] = await Promise.all([
          getTaskById(taskId).catch(() => null),
          getTaskComments(taskId).catch(() => []),
          getTaskAttachments(taskId).catch(() => []),
          getWorkspaceMembers(orgId).catch(() => []),
        ]);

        if (taskData) {
          setTask(taskData);
        }
        setComments(commentsData);
        setAttachments(attachmentsData);
        setWorkspaceMembers(membersData);
      } catch (err) {
        showToast('Failed to load task details', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [isOpen, taskId, orgId]);

  if (!isOpen) return null;

  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isWatching = task?.watchers?.some((w: string) => w === user?._id || w === user?.id);

  // Watch / Unwatch handler
  const handleToggleWatch = async () => {
    if (!task) return;
    try {
      const updated = isWatching ? await unwatchTask(task._id) : await watchTask(task._id);
      setTask(updated);
      onTaskUpdated?.(updated);
    } catch {
      showToast('Failed to update watcher preference', 'error');
    }
  };

  // Checklist handlers
  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !task) return;

    setCreatingChecklist(true);
    try {
      const newItem = await addChecklistItem(task._id, newChecklistTitle.trim());
      const updatedTask = {
        ...task,
        checklist: [...(task.checklist || []), newItem],
      };
      setTask(updatedTask);
      setNewChecklistTitle('');
      onTaskUpdated?.(updatedTask);
    } catch {
      showToast('Failed to add checklist item', 'error');
    } finally {
      setCreatingChecklist(false);
    }
  };

  const handleToggleChecklist = async (itemId: string, currentStatus: boolean) => {
    if (!task) return;
    try {
      const updatedItem = await updateChecklistItem(task._id, itemId, {
        isCompleted: !currentStatus,
      });
      const updatedTask = {
        ...task,
        checklist: task.checklist.map((item: IChecklistItem) =>
          item._id === itemId ? updatedItem : item
        ),
      };
      setTask(updatedTask);
      onTaskUpdated?.(updatedTask);
    } catch {
      showToast('Failed to toggle checklist item', 'error');
    }
  };

  const handleDeleteChecklist = async (itemId: string) => {
    if (!task) return;
    try {
      await deleteChecklistItem(task._id, itemId);
      const updatedTask = {
        ...task,
        checklist: task.checklist.filter((item: IChecklistItem) => item._id !== itemId),
      };
      setTask(updatedTask);
      onTaskUpdated?.(updatedTask);
    } catch {
      showToast('Failed to delete checklist item', 'error');
    }
  };

  // Attachment handlers
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    setAttachmentsLoading(true);
    try {
      const attachment = await createAttachment(task._id, file);
      setAttachments([...attachments, attachment]);
      showToast('Attachment uploaded successfully', 'success');
    } catch {
      showToast('Failed to upload file attachment', 'error');
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return;
    const isConfirmed = await confirm({
      title: 'Delete Attachment',
      message: 'Are you sure you want to delete this file attachment?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteAttachment(task._id, attachmentId);
      setAttachments(attachments.filter((a) => a._id !== attachmentId));
      showToast('Attachment deleted', 'success');
    } catch {
      showToast('Failed to delete attachment', 'error');
    }
  };

  // Comments handlers
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !task) return;

    setCreatingComment(true);
    try {
      const comment = await createComment(task._id, newCommentText);
      setComments([comment, ...comments]);
      setNewCommentText('');
      showToast('Comment posted', 'success');
    } catch {
      showToast('Failed to post comment', 'error');
    } finally {
      setCreatingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    const isConfirmed = await confirm({
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteComment(task._id, commentId);
      setComments(comments.filter((c) => c._id !== commentId));
      showToast('Comment deleted', 'success');
    } catch {
      showToast('Failed to delete comment', 'error');
    }
  };

  const handleCommentReaction = async (commentId: string, emoji: string) => {
    if (!task) return;
    try {
      const updated = await toggleCommentReaction(task._id, commentId, emoji);
      setComments(comments.map((c) => (c._id === commentId ? updated : c)));
      setActiveCommentEmojiPicker(null);
    } catch {
      showToast('Failed to update reaction', 'error');
    }
  };

  // Autocomplete Mentions logic
  const handleCommentChange = (val: string) => {
    setNewCommentText(val);

    const cursorIndex = textareaRef.current?.selectionStart ?? 0;
    const textBeforeCursor = val.slice(0, cursorIndex);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex >= textBeforeCursor.lastIndexOf(' ')) {
      const search = textBeforeCursor.slice(lastAtIndex + 1);
      setMentionTriggerIndex(lastAtIndex);
      setMentionSearch(search);
      setMentionDropdownOpen(true);
      setMentionActiveIndex(0);
    } else {
      setMentionDropdownOpen(false);
      setMentionTriggerIndex(-1);
    }
  };

  const selectMention = (member: WorkspaceMember) => {
    const username = member.username || member.name.toLowerCase().replace(/\s+/g, '');
    const mentionText = `@${username} `;

    const before = newCommentText.slice(0, mentionTriggerIndex);
    const after = newCommentText.slice(mentionTriggerIndex + mentionSearch.length + 1);
    const updated = before + mentionText + after;

    setNewCommentText(updated);
    setMentionDropdownOpen(false);
    setMentionTriggerIndex(-1);
    setMentionSearch('');

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mentionDropdownOpen) return;

    const filtered = workspaceMembers
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
      selectMention(filtered[mentionActiveIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMentionDropdownOpen(false);
      setMentionTriggerIndex(-1);
    }
  };

  // Filter members list for dropdown
  const filteredMembers = workspaceMembers
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

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex h-full max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              {task?.taskKey ?? 'Task Details'}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {task?.type ?? 'Task'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Details, Checklist, Attachments, Comments */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h2 className="text-xl font-bold text-slate-855 leading-snug">{task?.title}</h2>

              {/* Description */}
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Description
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-650">
                  {task?.description || <span className="italic text-slate-400">No description provided.</span>}
                </p>
              </div>

              {/* Checklist Section */}
              <div className="mt-6 border-t border-slate-50 pt-5">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <CheckSquare className="h-4 w-4" /> Checklist
                </h4>
                <ul className="mt-3 space-y-2">
                  {task?.checklist?.map((item: IChecklistItem) => (
                    <li
                      key={item._id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-50 bg-slate-50/40 px-3 py-2"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleChecklist(item._id, item.isCompleted)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={item.isCompleted ? 'line-through text-slate-450' : 'font-medium'}>
                          {item.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklist(item._id)}
                        className="text-slate-400 hover:text-red-650"
                        aria-label="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                <form onSubmit={handleAddChecklist} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    disabled={creatingChecklist}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={creatingChecklist || !newChecklistTitle.trim()}
                    className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </form>
              </div>

              {/* Attachments Section */}
              <div className="mt-6 border-t border-slate-50 pt-5">
                <h4 className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5"><Paperclip className="h-4 w-4" /> Attachments</span>
                  <label className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline">
                    <Plus className="h-3 w-3" /> Upload File
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleAttachmentUpload}
                      disabled={attachmentsLoading}
                    />
                  </label>
                </h4>

                {attachmentsLoading && (
                  <div className="mt-3 flex justify-center py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-650" />
                  </div>
                )}

                <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {attachments.map((file) => (
                    <li
                      key={file._id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800">{file.fileName}</p>
                        <p className="text-[10px] text-slate-400">{formatSize(file.fileSize)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <a
                          href={file.fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-1 text-slate-450 hover:bg-slate-100 hover:text-blue-600"
                          aria-label="Download attachment"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(file._id)}
                          className="rounded-lg p-1 text-slate-455 hover:bg-slate-100 hover:text-red-600"
                          aria-label="Delete attachment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comments Section */}
              <div className="mt-6 border-t border-slate-55 pt-5">
                <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <MessageSquare className="h-4 w-4" /> Discussion
                </h4>

                <form onSubmit={handleAddComment} className="relative mt-3 flex flex-col gap-2">
                  <textarea
                    ref={textareaRef}
                    placeholder="Add a comment... (use @ to mention members)"
                    value={newCommentText}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    disabled={creatingComment}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-850 focus:border-blue-500 focus:outline-none"
                    rows={3}
                  />

                  {/* Autocomplete Dropdown */}
                  {mentionDropdownOpen && filteredMembers.length > 0 && (
                    <ul className="absolute left-0 bottom-full mb-1 z-55 max-h-48 w-64 overflow-y-auto rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
                      {filteredMembers.map((member, index) => (
                        <li key={member.id || member.userId}>
                          <button
                            type="button"
                            onClick={() => selectMention(member)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${
                              index === mentionActiveIndex
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="h-5 w-5 rounded-full bg-blue-100 text-[10px] font-black text-blue-750 flex items-center justify-center shrink-0">
                              {member.name[0]}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold">{member.name}</p>
                              <p className="truncate text-[10px] text-slate-400">
                                @{member.username || member.name.toLowerCase().replace(/\s+/g, '')}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="submit"
                    disabled={creatingComment || !newCommentText.trim()}
                    className="self-end rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {creatingComment ? 'Posting...' : 'Comment'}
                  </button>
                </form>

                <ul className="mt-5 space-y-4">
                  {comments.map((comment) => {
                    const author = comment.author;
                    const initials = author?.name ? author.name[0] : 'U';
                    const hasReactions = comment.reactions && comment.reactions.length > 0;

                    return (
                      <li key={comment._id} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 text-xs font-bold text-white">
                          {author?.avatar ? (
                            <img
                              src={author.avatar}
                              alt={author?.name ?? 'User'}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between">
                            <p className="text-xs font-bold text-slate-800">{author?.name || 'Unknown User'}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleString(undefined, {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-slate-650 leading-relaxed white-space-pre-wrap">
                            {comment.content}
                          </p>

                          {/* Reactions & Reaction Actions */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {comment.reactions?.map((react, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleCommentReaction(comment._id, react.emoji)}
                                className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50/50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                              >
                                {react.emoji}
                              </button>
                            ))}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCommentEmojiPicker(
                                    activeCommentEmojiPicker === comment._id ? null : comment._id
                                  )
                                }
                                className="rounded-full p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                aria-label="Add reaction"
                              >
                                <Smile className="h-3.5 w-3.5" />
                              </button>

                              {activeCommentEmojiPicker === comment._id && (
                                <div className="absolute left-0 bottom-full mb-1.5 z-10 flex gap-1 rounded-full border border-slate-100 bg-white p-1.5 shadow-md">
                                  {EMOJI_PRESETS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => handleCommentReaction(comment._id, emoji)}
                                      className="text-sm transition-transform hover:scale-125"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {user && author && (user._id === author._id || user.id === author._id) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment._id)}
                                className="ml-auto text-[10px] font-bold text-slate-400 hover:text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Right Panel - Settings / Info Sidebar */}
            <div className="w-64 shrink-0 border-l border-slate-100 bg-slate-50/50 p-6 space-y-5 overflow-y-auto">
              {/* Watch Option */}
              <div>
                <button
                  type="button"
                  onClick={handleToggleWatch}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  {isWatching ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-slate-500" /> Stop Watching
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 text-blue-600" /> Watch Issue
                    </>
                  )}
                </button>
              </div>

              {/* Status */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    {task?.status?.replace('-', ' ')}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Priority
                </span>
                <div className="mt-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${getPriorityColor(
                      task?.priority
                    )}`}
                  >
                    {task?.priority ?? 'None'}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Due Date
                </span>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    {task?.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'No due date'}
                  </span>
                </div>
                {isOverdue && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-red-650">
                    <AlertCircle className="h-3 w-3" /> Overdue
                  </div>
                )}
              </div>

              {/* Assignee */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Assignee
                </span>
                {task?.assignedTo ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                      {task.assignedTo.avatar ? (
                        <img
                          src={task.assignedTo.avatar}
                          alt={task.assignedTo.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        task.assignedTo.name[0]
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {task.assignedTo.name}
                      </p>
                      <p className="truncate text-[9px] text-slate-400">
                        {task.assignedTo.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-xs italic text-slate-450">Unassigned</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
