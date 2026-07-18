'use client';

import { useClientDashboard } from '../layout';
import { FolderOpen, Folder, Loader2 } from 'lucide-react';
import ClientDocumentsView from '../components/ClientDocumentsView';
import clsx from 'clsx';

export default function ClientDocumentsPage(): React.JSX.Element {
  const { projects, selectedProject, setSelectedProject, loadingProjects } = useClientDashboard();

  if (loadingProjects) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-650 mb-2" />
        <span className="text-sm">Loading projects...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpen className="h-12 w-12 text-slate-350 mb-3 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-800">No Active Projects</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          You are not currently assigned to any active projects.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-140px)]">
      {/* Left Sidebar - Project List */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Projects
          </h3>
          <p className="text-xs text-slate-450 mt-0.5">Select a project to explore files</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[300px] lg:max-h-[600px]">
          {projects.map((proj) => {
            const isActive = proj._id === selectedProject?._id;
            return (
              <button
                key={proj._id}
                onClick={() => setSelectedProject(proj)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "text-slate-655 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/45 dark:hover:text-slate-200"
                )}
              >
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-450"
                )}>
                  {proj.key.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-855 dark:text-slate-200">{proj.name}</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">{proj.key}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content - Files Explorer */}
      <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {selectedProject ? (
          <ClientDocumentsView project={selectedProject} />
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400 min-h-[50vh]">
            <Folder className="w-12 h-12 text-slate-350 mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">No Project Selected</h3>
            <p className="text-xs text-slate-555 mt-0.5">Please select a project from the list on the left.</p>
          </div>
        )}
      </div>
    </div>
  );
}
