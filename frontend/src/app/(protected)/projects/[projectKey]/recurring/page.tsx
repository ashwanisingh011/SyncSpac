"use client";

import { useState, useEffect, use } from 'react';
import { useProjectData } from '@/context/projectDataContext';
import { getLabels, type ILabelData } from '@/api/labels';
import {
  getRecurringTasks,
  createRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
  type IRecurringTaskData
} from '@/api/recurringTasks';
import { getAssignableMembers } from '@/lib/assignableMembers';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle,
  X,
  Play
} from 'lucide-react';
import type { TaskStatus, TaskType } from '@/types/workspace';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import { isAccessRestrictedError } from '@/lib/accessErrors';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';
import { useConfirm } from '@/context/useConfirm';

interface RecurringPageProps {
  params: Promise<{ projectKey: string }>;
}

const CRON_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9:00 AM', value: '0 9 * * *' },
  { label: 'Every Monday at 9:00 AM', value: '0 9 * * 1' },
  { label: 'First day of every month at 9:00 AM', value: '0 9 1 * *' },
  { label: 'Custom Cron Expression', value: 'custom' },
];

export default function RecurringPage({ params }: RecurringPageProps): React.JSX.Element {
  const unwrappedParams = use(params);
  const projectKey = unwrappedParams.projectKey;
  const confirm = useConfirm();

  const { project, members, loading: projectLoading, error: projectError } = useProjectData();
  const assignableMembers = getAssignableMembers(members);

  // Component states
  const [templates, setTemplates] = useState<IRecurringTaskData[]>([]);
  const [labelsList, setLabelsList] = useState<ILabelData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<IRecurringTaskData | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formType, setFormType] = useState<TaskType>('task');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formEstimate, setFormEstimate] = useState<string>('');
  const [formAssignee, setFormAssignee] = useState<string>('');
  const [formSelectedLabels, setFormSelectedLabels] = useState<string[]>([]);
  const [formCronPreset, setFormCronPreset] = useState<string>('0 9 * * *');
  const [formCronCustom, setFormCronCustom] = useState<string>('0 9 * * *');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [modalSubmitLoading, setModalSubmitLoading] = useState<boolean>(false);

  // Fetch templates and labels
  const loadPageData = async (): Promise<void> => {
    if (!project?._id) return;
    setLoading(true);
    try {
      const [fetchedTemplates, fetchedLabels] = await Promise.all([
        getRecurringTasks(project._id),
        getLabels(project._id),
      ]);
      setTemplates(fetchedTemplates);
      setLabelsList(fetchedLabels);
      setPageError('');
    } catch (err: any) {
      console.error('Failed to load recurring task data:', err);
      setPageError(getFriendlyApiErrorMessage(err, 'We could not load recurring templates. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project?._id) {
      loadPageData();
    }
  }, [project?._id]);

  // Open modal for creation
  const handleOpenCreateModal = (): void => {
    setActionError('');
    setEditingTemplate(null);
    setFormTitle('');
    setFormDesc('');
    setFormType('task');
    setFormPriority('medium');
    setFormEstimate('');
    setFormAssignee('');
    setFormSelectedLabels([]);
    setFormCronPreset('0 9 * * *');
    setFormCronCustom('0 9 * * *');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (template: IRecurringTaskData): void => {
    setActionError('');
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormDesc(template.description || '');
    setFormType(template.type as TaskType);
    setFormPriority(template.priority);
    setFormEstimate(template.estimatedTime?.toString() || '');
    setFormAssignee(template.assignee?._id || '');
    setFormSelectedLabels(template.labels?.map(l => l._id) || []);
    setFormIsActive(template.isActive);

    const matchPreset = CRON_PRESETS.find(p => p.value === template.cronExpression);
    if (matchPreset) {
      setFormCronPreset(template.cronExpression);
      setFormCronCustom(template.cronExpression);
    } else {
      setFormCronPreset('custom');
      setFormCronCustom(template.cronExpression);
    }

    setIsModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveTemplate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!project?._id) return;
    if (!formTitle.trim()) {
      setActionError('Title is required.');
      return;
    }

    const cronValue = formCronPreset === 'custom' ? formCronCustom.trim() : formCronPreset;
    if (!cronValue) {
      setActionError('Cron expression is required.');
      return;
    }

    setModalSubmitLoading(true);
    setActionError('');
    try {
      const payload: any = {
        projectId: project._id,
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        type: formType,
        priority: formPriority,
        estimatedTime: formEstimate ? parseInt(formEstimate, 10) : undefined,
        assignee: formAssignee || undefined,
        labels: formSelectedLabels,
        cronExpression: cronValue,
        isActive: formIsActive,
      };

      if (editingTemplate) {
        await updateRecurringTask(editingTemplate._id, payload);
        showToast('Template updated successfully');
      } else {
        await createRecurringTask(payload);
        showToast('Recurring task template created successfully');
      }
      setActionError('');
      setIsModalOpen(false);
      await loadPageData();
    } catch (err: any) {
      console.error('Failed to save recurring template:', err);
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }
      setActionError(getFriendlyApiErrorMessage(err, 'We could not save that recurring template. Please try again.'));
    } finally {
      setModalSubmitLoading(false);
    }
  };

  // Toggle template active status directly in list
  const handleToggleActive = async (template: IRecurringTaskData): Promise<void> => {
    try {
      const updated = await updateRecurringTask(template._id, { isActive: !template.isActive });
      setTemplates(prev => prev.map(t => (t._id === template._id ? { ...t, isActive: updated.isActive, nextRunTime: updated.nextRunTime } : t)));
      showToast(`Template ${!template.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }
      setActionError(getFriendlyApiErrorMessage(err, 'We could not update that template status. Please try again.'));
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (templateId: string): Promise<void> => {
    const isConfirmed = await confirm({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this recurring task template?',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await deleteRecurringTask(templateId);
      setTemplates(prev => prev.filter(t => t._id !== templateId));
      showToast('Template deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }
      setActionError(getFriendlyApiErrorMessage(err, 'We could not delete that recurring template. Please try again.'));
    }
  };

  // Notification helper
  const showToast = (msg: string): void => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-danger/10 text-danger border-danger/25';
      case 'medium':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40';
      default:
        return 'bg-primary-subtle text-primary border-primary/25';
    }
  };

  if (projectLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (projectError || pageError || !project) {
    return (
      <div className="p-6 text-danger bg-danger/10 border border-danger/25 rounded-md m-4">
        {projectError || pageError || 'Project recurrent task settings could not be loaded.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface text-content p-6 overflow-y-auto">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed bottom-4 right-4 bg-success text-white px-4 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-slide-in text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-lg border border-warning/25 bg-warning/10 p-3 text-sm font-medium text-amber-800">
          {actionError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-line pb-4">
        <div>
          <div className="text-xs text-content-tertiary mb-1 uppercase tracking-wider font-semibold">Projects / {project.name}</div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" /> Recurring Tasks
          </h1>
          <p className="text-xs text-content-tertiary mt-1 max-w-xl">
            Configure automated task schedules. Templates in this list will periodically instantiate new tasks on your board.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto justify-center bg-primary hover:bg-primary-hover text-primary-content px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Schedule
        </button>
      </div>

      {/* List / Table */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-line rounded-lg bg-surface-sunken/20">
          <Clock className="w-12 h-12 text-content-tertiary mb-3" />
          <h3 className="text-md font-semibold text-content-secondary">No schedules configured</h3>
          <p className="text-xs text-content-tertiary mt-1 max-w-xs">
            Create templates for recurring tasks such as weekly reports, maintenance updates, or periodic reviews.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 bg-surface-hover hover:bg-surface-hover text-content-secondary px-4 py-2 rounded-md font-medium text-xs transition-colors cursor-pointer"
          >
            Create your first schedule
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block border border-line rounded-lg overflow-hidden shadow-sm bg-surface">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-sunken border-b border-line text-[10px] font-bold uppercase tracking-wider text-content-tertiary">
                  <th className="px-4 py-3">Schedule Title</th>
                  <th className="px-4 py-3">Schedule (Cron)</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Next Execution</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                {templates.map(template => {
                  const assigneeName = template.assignee
                    ? `${template.assignee.firstName || ''} ${template.assignee.lastName || ''}`.trim() || template.assignee.username
                    : 'Unassigned';

                  return (
                    <tr
                      key={template._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-4.5 font-medium max-w-xs">
                        <div className="font-semibold text-content truncate" title={template.title}>
                          {template.title}
                        </div>
                        {template.description && (
                          <div className="text-[10px] text-content-tertiary truncate mt-0.5" title={template.description}>
                            {template.description}
                          </div>
                        )}
                        {template.labels && template.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {template.labels.map(l => (
                              <span
                                key={l._id}
                                className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border"
                                style={{
                                  backgroundColor: l.color + '10',
                                  borderColor: l.color + '30',
                                  color: l.color
                                }}
                              >
                                {l.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4.5 font-mono text-[11px] text-content-secondary">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-content-tertiary" />
                          <span>{template.cronExpression}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4.5 capitalize font-medium text-content-secondary">
                        {template.type}
                      </td>
                      <td className="px-4 py-4.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getPriorityColor(template.priority)}`}>
                          {template.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4.5 text-content-secondary">
                        {assigneeName}
                      </td>
                      <td className="px-4 py-4.5 text-content-secondary">
                        {template.isActive ? formatDate(template.nextRunTime) : <span className="text-content-tertiary italic">Paused</span>}
                      </td>
                      <td className="px-4 py-4.5 text-center">
                        <button
                          onClick={() => handleToggleActive(template)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                            template.isActive ? 'bg-indigo-600' : 'bg-surface-hover'
                          }`}
                          title={template.isActive ? 'Pause Schedule' : 'Activate Schedule'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
                              template.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-4.5 text-right space-x-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(template)}
                          className="p-1.5 text-content-tertiary hover:text-primary hover:bg-surface-hover rounded transition-colors cursor-pointer inline-flex"
                          title="Edit Template"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template._id)}
                          className="p-1.5 text-content-tertiary hover:text-danger hover:bg-surface-hover rounded transition-colors cursor-pointer inline-flex"
                          title="Delete Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block lg:hidden space-y-4">
            {templates.map(template => {
              const assigneeName = template.assignee
                ? `${template.assignee.firstName || ''} ${template.assignee.lastName || ''}`.trim() || template.assignee.username
                : 'Unassigned';

              return (
                 <div
                  key={template._id}
                  className="bg-surface border border-line rounded-xl p-4.5 space-y-4 shadow-sm"
                >
                  {/* Title & Type Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-content text-sm leading-snug block break-words">
                        {template.title}
                      </span>
                      {template.description && (
                        <span className="text-xs text-content-tertiary block break-words mt-1">
                          {template.description}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px] bg-surface-hover text-content-secondary px-2 py-0.5 rounded capitalize font-semibold">
                        {template.type}
                      </span>
                    </div>
                  </div>

                  {/* Labels if any */}
                  {template.labels && template.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.labels.map(l => (
                        <span
                          key={l._id}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: l.color + '10',
                            borderColor: l.color + '30',
                            color: l.color
                          }}
                        >
                          {l.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Schedule Details Grid */}
                  <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-3 pt-3.5 border-t border-line text-xs">
                    <div>
                      <span className="text-content-tertiary block text-[9px] uppercase font-bold tracking-wider mb-0.5">Schedule (Cron)</span>
                      <div className="flex items-center gap-1 text-content-secondary font-mono mt-1">
                        <Calendar className="w-3.5 h-3.5 text-content-tertiary shrink-0" />
                        <span>{template.cronExpression}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-content-tertiary block text-[9px] uppercase font-bold tracking-wider mb-0.5">Priority</span>
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getPriorityColor(template.priority)}`}>
                          {template.priority}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-content-tertiary block text-[9px] uppercase font-bold tracking-wider">Assignee</span>
                      <span className="text-content-secondary block mt-1 font-semibold break-words">
                        {assigneeName}
                      </span>
                    </div>

                    <div>
                      <span className="text-content-tertiary block text-[9px] uppercase font-bold tracking-wider">Next Execution</span>
                      <span className="text-content-secondary block mt-1 font-semibold break-words">
                        {template.isActive ? formatDate(template.nextRunTime) : <span className="text-content-tertiary italic">Paused</span>}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Status & Actions row */}
                  <div className="flex items-center justify-between pt-3 border-t border-line">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(template)}
                        className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                          template.isActive ? 'bg-indigo-600' : 'bg-surface-hover'
                        }`}
                        title={template.isActive ? 'Pause Schedule' : 'Activate Schedule'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
                            template.isActive ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs text-content-tertiary font-semibold">
                        {template.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(template)}
                        className="p-2 text-content-tertiary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer inline-flex border border-line"
                        title="Edit Template"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="p-2 text-content-tertiary hover:text-danger hover:bg-surface-hover rounded-lg transition-colors cursor-pointer inline-flex border border-line"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface border border-line rounded-lg max-w-lg w-full shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-content-tertiary hover:text-content dark:hover:text-white text-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 py-4 border-b border-line">
              <h3 className="text-lg font-bold text-content">
                {editingTemplate ? 'Edit Recurring Schedule' : 'New Recurring Schedule'}
              </h3>
              <p className="text-xs text-content-tertiary mt-0.5">Specify task metadata and cron configuration</p>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Template Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Status Update Report"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-9 px-3 border border-line-strong rounded-md text-sm bg-surface text-content focus:border-line-focus outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Description</label>
                <textarea
                  placeholder="Task description template..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full min-h-[70px] p-3 border border-line-strong rounded-md text-sm bg-surface text-content focus:border-line-focus outline-none resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Task Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as TaskType)}
                    className="w-full h-9 px-3 border border-line-strong rounded-md text-sm bg-surface text-content focus:border-line-focus outline-none"
                  >
                    <option value="task">Task 📄</option>
                    <option value="bug">Bug 🐛</option>
                    <option value="epic">Epic ⚡</option>
                    <option value="story">Story 📖</option>
                    <option value="subtask">Subtask 🔑</option>
                    <option value="improvement">Improvement 📈</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full h-9 px-3 border border-line-strong rounded-md text-sm bg-surface text-content focus:border-line-focus outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Original Estimate (min)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 60"
                    value={formEstimate}
                    onChange={(e) => setFormEstimate(e.target.value)}
                    className="w-full h-9 px-3 border border-line-strong rounded-md text-sm bg-surface text-content focus:border-line-focus outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Assignee</label>
                  <select
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                    className="w-full h-9 px-3 border border-line-strong rounded-md text-sm bg-surface text-content focus:border-line-focus outline-none"
                  >
                    <option value="">Unassigned</option>
                    {assignableMembers.map(m => (
                      <option key={m.id} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Labels selection */}
              <div>
                <label className="block text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Labels</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 border border-line-strong rounded-md bg-surface max-h-24 overflow-y-auto">
                  {labelsList.length > 0 ? (
                    labelsList.map(label => {
                      const isSelected = formSelectedLabels.includes(label._id);
                      return (
                        <button
                          key={label._id}
                          type="button"
                          onClick={() => {
                            setFormSelectedLabels(prev =>
                              isSelected ? prev.filter(id => id !== label._id) : [...prev, label._id]
                            );
                          }}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                            isSelected
                              ? 'text-white'
                              : 'text-content-tertiary border-line'
                          }`}
                          style={{
                            backgroundColor: isSelected ? label.color : 'transparent',
                            borderColor: label.color,
                          }}
                        >
                          {label.name}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-content-tertiary italic">No labels available in project</span>
                  )}
                </div>
              </div>

              {/* Cron configuration */}
              <div className="border-t border-line pt-3 space-y-3">
                <div className="font-semibold text-content text-xs">Scheduler Configuration</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Cron Preset</label>
                    <select
                      value={formCronPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormCronPreset(val);
                        if (val !== 'custom') {
                          setFormCronCustom(val);
                        }
                      }}
                      className="w-full h-9 px-3 border border-line-strong rounded-md text-sm bg-surface text-content focus:border-line-focus outline-none"
                    >
                      {CRON_PRESETS.map(p => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-1">Cron Expression *</label>
                    <input
                      type="text"
                      required
                      disabled={formCronPreset !== 'custom'}
                      value={formCronCustom}
                      onChange={(e) => setFormCronCustom(e.target.value)}
                      placeholder="e.g. */5 * * * *"
                      className="w-full h-9 px-3 border border-line-strong rounded-md text-sm bg-surface text-content focus:border-line-focus outline-none disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-content-tertiary">
                  Standard cron layout: <code className="bg-surface-hover px-1">minute hour dayOfMonth month dayOfWeek</code>
                </div>
              </div>

              {/* Status active toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary border-line-strong rounded focus:ring-primary/30"
                />
                <label htmlFor="formIsActive" className="text-sm text-content-secondary font-medium cursor-pointer">
                  Activate this schedule immediately
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-line-strong text-content-secondary rounded-md text-sm font-medium hover:bg-surface-hover cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitLoading || (formCronPreset === 'custom' && !formCronCustom.trim())}
                  className="bg-primary hover:bg-primary-hover text-primary-content px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {modalSubmitLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingTemplate ? 'Save Changes' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
