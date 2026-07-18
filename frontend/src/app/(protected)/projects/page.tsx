"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProjects, createProject } from '@/api/projects';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import { Loader2 } from 'lucide-react';
import type { Project } from '@/types/projects';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

export default function ProjectsDashboard(): React.JSX.Element {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const { hasPermission } = usePermission();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>('');
  const [projectKey, setProjectKey] = useState<string>('');
  const [projectDesc, setProjectDesc] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const canCreateProject = hasPermission('create_project');

  const fetchProjects = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
      setError('');
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err, 'We could not load projects. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!projectName.trim() || !projectKey.trim()) {
      setModalError('Project name and key are required');
      return;
    }

    setModalError('');
    setModalLoading(true);
    try {
      await createProject({
        name: projectName.trim(),
        key: projectKey.trim().toUpperCase(),
        description: projectDesc.trim(),
      });
      
      // Reset form and close modal
      setProjectName('');
      setProjectKey('');
      setProjectDesc('');
      setIsModalOpen(false);
      
      // Refresh list
      fetchProjects();
    } catch (err: any) {
      setModalError(getFriendlyApiErrorMessage(err, 'We could not create that project. Please check the key and try again.'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setProjectName(val);
    // Auto-generate key from name if key hasn't been manually set or edited
    if (val.trim()) {
      const generatedKey = val
        .trim()
        .split(/\s+/)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      setProjectKey(generatedKey.substring(0, 5));
    } else {
      setProjectKey('');
    }
  };

  return (
    <div className="flex-1 p-4 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Projects</h1>
        {canCreateProject && (
          <button
            onClick={() => {
              setModalError('');
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer"
          >
            Create project
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-lg dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 mb-4">No projects found. Create one to get started!</p>
          {canCreateProject && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
            >
              Create your first project →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => {
            const ownerId = typeof project.owner === 'object' ? project.owner._id : project.owner;
            const isOwner = ownerId === (user?._id || user?.id);
            return (
              <Link
                key={project._id}
                href={`/projects/${project.key}/board`}
                className="group block border border-slate-200 rounded-md p-5 bg-white hover:shadow-md transition-all cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 flex items-center justify-center rounded-md font-bold text-lg dark:bg-blue-950 dark:text-blue-200">
                    {project.key.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors dark:text-slate-100 dark:group-hover:text-[#579DFF]">{project.name}</h3>
                    <div className="text-xs text-slate-500 uppercase tracking-wider dark:text-slate-500">{project.key}</div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4 h-10 line-clamp-2 dark:text-slate-400">{project.description || 'No description provided.'}</p>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Role: <span className="font-medium text-slate-700 dark:text-slate-300">{isOwner ? 'Project Owner' : 'Project Member'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateProject} className="bg-white rounded-md shadow-lg w-full max-w-md p-6 dark:border dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Create Project</h2>
            
            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-200">
                {modalError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Redesign"
                  value={projectName}
                  onChange={handleNameChange}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WEB"
                  value={projectKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  maxLength={5}
                />
                <p className="text-xs text-slate-400 mt-1">Short identifier used as a prefix for tasks (e.g. WEB-1).</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                <textarea
                  placeholder="Describe your project"
                  value={projectDesc}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors font-medium dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
