'use client';

/**
 * /dashboard/all-tasks — All tasks view for org-owners.
 * Content extracted from OrgDashboard.tsx "tasks" view.
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useOrgDashboard } from '@/context/orgDashboardContext';

export default function AllTasksPage() {
  const router = useRouter();
  const { allTasks, projects, setSelectedTask, setIsTaskDrawerOpen } = useOrgDashboard();

  const tasksByProject = useMemo(() => {
    const map = new Map<string, typeof allTasks>();
    allTasks.forEach((task) => {
      const projectId = typeof task.project === 'object' ? task.project?._id : task.project;
      if (projectId) {
        if (!map.has(projectId)) {
          map.set(projectId, []);
        }
        map.get(projectId)!.push(task);
      }
    });
    return map;
  }, [allTasks]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Tasks</h1>
        <p className="text-xs text-slate-500 mt-1">View all tasks grouped by project in your organization.</p>
      </div>

      {allTasks.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
          <p className="text-slate-400 text-sm">No tasks found in this organization.</p>
        </div>
      ) : (
        <div className="space-y-6">
            {projects.map((project) => {
            const projectTasks = tasksByProject.get(project._id) || [];

            if (projectTasks.length === 0) return null;

            const completedCount = projectTasks.filter((t) => t.status === 'done' || t.status === 'completed').length;
            const pendingCount = projectTasks.length - completedCount;

            return (
              <div key={project._id} className="bg-transparent sm:bg-white dark:bg-slate-900 border-transparent sm:border sm:border-slate-100 sm:dark:border-slate-800 rounded-2xl sm:overflow-hidden sm:shadow-sm space-y-4 sm:space-y-0">
                {/* Project Group Header */}
                <div className="flex items-center justify-between p-4 sm:px-5 sm:py-4 border border-slate-100 dark:border-slate-800 sm:border-none rounded-xl sm:rounded-none bg-white sm:bg-slate-50/50 dark:bg-slate-955 shadow-xs sm:shadow-none">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center justify-center rounded-lg font-bold text-sm">
                      {project.key.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {project.name}
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {project.key}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-0.5">
                        {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'} &bull; {completedCount} completed &bull; {pendingCount} pending
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/projects/${project.key}`)}
                    className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Go to Board <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Desktop View Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <th className="text-left px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task</th>
                        <th className="text-left px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="text-left px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                        <th className="text-left px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignee</th>
                        <th className="text-left px-5 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {projectTasks.map((task) => {
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' && task.status !== 'completed';
                        const assignee = task.assignedTo
                          ? typeof task.assignedTo === 'object' ? task.assignedTo.name : task.assignedTo
                          : 'Unassigned';
                        return (
                          <tr
                            key={task._id}
                            onClick={() => { setSelectedTask(task); setIsTaskDrawerOpen(true); }}
                            className="hover:bg-slate-50 dark:hover:bg-slate-955 cursor-pointer transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">{task.taskKey}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[250px]">{task.title}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-block text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                                task.status === 'done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-450'
                                : task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                                : task.status === 'review' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400'
                                : task.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>{task.status}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-block text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                                task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                : task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-450'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>{task.priority}</span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-655 dark:text-slate-400">{assignee}</td>
                            <td className="px-5 py-3.5">
                              {task.dueDate ? (
                                <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-655 dark:text-slate-400'}`}>
                                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                </span>
                              ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="block sm:hidden space-y-4">
                  {projectTasks.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' && task.status !== 'completed';
                    const assignee = task.assignedTo
                      ? typeof task.assignedTo === 'object' ? task.assignedTo.name : task.assignedTo
                      : 'Unassigned';
                    return (
                      <div
                        key={task._id}
                        onClick={() => { setSelectedTask(task); setIsTaskDrawerOpen(true); }}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm hover:shadow transition-all cursor-pointer"
                      >
                        {/* Task Key & Title */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                              {task.taskKey}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-tight">
                              {task.title}
                            </span>
                          </div>
                        </div>

                        {/* Status, Priority, Assignee & Due Date grid */}
                        <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Status</span>
                            <span className={`inline-block text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                              task.status === 'done' ? 'bg-emerald-105 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-450'
                              : task.status === 'in-progress' ? 'bg-blue-105 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                              : task.status === 'review' ? 'bg-violet-105 text-violet-700 dark:bg-violet-950 dark:text-violet-400'
                              : task.status === 'blocked' ? 'bg-red-105 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : 'bg-slate-105 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>{task.status}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Priority</span>
                            <span className={`inline-block text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                              task.priority === 'high' ? 'bg-red-105 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : task.priority === 'medium' ? 'bg-amber-105 text-amber-700 dark:bg-amber-950 dark:text-amber-450'
                              : 'bg-slate-105 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>{task.priority}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Assignee</span>
                            <span className="text-slate-700 dark:text-slate-300 block mt-1 font-medium leading-none">
                              {assignee}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">Due Date</span>
                            <div className="mt-1 leading-none">
                              {task.dueDate ? (
                                <span className={`font-semibold ${isOverdue ? 'text-red-655 dark:text-red-400' : 'text-slate-655 dark:text-slate-350'}`}>
                                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                </span>
                              ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
