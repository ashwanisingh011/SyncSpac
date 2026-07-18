'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectFormData } from '@/types/projects';
import { useTaskBridgeStore } from '@/store/useTaskBridgeStore';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '@/context/useToast';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import { isAccessRestrictedError } from '@/lib/accessErrors';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null; // If provided, edit mode is enabled
}

export default function ProjectFormModal({ isOpen, onClose, project }: ProjectFormModalProps) {
  const { createProject, updateProject } = useTaskBridgeStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);
  const isEdit = !!project;

  const [form, setForm] = useState<ProjectFormData>({
    name: '',
    key: '',
    description: '',
    projectType: 'software',
    visibility: 'private',
    defaultLayout: 'kanban',
  });

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        key: project.key,
        description: project.description || '',
        projectType: project.projectType,
        visibility: project.visibility,
        defaultLayout: project.defaultLayout,
      });
    } else {
      setForm({
        name: '',
        key: '',
        description: '',
        projectType: 'software',
        visibility: 'private',
        defaultLayout: 'kanban',
      });
    }
    setErrors({});
  }, [project, isOpen]);

  if (!isOpen) return null;

  // Auto-generate project key based on name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameVal = e.target.value;
    setForm((prev) => {
      const updated = { ...prev, name: nameVal };
      if (!isEdit && !prev.key) {
        // Generate a 3-4 letter uppercase key from name words
        const words = nameVal.trim().split(/\s+/);
        let generatedKey = '';
        if (words.length >= 2) {
          generatedKey = words
            .slice(0, 3)
            .map((w) => w[0])
            .join('');
        } else if (nameVal.length > 0) {
          generatedKey = nameVal.substring(0, 3);
        }
        updated.key = generatedKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
      }
      return updated;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Project name is required';
    if (!form.key.trim()) {
      errs.key = 'Project key is required';
    } else if (!/^[A-Z0-9]{2,10}$/.test(form.key)) {
      errs.key = 'Key must be 2-10 characters and contain only letters and numbers';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      if (isEdit && project) {
        await updateProject(project._id, form);
        showToast('Project updated successfully!', 'success');
      } else {
        await createProject(form);
        showToast('Project created successfully!', 'success');
      }
      onClose();
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setErrors({});
        setShowAccessRestricted(true);
        return;
      }

      const msg = getFriendlyApiErrorMessage(
        err,
        isEdit ? 'We could not update that project. Please try again.' : 'We could not create that project. Please try again.',
      );
      setErrors({ server: msg });
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {isEdit ? 'Update Project Settings' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable inputs wrapper */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
            {errors.server && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg text-xs text-red-655 dark:text-red-400">
                {errors.server}
              </div>
            )}

            {/* Project Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleNameChange}
                className={`w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                  errors.name ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="e.g. Acme Landing Redesign"
                required
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Project Key */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Project Key *
              </label>
              <input
                type="text"
                value={form.key}
                onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                disabled={isEdit}
                className={`w-full h-10 px-3 text-sm rounded-lg border bg-white dark:bg-slate-955 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.key ? 'border-red-500 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="e.g. ACM"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Short, unique uppercase code. Used as prefix for task identifiers (e.g. ACM-10).
              </p>
              {errors.key && <p className="text-xs text-red-500 mt-1">{errors.key}</p>}
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[80px] p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y"
                placeholder="Describe the project goal or scope..."
              />
            </div>

            {/* Grid Layout for Type, Visibility, Default Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Project Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Type
                </label>
                <select
                  value={form.projectType}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectType: e.target.value as any }))}
                  className="w-full h-10 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-500"
                >
                  <option value="software">Software</option>
                  <option value="marketing">Marketing</option>
                  <option value="hr">HR</option>
                  <option value="client">Client Project</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Visibility
                </label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm((prev) => ({ ...prev, visibility: e.target.value as any }))}
                  className="w-full h-10 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-700 dark:text-slate-205 outline-none transition-all focus:border-blue-500"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>

              {/* Default Layout */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Layout
                </label>
                <select
                  value={form.defaultLayout}
                  onChange={(e) => setForm((prev) => ({ ...prev, defaultLayout: e.target.value as any }))}
                  className="w-full h-10 px-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-500"
                >
                  <option value="kanban">Kanban Board</option>
                  <option value="list">List View</option>
                  <option value="calendar">Calendar</option>
                  <option value="timeline">Timeline</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-650 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
