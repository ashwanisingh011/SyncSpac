'use client';

import { useState, useEffect, useCallback } from 'react';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import { useOrganization } from '@/context/useOrganization';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import {
  getWorkspaceMembers,
} from '@/api/workspace';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  IDepartmentData,
  DepartmentFormData,
} from '@/api/departments';
import { WorkspaceMember } from '@/types/workspace';
import {
  Plus,
  Search,
  Building2,
  Trash2,
  Edit2,
  Loader2,
  X,
  User,
  Shield,
  Briefcase,
} from 'lucide-react';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

export default function DepartmentsPage() {
  const { currentOrg } = useOrganization();
  const { hasPermission } = usePermission();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [departments, setDepartments] = useState<IDepartmentData[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<IDepartmentData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [head, setHead] = useState('');
  const [memberCount, setMemberCount] = useState<number>(0);

  const orgId = currentOrg?.id ?? '';
  const canManageDepts = hasPermission('manage_departments');

  // Load all required data
  const loadData = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [deptsData, membersData] = await Promise.all([
        getDepartments(),
        getWorkspaceMembers(orgId),
      ]);
      setDepartments(deptsData);
      setMembers(membersData);
    } catch (err: any) {
      console.error('Failed to load departments page data:', err);
      showToast(getFriendlyApiErrorMessage(err, 'We could not load departments. Please try again.'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal for Create/Edit
  const openModal = (dept: IDepartmentData | null = null) => {
    if (dept) {
      setEditingDept(dept);
      setName(dept.name);
      setHead(
        dept.head
          ? typeof dept.head === 'object'
            ? dept.head._id
            : dept.head
          : ''
      );
      setMemberCount(dept.memberCount || 0);
    } else {
      setEditingDept(null);
      setName('');
      setHead('');
      setMemberCount(0);
    }
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Department name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    const payload: DepartmentFormData = {
      name: name.trim(),
      head: head || undefined,
      memberCount: memberCount,
    };

    try {
      if (editingDept) {
        await updateDepartment(editingDept._id, payload);
        showToast('Department updated successfully', 'success');
      } else {
        await createDepartment(payload);
        showToast('Department created successfully', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to save department:', err);
      showToast(getFriendlyApiErrorMessage(err, 'We could not save that department. Please try again.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDept = async (deptId: string, deptName: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Department',
      message: `Are you sure you want to delete the department "${deptName}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await deleteDepartment(deptId);
      showToast('Department deleted successfully', 'success');
      loadData();
    } catch (err: any) {
      console.error('Failed to delete department:', err);
      showToast(getFriendlyApiErrorMessage(err, 'We could not delete that department. Please try again.'), 'error');
    }
  };

  // Filter departments by search input
  const filteredDepts = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Departments"
        subtitle="Manage formal company departments, set heads, and track general headcount allocations."
        action={
          canManageDepts && (
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Department
            </button>
          )
        }
      />

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Search departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        />
        <Search className="w-4.5 h-4.5 absolute left-3 top-2.5 text-slate-400" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No departments found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search keywords.' : 'Create your first department to organize your company.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDepts.map((dept) => {
            const deptHead = (typeof dept.head === 'object' ? dept.head : members.find((m) => m.userId === dept.head)) as any;
            const headName = deptHead ? (deptHead.name || '') : 'No Head assigned';
            const headAvatar = deptHead ? (deptHead.avatar || deptHead.avatarUrl) : null;
            const headEmail = deptHead ? (deptHead.email || '') : '';

            return (
              <div
                key={dept._id}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                          {dept.name}
                        </h2>
                      </div>
                    </div>

                    {canManageDepts && (
                      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(dept)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-md transition-all cursor-pointer"
                          title="Edit Department"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(dept._id, dept.name)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all cursor-pointer"
                          title="Delete Department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Department Head */}
                  <div className="flex items-center gap-2.5 py-3 border-t border-slate-100 dark:border-slate-900/60 mb-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-355 flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden border border-slate-200/40 dark:border-slate-850">
                      {headAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={headAvatar} alt={headName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Department Head</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{headName}</p>
                      {headEmail && <p className="text-[10px] text-slate-400">{headEmail}</p>}
                    </div>
                  </div>
                </div>

                {/* Footcount Allocation */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-900/60 flex justify-between items-center mt-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Headcount Allocation</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                    {dept.memberCount || 0} member{(dept.memberCount || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-250/60 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingDept ? 'Edit Department Details' : 'Create Department'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {/* Department Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering, Human Resources"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-905 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {/* Department Head */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Department Head</label>
                <select
                  value={head}
                  onChange={(e) => setHead(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-905 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="">Select a Department Head...</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Headcount Allocation */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Headcount Allocation</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 15"
                  value={memberCount}
                  onChange={(e) => setMemberCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-905 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200/50 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-855 rounded-lg text-sm font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
