'use client';

import { useMemo, useState } from 'react';
import { useClientDashboard } from '../layout';
import { useOrganization } from '@/context/useOrganization';
import {
  ListTodo,
  Calendar,
  AlertCircle,
  Search,
  ChevronUp,
  ChevronDown,
  FolderOpen,
} from 'lucide-react';
import TaskStatCards from '../components/TaskStatCards';
import { getCompletedTaskCount, getTaskStatusCounts } from '@/lib/taskStatus';
import type { Task } from '@/types/tasks';

function computeTaskStats(tasks: Task[]) {
  const completed = getCompletedTaskCount(tasks);
  const total = tasks.length;
  const active = total - completed;
  const progressPercent = total ? Math.round((completed / total) * 100) : 0;
  const statusOverview = getTaskStatusCounts(tasks);

  return { total, completed, active, progressPercent, statusOverview };
}

type SortField = 'title' | 'priority' | 'status' | 'dueDate';
type SortOrder = 'asc' | 'desc';

export default function ClientTasksPage(): React.JSX.Element {
  const { currentOrg } = useOrganization();
  const { selectedProject, tasks, loadingTasks } = useClientDashboard();

  // Stats
  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const priorityWeight = {
    highest: 5,
    high: 4,
    medium: 3,
    low: 2,
    lowest: 1,
  } as const;

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.taskKey.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'priority') {
        const wa = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
        const wb = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
        comparison = wa - wb;
      } else if (sortField === 'dueDate') {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        comparison = da - db;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3 w-3 shrink-0" />
    ) : (
      <ChevronDown className="h-3 w-3 shrink-0" />
    );
  };

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpen className="h-12 w-12 text-slate-350 mb-3 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-800">No Active Projects</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Select an active project first to view tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
          <ListTodo className="h-5 w-5 text-blue-650" /> Project Tasks Overview
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review tasks progress, priority ratings, and timelines.
        </p>
      </div>

      {/* Task Statistics */}
      <TaskStatCards stats={stats} />

      {/* Status counts pills */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Task Status Overview</h3>
          <p className="text-xs text-slate-400 dark:text-slate-455 mt-0.5">Summary of task progress in the current cycle</p>
        </div>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
          {stats.statusOverview.map((item) => (
            <div key={item.status} className={`rounded-xl border border-slate-100/50 dark:border-slate-800 border-l-4 px-4 py-3.5 hover:shadow-sm transition-all ${item.color}`}>
              <p className="text-xl font-black">{item.count}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Table & Filtering */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Filters bar */}
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="testing">Testing</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="highest">Highest</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="lowest">Lowest</option>
            </select>
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-x-auto">
          {loadingTasks && filteredAndSortedTasks.length === 0 ? (
            <div className="flex justify-center items-center py-16">
              <span className="text-xs text-slate-400">Updating tasks...</span>
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <p className="py-16 text-center text-xs text-slate-400">No tasks found matching current filters.</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                      <th className="px-5 py-3 select-none">Key</th>
                      <th
                        className="px-5 py-3 cursor-pointer select-none hover:bg-slate-100/50"
                        onClick={() => handleSort('title')}
                      >
                        <span className="flex items-center gap-1">Title <SortIcon field="title" /></span>
                      </th>
                      <th
                        className="px-5 py-3 cursor-pointer select-none hover:bg-slate-100/50"
                        onClick={() => handleSort('priority')}
                      >
                        <span className="flex items-center gap-1">Priority <SortIcon field="priority" /></span>
                      </th>
                      <th
                        className="px-5 py-3 cursor-pointer select-none hover:bg-slate-100/50"
                        onClick={() => handleSort('status')}
                      >
                        <span className="flex items-center gap-1">Status <SortIcon field="status" /></span>
                      </th>
                      <th
                        className="px-5 py-3 cursor-pointer select-none hover:bg-slate-100/50"
                        onClick={() => handleSort('dueDate')}
                      >
                        <span className="flex items-center gap-1">Due Date <SortIcon field="dueDate" /></span>
                      </th>
                      <th className="px-5 py-3 select-none">Assignee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedTasks.map((task) => {
                      const isOverdue =
                        task.dueDate &&
                        new Date(task.dueDate).getTime() < Date.now() &&
                        task.status !== 'done';

                      return (
                        <tr
                          key={task._id}
                          className="hover:bg-slate-50/30 text-xs"
                        >
                          <td className="px-5 py-3.5 font-bold text-slate-400">
                            {task.taskKey}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-800">{task.title}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold capitalize text-slate-655">{task.priority}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold capitalize text-slate-700">{task.status.replace('-', ' ')}</span>
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
                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-650 uppercase">
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
                              <span className="font-semibold text-slate-705">{task.assignedTo}</span>
                            ) : (
                              <span className="italic text-slate-400">Unassigned</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAndSortedTasks.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate).getTime() < Date.now() &&
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
                      <span className="font-semibold text-slate-705 dark:text-slate-300 truncate text-[11px]">
                        {(task.assignedTo as any).name}
                      </span>
                    </div>
                  ) : typeof task.assignedTo === 'string' ? (
                    <span className="font-semibold text-slate-705 dark:text-slate-300 text-[11px] block mt-0.5">{task.assignedTo}</span>
                  ) : (
                    <span className="italic text-slate-400 text-[11px] block mt-0.5">Unassigned</span>
                  );

                  return (
                    <div key={task._id} className="p-4.5 space-y-4 hover:bg-slate-50/40 transition-colors">
                      {/* Key & Title */}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                          {task.taskKey}
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 mt-2 text-xs leading-snug">
                          {task.title}
                        </p>
                      </div>

                      {/* Status, Priority, Due Date & Assignee Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Status</span>
                          <span className="font-bold capitalize text-slate-700 dark:text-slate-300 text-[11px]">
                            {task.status.replace('-', ' ')}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Priority</span>
                          <span className="font-semibold capitalize text-slate-655 dark:text-slate-350 text-[11px]">
                            {task.priority}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Due Date</span>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-355 font-medium text-[11px]">
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
                              <span className="flex items-center gap-0.5 text-[8px] font-bold text-red-655 uppercase">
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
      </div>
    </div>
  );
}
