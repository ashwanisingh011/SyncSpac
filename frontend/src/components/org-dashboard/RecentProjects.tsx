'use client';

import { ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import type { Project } from '@/types/projects';
import type { Task } from '@/types/tasks';

interface RecentProjectsProps {
  projects: Project[];
  allTasks: Task[];
  onProjectSelect?: (key: string, id: string) => void;
  onViewAllProjects?: () => void;
}

const statusConfig: Record<string, { label: string; badge: string }> = {
  active:     { label: 'In Progress', badge: 'bg-[#DEEBFF] text-[#0747A6] dark:bg-blue-950/30 dark:text-blue-300' },
  completed:  { label: 'Completed',   badge: 'bg-[#E3FCEF] text-[#006644] dark:bg-emerald-950/30 dark:text-emerald-300' },
  'on-hold':  { label: 'On Hold',     badge: 'bg-[#FFF0B3] text-[#172B4D] dark:bg-amber-950/30 dark:text-amber-300' },
};

const projectColors = ['#0052CC', '#00A3BF', '#00875A', '#FFAB00', '#6554C0', '#DE350B'];

export default function RecentProjects({ projects, allTasks, onProjectSelect, onViewAllProjects }: RecentProjectsProps) {
  const enrichedProjects = useMemo(() => {
    return projects.slice(0, 6).map((project, idx) => {
      const projectTasks = allTasks.filter((t) => {
        const projectId = t.project && typeof t.project === 'object' ? t.project._id : t.project;
        return projectId === project._id;
      });
      const completedTasks = projectTasks.filter(
        (t) => t.status === 'done' || t.status === 'completed'
      );
      const total = project.taskCount || projectTasks.length;
      const done = completedTasks.length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        ...project,
        color: projectColors[idx % projectColors.length],
        progress,
        tasksTotal: total,
        tasksDone: done,
      };
    });
  }, [projects, allTasks]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded border border-[#DFE1E6] dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFE1E6] dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-[#091E42] dark:text-slate-100 font-sans">Recent Projects</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-sans">Active and recent project progress</p>
        </div>
        {onViewAllProjects ? (
          <button
            onClick={onViewAllProjects}
            className="text-xs font-semibold text-[#0052CC] dark:text-indigo-400 hover:underline flex items-center gap-1 font-sans cursor-pointer"
          >
            View all <ExternalLink className="w-3 h-3" />
          </button>
        ) : (
          <Link
            href="/dashboard/projects"
            className="text-xs font-semibold text-[#0052CC] dark:text-indigo-400 hover:underline flex items-center gap-1 font-sans"
          >
            View all <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-450 font-sans">No projects yet.</p>
          {onViewAllProjects ? (
            <button onClick={onViewAllProjects} className="text-xs text-[#0052CC] dark:text-indigo-400 hover:underline mt-1 font-sans cursor-pointer">
              Create your first project →
            </button>
          ) : (
            <Link href="/dashboard/projects" className="text-xs text-[#0052CC] dark:text-indigo-400 hover:underline mt-1 font-sans">
              Create your first project →
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#DFE1E6] dark:border-slate-800">
                  {['Project', 'Progress', 'Status', 'Deadline'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-5 py-3 font-sans"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrichedProjects.map((p) => {
                  const sc = statusConfig[p.status] ?? statusConfig.active;
                  return (
                    <tr
                      key={p._id}
                      className="border-b border-slate-100 dark:border-slate-805/50 last:border-0 hover:bg-[#F4F5F7]/40 dark:hover:bg-slate-805/30 transition-colors group"
                    >
                      {/* Project */}
                      <td className="px-5 py-3.5">
                        {onProjectSelect ? (
                          <button
                            onClick={() => onProjectSelect(p.key, p._id)}
                            className="flex items-center gap-3 text-left cursor-pointer"
                          >
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                              style={{ background: p.color }}
                            >
                              {p.key.substring(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#091E42] dark:text-slate-200 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors font-sans">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-slate-450 dark:text-slate-505 font-sans capitalize">{p.projectType}</p>
                            </div>
                          </button>
                        ) : (
                          <Link href={`/dashboard/projects/${p.key}`} className="flex items-center gap-3">
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                              style={{ background: p.color }}
                            >
                              {p.key.substring(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#091E42] dark:text-slate-200 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors font-sans">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-slate-450 dark:text-slate-505 font-sans capitalize">{p.projectType}</p>
                            </div>
                          </Link>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 min-w-[125px]">
                          <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${p.progress}%`, background: p.color }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans whitespace-nowrap shrink-0">
                            {p.progress}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 font-sans">
                          {p.tasksDone}/{p.tasksTotal} tasks
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-sans ${sc.badge}`}>
                          {sc.label}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-sans">
                            {new Date(p.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {enrichedProjects.map((p) => {
              const sc = statusConfig[p.status] ?? statusConfig.active;
              const linkContent = (
                <div className="flex items-center gap-3 text-left">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: p.color }}
                  >
                    {p.key.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#091E42] dark:text-slate-200 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors font-sans">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-sans capitalize">{p.projectType}</p>
                  </div>
                </div>
              );

              return (
                <div key={p._id} className="p-4 space-y-3 hover:bg-[#F4F5F7]/45 dark:hover:bg-slate-850/20 transition-colors">
                  {/* Title & Status */}
                  <div className="flex items-center justify-between gap-3">
                    {onProjectSelect ? (
                      <button onClick={() => onProjectSelect(p.key, p._id)} className="cursor-pointer">
                        {linkContent}
                      </button>
                    ) : (
                      <Link href={`/dashboard/projects/${p.key}`}>
                        {linkContent}
                      </Link>
                    )}

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-sans ${sc.badge}`}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Progress & Deadline Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-50 dark:border-slate-800/30 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Progress</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${p.progress}%`, background: p.color }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {p.progress}%
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-450 dark:text-slate-550 block mt-0.5 font-sans">
                        {p.tasksDone}/{p.tasksTotal} tasks
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Deadline</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                          {new Date(p.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
