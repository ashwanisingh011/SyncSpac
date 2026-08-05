'use client';

import { use, useEffect, useState } from 'react';
import { useTaskBridgeStore } from '@/store/useTaskBridgeStore';
import { useOrganization } from '@/context/useOrganization';
import { Project } from '@/types/projects';
import { getProjectMembers, type ProjectMember } from '@/api/projects';
import { usePermission } from '@/hooks/usePermission';
import {
  getFiles,
  createFolder,
  uploadFile,
  deleteFile,
  IFile
} from '@/api/files';
import {
  Folder,
  File as FileIcon,
  Upload,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  History,
  Download,
  Eye,
  Loader2,
  FolderOpen,
  ArrowUpCircle,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileArchive
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import AccessRestrictedModal from '@/components/AccessRestrictedModal';
import { isAccessRestrictedError } from '@/lib/accessErrors';
import { getFriendlyApiErrorMessage } from '@/lib/apiErrors';

interface FilesPageProps {
  params: Promise<{
    projectKey: string;
  }>;
}

export default function ProjectFilesPage({ params }: FilesPageProps) {
  const unwrappedParams = use(params);
  const projectKey = unwrappedParams.projectKey;

  const { currentOrg } = useOrganization();
  const { projects, fetchProjects, loading: storeLoading } = useTaskBridgeStore();
  const { effectiveRole, user } = usePermission();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Files & directory state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'Root' }
  ]);
  const [filesList, setFilesList] = useState<IFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Modal / Inputs state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderError, setFolderError] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // File Upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Selected file details (for version history modal)
  const [selectedFile, setSelectedFile] = useState<IFile | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAccessRestricted, setShowAccessRestricted] = useState(false);

  // 1. Resolve project by key
  useEffect(() => {
    const resolveProject = async () => {
      setLoadingProject(true);
      if (projects.length === 0) {
        try {
          await fetchProjects(false);
        } catch (err) {
          console.error('Failed to pre-fetch projects:', err);
        }
      }
      setLoadingProject(false);
    };

    if (currentOrg) {
      resolveProject();
    }
  }, [currentOrg, projects.length, fetchProjects]);

  // 2. Find specific project
  useEffect(() => {
    const found = projects.find((p) => p.key === projectKey);
    if (found) {
      setProject(found);
    }
  }, [projectKey, projects]);

  // Load project members once project is resolved
  useEffect(() => {
    const loadMembers = async () => {
      if (project) {
        setLoadingMembers(true);
        try {
          const membersData = await getProjectMembers(project._id);
          setProjectMembers(membersData);
        } catch (err) {
          console.error('Failed to load project members:', err);
        } finally {
          setLoadingMembers(false);
        }
      }
    };
    loadMembers();
  }, [project]);

  const checkCanModify = () => {
    if (!user || !project) return false;

    // 1. Check workspace level role
    const roleCode = effectiveRole?.toLowerCase().trim();
    if (['superadmin', 'org_admin', 'admin', 'owner', 'project_manager', 'team_lead'].includes(roleCode)) {
      return true;
    }

    // 2. Check if user is project owner
    const ownerId = typeof project.owner === 'object' ? (project.owner as any)._id : project.owner;
    if (ownerId && (user._id === ownerId || user.id === ownerId)) {
      return true;
    }

    // 3. Check if user is a Project Manager or Team Lead within this project specifically
    const currentMember = projectMembers.find(
      (m) => m.userId === user._id || m.userId === user.id
    );
    if (currentMember && currentMember.projectRole && ['project_manager', 'team_lead'].includes(currentMember.projectRole)) {
      return true;
    }

    return false;
  };

  const canModify = checkCanModify();

  // 3. Fetch files inside current folder
  useEffect(() => {
    if (project) {
      loadFiles();
    }
  }, [project, currentFolderId]);

  const loadFiles = async () => {
    if (!project) return;
    setLoadingFiles(true);
    try {
      const response = await getFiles(project._id, currentFolderId);
      if (response.success) {
        setFilesList(response.data);
      }
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newFolderName.trim()) return;

    setCreatingFolder(true);
    setFolderError('');
    try {
      const response = await createFolder(project._id, newFolderName.trim(), currentFolderId);
      if (response.success) {
        setNewFolderName('');
        setIsFolderModalOpen(false);
        loadFiles();
      }
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setFolderError('');
        setShowAccessRestricted(true);
        return;
      }
      setFolderError(getFriendlyApiErrorMessage(err, 'We could not create that folder. Please try again.'));
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!project || !file) return;

    setUploadError('');
    setUploadProgress(0);
    try {
      const response = await uploadFile(project._id, file, currentFolderId, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(pct);
      });
      if (response.success) {
        loadFiles();
      }
    } catch (err: any) {
      if (isAccessRestrictedError(err)) {
        setUploadError('');
        setShowAccessRestricted(true);
        return;
      }
      setUploadError(getFriendlyApiErrorMessage(err, 'We could not upload that file. Please try again.'));
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this? If it is a folder, all files and subfolders inside it will be deleted permanently.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!isConfirmed) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await deleteFile(id);
      if (response.success) {
        loadFiles();
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      if (isAccessRestrictedError(err)) {
        setShowAccessRestricted(true);
        return;
      }
      showToast(getFriendlyApiErrorMessage(err, 'We could not delete that item. Please try again.'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    setCurrentFolderId(folderId);
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'Root' }]);
    } else {
      // Check if folder is already in breadcrumbs to trim path back
      const idx = breadcrumbs.findIndex((b) => b.id === folderId);
      if (idx !== -1) {
        setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
      }
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType?: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) {
      return <FileImage className="w-5 h-5 text-pink-500" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext || '')) {
      return <FileArchive className="w-5 h-5 text-warning" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-success" />;
    }
    if (['js', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'go'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-primary" />;
    }
    return <FileIcon className="w-5 h-5 text-content-tertiary" />;
  };

  if (loadingProject || storeLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-content-tertiary mt-2">Loading project context...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <FolderOpen className="w-12 h-12 text-content-tertiary mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-content">Project Not Found</h3>
        <p className="text-sm text-content-tertiary mt-1 max-w-sm">
          Could not resolve key <strong>{projectKey}</strong>.
        </p>
        <Link href="/projects" className="mt-4 px-4 py-2 bg-primary text-primary-content rounded-lg text-sm font-medium">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      <AccessRestrictedModal isOpen={showAccessRestricted} onClose={() => setShowAccessRestricted(false)} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-tertiary">
            <Link href={`/projects/${project.key}`} className="hover:underline hover:text-primary">{project.name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-content-secondary">Files</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-content mt-1">
            Project Files
          </h1>
          <p className="text-sm text-content-tertiary">
            Store documents, designs, and code attachments in nested directories.
          </p>
        </div>

        {/* Buttons & Actions */}
        {canModify && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="inline-flex items-center gap-1.5 border border-line bg-surface hover:bg-surface-hover text-content-secondary px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Folder
            </button>

            <label className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-content px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-blue-500/10 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" /> Upload File
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadProgress !== null}
              />
            </label>
          </div>
        )}
      </div>

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="bg-primary-subtle border border-primary/20 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-primary font-semibold">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading file...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-primary-subtle h-2 rounded-full overflow-hidden">
            <div style={{ width: `${uploadProgress}%` }} className="bg-primary h-full rounded-full transition-all duration-300" />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {(uploadError || folderError) && (
        <div className="bg-danger/10 border border-danger/25 text-danger p-3 rounded-lg text-sm font-semibold">
          {uploadError || folderError}
        </div>
      )}

      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-2 text-sm text-content-tertiary font-semibold px-1 py-2 overflow-x-auto">
        {breadcrumbs.map((crumb, idx) => (
          <div key={idx} className="flex items-center shrink-0">
            {idx > 0 && <ChevronRight className="w-4 h-4 text-content-tertiary mx-1" />}
            <button
              onClick={() => navigateToFolder(crumb.id, crumb.name)}
              className={`hover:text-primary hover:underline transition-colors ${
                idx === breadcrumbs.length - 1 ? 'text-content font-bold' : ''
              }`}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Files List Table */}
      <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
        {loadingFiles ? (
          <div className="flex flex-col items-center justify-center p-12 text-content-tertiary">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <span className="text-xs mt-2">Reading directory...</span>
          </div>
        ) : filesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-content-tertiary">
            <FolderOpen className="w-12 h-12 text-content-tertiary mb-3" />
            <h3 className="text-sm font-bold text-content-secondary">This directory is empty</h3>
            <p className="text-xs text-content-tertiary mt-0.5">Upload a file or create a subfolder to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line bg-slate-50/50 text-[11px] font-black text-content-tertiary uppercase tracking-wider">
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Version</th>
                    <th className="px-6 py-3.5">Size</th>
                    <th className="px-6 py-3.5">Uploaded By</th>
                    <th className="px-6 py-3.5">Updated At</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filesList.map((file) => (
                    <tr
                      key={file._id}
                      className="hover:bg-slate-50/50 transition-colors text-sm text-content-secondary"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        {file.isFolder ? (
                          <button
                            onClick={() => navigateToFolder(file._id, file.name)}
                            className="flex items-center gap-2.5 font-semibold text-content hover:text-primary transition-colors text-left"
                          >
                            <Folder className="w-5 h-5 text-primary fill-blue-500/10 shrink-0" />
                            <span>{file.name}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2.5 font-medium">
                            {getFileIcon(file.mimeType, file.name)}
                            <span className="truncate max-w-[240px]" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Version */}
                      <td className="px-6 py-4 text-xs font-semibold text-content-tertiary">
                        {!file.isFolder ? `v${file.version}` : '-'}
                      </td>

                      {/* Size */}
                      <td className="px-6 py-4 text-xs text-content-tertiary">
                        {!file.isFolder ? formatBytes(file.fileSize) : '-'}
                      </td>

                      {/* Uploaded By */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {file.uploadedBy?.avatar ? (
                            <img
                              src={file.uploadedBy.avatar}
                              alt=""
                              className="w-5.5 h-5.5 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full bg-surface-hover text-content-tertiary flex items-center justify-center text-[10px] font-extrabold shrink-0">
                              {file.uploadedBy?.name?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="text-xs font-medium text-content-secondary">
                            {file.uploadedBy?.name || 'Unknown User'}
                          </span>
                        </div>
                      </td>

                      {/* Updated At */}
                      <td className="px-6 py-4 text-xs text-content-tertiary">
                        {new Date(file.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {!file.isFolder && (
                            <>
                              {/* Version history */}
                              <button
                                onClick={() => {
                                  setSelectedFile(file);
                                  setIsVersionModalOpen(true);
                                }}
                                className="p-1.5 text-content-tertiary hover:text-content rounded-md hover:bg-surface-hover transition-colors"
                                title="Version History"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              {/* View File without download */}
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-content-tertiary hover:text-content rounded-md hover:bg-surface-hover transition-colors"
                                title="View File"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              {/* Download */}
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={file.name}
                                className="p-1.5 text-content-tertiary hover:text-content rounded-md hover:bg-surface-hover transition-colors"
                                title="Download File"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </>
                          )}

                          {/* Delete */}
                          {canModify && (
                            <button
                              onClick={() => handleDelete(file._id)}
                              disabled={deletingId === file._id}
                              className="p-1.5 text-content-tertiary hover:text-danger rounded-md hover:bg-danger/10 transition-colors"
                              title="Delete"
                            >
                              {deletingId === file._id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-danger" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-line">
              {filesList.map((file) => (
                <div
                  key={file._id}
                  className="p-4 space-y-3.5 hover:bg-slate-50/50 transition-colors text-content-secondary"
                >
                  {/* Header: Icon, Name & Version */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {file.isFolder ? (
                        <button
                          onClick={() => navigateToFolder(file._id, file.name)}
                          className="flex items-center gap-2 font-bold text-content hover:text-primary transition-colors text-left text-sm"
                        >
                          <Folder className="w-5 h-5 text-primary fill-blue-500/10 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 font-semibold text-content text-sm">
                          {getFileIcon(file.mimeType, file.name)}
                          <span className="truncate max-w-[200px]" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] font-bold text-content-tertiary shrink-0">
                            v{file.version}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!file.isFolder && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedFile(file);
                              setIsVersionModalOpen(true);
                            }}
                            className="p-1.5 text-content-tertiary hover:text-content rounded-md hover:bg-surface-hover cursor-pointer"
                            title="Version History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                           {/* View File without download */}
                           <a
                             href={file.fileUrl}
                             target="_blank"
                             rel="noreferrer"
                             className="p-1.5 text-content-tertiary hover:text-content rounded-md hover:bg-surface-hover cursor-pointer"
                             title="View File"
                           >
                             <Eye className="w-4 h-4" />
                           </a>
                           {/* Download */}
                           <a
                             href={file.fileUrl}
                             target="_blank"
                             rel="noreferrer"
                             download={file.name}
                             className="p-1.5 text-content-tertiary hover:text-content rounded-md hover:bg-surface-hover cursor-pointer"
                             title="Download File"
                           >
                             <Download className="w-4 h-4" />
                           </a>
                        </>
                      )}

                      {canModify && (
                        <button
                          onClick={() => handleDelete(file._id)}
                          disabled={deletingId === file._id}
                          className="p-1.5 text-content-tertiary hover:text-danger rounded-md hover:bg-danger/10 cursor-pointer"
                          title="Delete"
                        >
                          {deletingId === file._id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-danger" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-content-tertiary">
                      {file.uploadedBy?.avatar ? (
                        <img
                          src={file.uploadedBy.avatar}
                          alt=""
                          className="w-4.5 h-4.5 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full bg-surface-hover text-content-tertiary flex items-center justify-center text-[8px] font-bold shrink-0">
                          {file.uploadedBy?.name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className="text-[11px] font-medium text-content-secondary">
                        {file.uploadedBy?.name || 'Unknown User'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-content-tertiary font-medium">
                      <span>{!file.isFolder ? formatBytes(file.fileSize) : '-'}</span>
                      <span>&bull;</span>
                      <span>
                        {new Date(file.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* --- Folder Modal --- */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-line rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-content">Create New Folder</h3>
            
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-content-tertiary uppercase tracking-wider block mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-line bg-surface rounded-lg text-sm text-content focus:outline-none focus:border-line-focus transition-colors"
                  placeholder="e.g. Assets, Documents"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFolderModalOpen(false);
                    setNewFolderName('');
                    setFolderError('');
                  }}
                  className="px-4 py-2 border border-line hover:bg-surface-hover rounded-lg text-sm font-semibold text-content-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-content rounded-lg text-sm font-semibold shadow-md shadow-blue-500/10 transition-colors flex items-center gap-1.5"
                >
                  {creatingFolder && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Version History Modal --- */}
      {isVersionModalOpen && selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-surface border border-line rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-content">Version History</h3>
                <p className="text-xs text-content-tertiary mt-0.5">
                  File: <strong className="text-content-secondary">{selectedFile.name}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsVersionModalOpen(false);
                  setSelectedFile(null);
                }}
                className="text-content-tertiary hover:text-content text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="border border-line rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-slate-50/50 text-content-tertiary uppercase font-black py-2.5 px-4 block flex justify-between">
                    <span className="w-1/4">Version</span>
                    <span className="w-1/4">Size</span>
                    <span className="w-1/4">Uploaded By</span>
                    <span className="w-1/4 text-right">Actions</span>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line block">
                  {/* Current version */}
                  <tr className="py-3 px-4 flex justify-between items-center bg-blue-50/30 text-content font-bold">
                    <td className="w-1/4 flex items-center gap-1.5">
                      <ArrowUpCircle className="w-4 h-4 text-primary shrink-0" />
                      v{selectedFile.version} (Latest)
                    </td>
                    <td className="w-1/4">{formatBytes(selectedFile.fileSize)}</td>
                    <td className="w-1/4">{selectedFile.uploadedBy?.name || 'Unknown User'}</td>
                    <td className="w-1/4 text-right">
                      <a
                        href={selectedFile.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </td>
                  </tr>

                  {/* Previous versions */}
                  {selectedFile.versions
                    .slice()
                    .reverse()
                    .map((ver, idx) => (
                      <tr key={idx} className="py-3 px-4 flex justify-between items-center text-content-secondary">
                        <td className="w-1/4 pl-5">v{ver.version}</td>
                        <td className="w-1/4">{formatBytes(ver.fileSize)}</td>
                        <td className="w-1/4">{ver.uploadedBy ? (ver.uploadedBy as any).name : 'Unknown'}</td>
                        <td className="w-1/4 text-right">
                          <a
                            href={ver.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-content-tertiary hover:text-primary hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Upload new version inside history modal */}
            {canModify && (
              <div className="bg-surface-sunken border border-line rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-content-secondary block">Upload New Version</span>
                  <span className="text-[10px] text-content-tertiary">Replacing current file with a newer iteration.</span>
                </div>
                <label className="bg-slate-200/80 hover:bg-surface-hover text-content px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0">
                  Choose File
                  <input
                    type="file"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!project || !file) return;

                      // Close the version history dialog first
                      setIsVersionModalOpen(false);
                      setUploadProgress(0);
                      setUploadError('');
                      try {
                        const response = await uploadFile(project._id, file, currentFolderId, (progressEvent) => {
                          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                          setUploadProgress(pct);
                        });
                        if (response.success) {
                          loadFiles();
                        }
                      } catch (err: any) {
                        setUploadError(err.response?.data?.message || 'Version upload failed');
                      } finally {
                        setUploadProgress(null);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
