'use client';

/**
 * /dashboard/projects — Projects list page for org-owners.
 * Content extracted from OrgDashboard.tsx "projects" view.
 */

import { useRouter } from 'next/navigation';
import { Folder, ArrowRight } from 'lucide-react';
import { useOrgDashboard } from '@/context/orgDashboardContext';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, setIsProjectModalOpen } = useOrgDashboard();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-xs text-slate-500 mt-1">Manage and monitor all active workspace projects.</p>
        </div>
        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-755 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-indigo-600/10 cursor-pointer"
        >
          Create project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
          <Folder className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No projects found in this workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() => router.push(`/dashboard/projects/${project.key}`)}
              className="group border border-slate-100 dark:border-slate-805 rounded-2xl p-5 bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-750 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center justify-center rounded-xl font-bold text-lg">
                  {project.key.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-650 transition-colors">
                    {project.name}
                  </h3>
                  <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider">
                    {project.key}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-450 mb-4 h-8 line-clamp-2 leading-relaxed">
                {project.description || 'No description provided.'}
              </p>
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-3.5 border-t border-slate-50 dark:border-slate-805/80">
                <span className="capitalize px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-medium">
                  {project.projectType || 'Software'}
                </span>
                <span className="flex items-center gap-0.5 text-indigo-650 dark:text-indigo-400 font-bold group-hover:underline">
                  View Board <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
