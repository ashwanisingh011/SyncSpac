'use client';

import { useState, useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { isSuperAdminRole } from '@/lib/rbacMatrix';
import {
  Folder,
  File as FileIcon,
  Plus,
  Upload,
  ChevronRight,
  History,
  Download,
  Trash2,
  Loader2,
  FolderOpen,
  ArrowUpCircle,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  FileText,
  X,
  Eye,
} from 'lucide-react';
import {
  getFiles,
  createFolder,
  uploadFile,
  deleteFile,
  downloadFolder,
  type IFile,
} from '@/api/files';
import { useToast } from '@/context/useToast';
import { useConfirm } from '@/context/useConfirm';
import Link from 'next/link';

interface ClientDocumentsViewProps {
  project: {
    _id: string;
    name: string;
    key: string;
  };
}

export default function ClientDocumentsView({
  project,
}: ClientDocumentsViewProps): React.JSX.Element {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { effectiveRole, user } = usePermission();

  // Files & directory state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'Root' },
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

  // Folder download state
  const [downloadingFolderId, setDownloadingFolderId] = useState<string | null>(null);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Permission helper to determine if current user can delete/replace a file
  const canDeleteFile = (file: IFile) => {
    const roleCode = effectiveRole?.toLowerCase().trim();
    const currentUserId = user?._id || user?.id;

    if (roleCode === 'client') {
      const uploaderId = typeof file.uploadedBy === 'object' && file.uploadedBy ? file.uploadedBy._id : file.uploadedBy;
      const isUploader = uploaderId && currentUserId && uploaderId.toString() === currentUserId.toString();
      
      const uploaderRole = typeof file.uploadedBy === 'object' && file.uploadedBy ? (file.uploadedBy as any).role : null;
      const normalizedUploaderRole = uploaderRole ? uploaderRole.toLowerCase().trim() : '';
      
      return !!(isUploader || normalizedUploaderRole === 'client');
    }

    if (['superadmin', 'org_admin', 'admin', 'owner', 'project_manager', 'team_lead'].includes(roleCode)) {
      return true;
    }

    const uploaderId = typeof file.uploadedBy === 'object' && file.uploadedBy ? file.uploadedBy._id : file.uploadedBy;
    return !!(uploaderId && currentUserId && uploaderId.toString() === currentUserId.toString());
  };

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
      showToast('Failed to load documents', 'error');
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
        showToast('Folder created successfully', 'success');
      }
    } catch (err: any) {
      setFolderError(err.response?.data?.message || 'We could not create that folder. Please try again.');
      showToast('Failed to create folder', 'error');
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
        showToast('File uploaded successfully', 'success');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'We could not upload that file. Please try again.';
      setUploadError(errMsg);
      showToast(errMsg, 'error');
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
    if (!isConfirmed) return;

    setDeletingId(id);
    try {
      const response = await deleteFile(id);
      if (response.success) {
        loadFiles();
        showToast('Item deleted successfully', 'success');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'We could not delete that item. Please try again.';
      console.error('Failed to delete:', err);
      showToast(errMsg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadFolder = async (folderId: string, folderName: string) => {
    setDownloadingFolderId(folderId);
    try {
      const blob = await downloadFolder(folderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download folder:', err);
      showToast('Failed to download folder as ZIP', 'error');
    } finally {
      setDownloadingFolderId(null);
    }
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    setCurrentFolderId(folderId);
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'Root' }]);
    } else {
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
      return <FileArchive className="w-5 h-5 text-amber-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    }
    if (['js', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'go'].includes(ext || '')) {
      return <FileCode className="w-5 h-5 text-blue-500" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <FileIcon className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href="/client-dashboard" className="hover:underline hover:text-blue-600">Client Portal</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 dark:text-slate-300">{project.name}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Project Documents
          </h1>
          <p className="text-sm text-slate-500">
            Store documents, designs, and code attachments in nested directories.
          </p>
        </div>

        {/* Buttons & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-755 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Folder
          </button>

          <label className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-blue-500/10 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" /> Upload File
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploadProgress !== null}
            />
          </label>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="bg-blue-50 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-350 font-semibold">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading file...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-100 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
            <div style={{ width: `${uploadProgress}%` }} className="bg-blue-600 h-full rounded-full transition-all duration-300" />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {(uploadError || folderError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-semibold">
          {uploadError || folderError}
        </div>
      )}

      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold px-1 py-2 overflow-x-auto">
        {breadcrumbs.map((crumb, idx) => (
          <div key={idx} className="flex items-center shrink-0">
            {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-300 mx-1" />}
            <button
              onClick={() => navigateToFolder(crumb.id, crumb.name)}
              className={`hover:text-blue-600 hover:underline transition-colors ${idx === breadcrumbs.length - 1 ? 'text-slate-800 dark:text-slate-100 font-bold' : ''
                }`}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Files List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loadingFiles ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <span className="text-xs mt-2">Reading directory...</span>
          </div>
        ) : filesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400">
            <FolderOpen className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-355">This directory is empty</h3>
            <p className="text-xs text-slate-500 mt-0.5">Upload a file or create a subfolder to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-[11px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Version</th>
                    <th className="px-6 py-3.5">Size</th>
                    <th className="px-6 py-3.5">Uploaded By</th>
                    <th className="px-6 py-3.5">Updated At</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filesList.map((file) => (
                    <tr
                      key={file._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-sm text-slate-700 dark:text-slate-300"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        {file.isFolder ? (
                          <button
                            onClick={() => navigateToFolder(file._id, file.name)}
                            className="flex items-center gap-2.5 font-semibold text-slate-850 hover:text-blue-600 dark:text-slate-100 transition-colors text-left"
                          >
                            <Folder className="w-5 h-5 text-blue-500 fill-blue-500/10 shrink-0" />
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
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {!file.isFolder ? `v${file.version}` : '-'}
                      </td>

                      {/* Size */}
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        {formatBytes(file.fileSize)}
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
                            <div className="w-5.5 h-5.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                              {file.uploadedBy?.name?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                          )}
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {file.uploadedBy?.name || 'Unknown User'}
                          </span>
                        </div>
                      </td>

                      {/* Updated At */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(file.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {!file.isFolder ? (
                            <>
                              {/* Version history / Copies */}
                              <button
                                onClick={() => {
                                  setSelectedFile(file);
                                  setIsVersionModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="File History"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              {/* View File without download */}
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Download File"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </>
                          ) : (
                            <>
                              {/* Download Folder as ZIP */}
                              {file.fileSize && file.fileSize > 0 ? (
                                <button
                                  onClick={() => handleDownloadFolder(file._id, file.name)}
                                  disabled={downloadingFolderId === file._id}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-[#F4F5F7]/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Download Folder as ZIP"
                                >
                                  {downloadingFolderId === file._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </button>
                              ) : null}
                            </>
                          )}

                          {/* Delete */}
                          {canDeleteFile(file) && (
                            <button
                              onClick={() => handleDelete(file._id)}
                              disabled={deletingId === file._id}
                              className="p-1.5 text-slate-400 hover:text-red-650 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              {deletingId === file._id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
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
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filesList.map((file) => (
                <div
                  key={file._id}
                  className="p-4 space-y-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors text-slate-700 dark:text-slate-300"
                >
                  {/* Header: Icon, Name & Version */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {file.isFolder ? (
                        <button
                          onClick={() => navigateToFolder(file._id, file.name)}
                          className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors text-left text-sm"
                        >
                          <Folder className="w-5 h-5 text-blue-500 fill-blue-500/10 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 font-semibold text-slate-850 dark:text-slate-202 text-sm">
                          {getFileIcon(file.mimeType, file.name)}
                          <span className="truncate max-w-[200px]" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0">
                            v{file.version}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!file.isFolder ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedFile(file);
                              setIsVersionModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-md hover:bg-slate-105 dark:hover:bg-slate-800 cursor-pointer"
                            title="File History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-md hover:bg-slate-105 dark:hover:bg-slate-800 cursor-pointer"
                            title="View File"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={file.name}
                            className="p-1.5 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 rounded-md hover:bg-slate-105 dark:hover:bg-slate-800 cursor-pointer"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </>
                      ) : (
                        <>
                          {file.fileSize && file.fileSize > 0 ? (
                            <button
                              onClick={() => handleDownloadFolder(file._id, file.name)}
                              disabled={downloadingFolderId === file._id}
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-205 rounded-md hover:bg-[#F4F5F7]/50 dark:hover:bg-slate-800 cursor-pointer"
                              title="Download Folder as ZIP"
                            >
                              {downloadingFolderId === file._id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          ) : null}
                        </>
                      )}

                      {canDeleteFile(file) && (
                        <button
                          onClick={() => handleDelete(file._id)}
                          disabled={deletingId === file._id}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                          title="Delete"
                        >
                          {deletingId === file._id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {file.uploadedBy?.avatar ? (
                        <img
                          src={file.uploadedBy.avatar}
                          alt=""
                          className="w-4.5 h-4.5 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[8px] font-bold shrink-0">
                          {file.uploadedBy?.name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {file.uploadedBy?.name || 'Unknown User'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-450 dark:text-slate-500 font-medium">
                      <span>{formatBytes(file.fileSize)}</span>
                      <span>&bull;</span>
                      <span>
                        {new Date(file.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Folder</h3>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
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
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-350 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-500/10 transition-colors flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">File History & Previous Copies</h3>
                <p className="text-xs text-slate-500 mt-1">
                  File: <strong className="text-slate-700 dark:text-slate-300">{selectedFile.name}</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Keep track of changes made to this file and download older copies if you need them.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsVersionModalOpen(false);
                  setSelectedFile(null);
                }}
                className="text-slate-455 hover:text-slate-700 dark:hover:text-slate-350 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-455 dark:text-slate-455 uppercase font-black py-2.5 px-4 block flex justify-between">
                    <span className="w-1/4">Copy</span>
                    <span className="w-1/4">File Size</span>
                    <span className="w-1/4">Saved By</span>
                    <span className="w-1/4 text-right">Actions</span>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 block">
                  {/* Current version */}
                  <tr className="py-3 px-4 flex justify-between items-center bg-blue-50/30 dark:bg-blue-950/10 text-slate-855 dark:text-slate-250 font-bold">
                    <td className="w-1/4 flex items-center gap-1.5">
                      <ArrowUpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      Current active copy (Version {selectedFile.version})
                    </td>
                    <td className="w-1/4">{formatBytes(selectedFile.fileSize)}</td>
                    <td className="w-1/4">{selectedFile.uploadedBy?.name || 'Unknown User'}</td>
                    <td className="w-1/4 text-right">
                      <a
                        href={selectedFile.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-650 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </td>
                  </tr>

                  {/* Previous versions */}
                  {(selectedFile.versions || [])
                    .slice()
                    .reverse()
                    .map((ver, idx) => (
                      <tr key={idx} className="py-3 px-4 flex justify-between items-center text-slate-650 dark:text-slate-400">
                        <td className="w-1/4 pl-5">Version {ver.version}</td>
                        <td className="w-1/4">{formatBytes(ver.fileSize)}</td>
                        <td className="w-1/4">{ver.uploadedBy ? (ver.uploadedBy as any).name : 'Unknown'}</td>
                        <td className="w-1/4 text-right">
                          <a
                            href={ver.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 hover:underline"
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
            {canDeleteFile(selectedFile) && (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-slate-705 dark:text-slate-350 block">Upload Another Document</span>
                  <span className="text-[10px] text-slate-500">Select a newer file from your computer to update this file. The older copies are kept safe below.</span>
                </div>
                <label className="bg-slate-200/80 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0">
                  Select File
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
                          showToast('New version uploaded successfully', 'success');
                        }
                      } catch (err: any) {
                        const errMsg = err.response?.data?.message || 'Version upload failed';
                        setUploadError(errMsg);
                        showToast(errMsg, 'error');
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
