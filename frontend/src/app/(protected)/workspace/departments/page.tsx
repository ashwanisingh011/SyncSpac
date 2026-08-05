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
              className="bg-primary hover:bg-primary-hover text-primary-content px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
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
          className="w-full h-10 pl-10 pr-4 text-sm border border-line rounded-lg bg-surface text-content placeholder:text-content-tertiary focus:border-line-focus focus:ring-1 focus:ring-primary/30 outline-none transition-all"
        />
        <Search className="w-4.5 h-4.5 absolute left-3 top-2.5 text-content-tertiary" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-line rounded-2xl bg-slate-50/50">
          <Building2 className="w-12 h-12 text-content-tertiary mx-auto mb-3" />
          <h3 className="text-base font-semibold text-content">No departments found</h3>
          <p className="text-sm text-content-tertiary mt-1 max-w-sm mx-auto">
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
                className="bg-surface border border-line/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-content group-hover:text-blue-600 transition-colors">
                          {dept.name}
                        </h2>
                      </div>
                    </div>

                    {canManageDepts && (
                      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(dept)}
                          className="p-1.5 text-content-tertiary hover:text-primary hover:bg-primary-subtle rounded-md transition-all cursor-pointer"
                          title="Edit Department"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(dept._id, dept.name)}
                          className="p-1.5 text-content-tertiary hover:text-danger hover:bg-danger/10 rounded-md transition-all cursor-pointer"
                          title="Delete Department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Department Head */}
                  <div className="flex items-center gap-2.5 py-3 border-t border-line mb-2">
                    <div className="w-9 h-9 rounded-full bg-surface-hover text-content-secondary flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden border border-slate-200/40">
                      {headAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={headAvatar} alt={headName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4.5 h-4.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-content-tertiary">Department Head</p>
                      <p className="text-xs font-semibold text-content-secondary">{headName}</p>
                      {headEmail && <p className="text-[10px] text-content-tertiary">{headEmail}</p>}
                    </div>
                  </div>
                </div>

                {/* Footcount Allocation */}
                <div className="pt-3 border-t border-line flex justify-between items-center mt-3">
                  <span className="text-xs text-content-tertiary font-medium">Headcount Allocation</span>
                  <span className="text-xs font-bold text-content bg-surface-hover/80 px-2.5 py-0.5 rounded-full">
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
          <div className="bg-surface border border-line rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/60 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-base font-semibold text-content">
                {editingDept ? 'Edit Department Details' : 'Create Department'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-content-tertiary hover:text-content p-1 hover:bg-surface-hover rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {/* Department Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-content-tertiary">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering, Human Resources"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-line rounded-lg bg-surface text-content focus:border-line-focus focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                />
              </div>

              {/* Department Head */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-content-tertiary">Department Head</label>
                <select
                  value={head}
                  onChange={(e) => setHead(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-line rounded-lg bg-surface text-content focus:border-line-focus focus:ring-1 focus:ring-primary/30 outline-none transition-all"
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
                <label className="text-xs font-bold uppercase tracking-wider text-content-tertiary">Headcount Allocation</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 15"
                  value={memberCount}
                  onChange={(e) => setMemberCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-10 px-3 text-sm border border-line rounded-lg bg-surface text-content focus:border-line-focus focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-line text-content-secondary hover:bg-surface-hover rounded-lg text-sm font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-content rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
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
