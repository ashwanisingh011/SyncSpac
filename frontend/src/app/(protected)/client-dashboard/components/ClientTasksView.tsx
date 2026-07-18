'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  Eye,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import type { Task } from '@/types/tasks';
import TaskDetailsDialog from './TaskDetailsDialog';

interface ClientTasksViewProps {
  tasks: Task[];
  loading: boolean;
  orgId: string;
  projectId: string;
  onRefresh: () => void;
}

type SortField = 'taskKey' | 'title' | 'dueDate' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

export default function ClientTasksView({
  tasks,
  loading,
  orgId,
  projectId,
  onRefresh,
}: ClientTasksViewProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Selected task details dialog state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const getPriorityWeight = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  };

  const getStatusWeight = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'blocked':
        return 5;
      case 'review':
        return 4;
      case 'testing':
        return 3;
      case 'in-progress':
        return 2;
      case 'todo':
        return 1;
      case 'done':
        return 0;
      default:
        return -1;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and Sort Tasks
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.taskKey.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Filter by type
    if (typeFilter) {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'priority') {
        comparison = getPriorityWeight(a.priority || '') - getPriorityWeight(b.priority || '');
      } else if (sortField === 'status') {
        comparison = getStatusWeight(a.status || '') - getStatusWeight(b.status || '');
      } else if (sortField === 'dueDate') {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = da - db;
      } else {
        const valA = String(a[sortField] || '').toLowerCase();
        const valB = String(b[sortField] || '').toLowerCase();
        comparison = valA.localeCompare(valB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, search, statusFilter, priorityFilter, typeFilter, sortField, sortOrder]);

  const getPriorityBadge = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'in-progress':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'review':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'testing':
        return 'bg-pink-50 text-pink-700 border-pink-100';
      case 'blocked':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search task title, key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none bg-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="testing">Testing</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none bg-white cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none bg-white cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="task">Task</option>
            <option value="bug">Bug</option>
            <option value="epic">Epic</option>
            <option value="story">Story</option>
            <option value="improvement">Improvement</option>
            <option value="subtask">Subtask</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : processedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-800">No tasks found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th
                      className="cursor-pointer px-5 py-3 hover:bg-slate-50"
                      onClick={() => handleSort('taskKey')}
                    >
                      <span className="flex items-center gap-1">Key <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th
                      className="cursor-pointer px-5 py-3 hover:bg-slate-50"
                      onClick={() => handleSort('title')}
                    >
                      <span className="flex items-center gap-1">Title <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="px-5 py-3">Type</th>
                    <th
                      className="cursor-pointer px-5 py-3 hover:bg-slate-50"
                      onClick={() => handleSort('status')}
                    >
                      <span className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th
                      className="cursor-pointer px-5 py-3 hover:bg-slate-50"
                      onClick={() => handleSort('priority')}
                    >
                      <span className="flex items-center gap-1">Priority <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th
                      className="cursor-pointer px-5 py-3 hover:bg-slate-50"
                      onClick={() => handleSort('dueDate')}
                    >
                      <span className="flex items-center gap-1">Due Date <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="px-5 py-3">Assignee</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {processedTasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== 'done';

                    return (
                      <tr key={task._id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-800 shrink-0">
                          {task.taskKey}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800 max-w-xs truncate">
                          {task.title}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 uppercase tracking-wide font-semibold text-[10px]">
                          {task.type || 'task'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full border px-2 py-0.5 font-bold uppercase text-[9px] ${getStatusBadge(
                              task.status
                            )}`}
                          >
                            {task.status?.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full border px-2 py-0.5 font-bold capitalize text-[9px] ${getPriorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority || 'None'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'No due date'}
                            </span>
                            {isOverdue && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-600 uppercase">
                                <AlertCircle className="h-2.5 w-2.5" /> Overdue
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {task.assignedTo && typeof task.assignedTo === 'object' ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-755 overflow-hidden shrink-0">
                                {(task.assignedTo as any).avatar ? (
                                  <img
                                    src={(task.assignedTo as any).avatar}
                                    alt={(task.assignedTo as any).name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  (task.assignedTo as any).name[0]
                                )}
                              </div>
                              <span className="font-semibold text-slate-700 max-w-[100px] truncate">
                                {(task.assignedTo as any).name}
                              </span>
                            </div>
                          ) : typeof task.assignedTo === 'string' ? (
                            <span className="font-semibold text-slate-700">{task.assignedTo}</span>
                          ) : (
                            <span className="italic text-slate-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskId(task._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-655 hover:bg-slate-50 hover:text-blue-600"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {processedTasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== 'done';

                const assigneeBlock = task.assignedTo && typeof task.assignedTo === 'object' ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-755 overflow-hidden shrink-0">
                      {(task.assignedTo as any).avatar ? (
                        <img
                          src={(task.assignedTo as any).avatar}
                          alt={(task.assignedTo as any).name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (task.assignedTo as any).name[0]
                      )}
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-350 truncate text-[11px]">
                      {(task.assignedTo as any).name}
                    </span>
                  </div>
                ) : typeof task.assignedTo === 'string' ? (
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] block mt-0.5">{task.assignedTo}</span>
                ) : (
                  <span className="italic text-slate-400 text-[11px] block mt-0.5">Unassigned</span>
                );

                return (
                  <div key={task._id} className="p-4.5 space-y-4 hover:bg-slate-50/40 transition-colors">
                    {/* Key & Title & Action button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-450 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                            {task.taskKey}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold shrink-0">
                            {task.type || 'task'}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1.5 text-xs leading-snug">
                          {task.title}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(task._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-205 px-2 py-1 text-[10px] font-semibold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 shrink-0 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                    </div>

                    {/* Status, Priority, Due Date & Assignee Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Status</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 font-bold uppercase text-[9px] ${getStatusBadge(
                            task.status
                          )}`}
                        >
                          {task.status?.replace('-', ' ')}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Priority</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 font-bold capitalize text-[9px] ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority || 'None'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Due Date</span>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-350 font-medium text-[11px]">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'No due date'}
                          </span>
                          {isOverdue && (
                            <span className="flex items-center gap-0.5 text-[8px] font-bold text-red-600 uppercase">
                              <AlertCircle className="h-2.5 w-2.5" /> Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Assignee</span>
                        {assigneeBlock}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Task Details Dialog popup */}
      {selectedTaskId && (
        <TaskDetailsDialog
          taskId={selectedTaskId}
          isOpen={true}
          onClose={() => {
            setSelectedTaskId(null);
            onRefresh();
          }}
          onTaskUpdated={onRefresh}
          orgId={orgId}
        />
      )}
    </div>
  );
}
