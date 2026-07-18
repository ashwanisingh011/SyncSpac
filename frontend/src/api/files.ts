import api from './axios';

export interface IFileVersion {
  fileUrl: string;
  fileKey: string;
  version: number;
  fileSize: number;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  createdAt: string;
}

export interface IFile {
  _id: string;
  projectId: string;
  orgId: string;
  name: string;
  isFolder: boolean;
  parentId?: string | null;
  fileUrl?: string;
  fileKey?: string;
  fileSize?: number;
  mimeType?: string;
  version: number;
  versions: IFileVersion[];
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch list of files and folders in a project
 */
export const getFiles = async (projectId: string, parentId?: string | null) => {
  const response = await api.get<{ success: boolean; data: IFile[] }>('/files', {
    params: { projectId, parentId: parentId || 'root' }
  });
  return response.data;
};

/**
 * Create a new folder
 */
export const createFolder = async (projectId: string, name: string, parentId?: string | null) => {
  const response = await api.post<{ success: boolean; message: string; data: IFile }>('/files/folder', {
    projectId,
    name,
    parentId: parentId || 'root'
  });
  return response.data;
};

/**
 * Upload a file as a new file or a new version of an existing file
 */
export const uploadFile = async (projectId: string, file: File, parentId?: string | null, onUploadProgress?: (progressEvent: any) => void) => {
  const formData = new FormData();
  formData.append('projectId', projectId);
  if (parentId && parentId !== 'root') {
    formData.append('parentId', parentId);
  }
  formData.append('file', file);

  const response = await api.post<{ success: boolean; message: string; data: IFile }>('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  });
  return response.data;
};

/**
 * Delete a file or folder (recursively deletes children)
 */
export const deleteFile = async (id: string) => {
  const response = await api.delete<{ success: boolean; message: string }>(`/files/${id}`);
  return response.data;
};

/**
 * Download a folder as a ZIP file blob
 */
export const downloadFolder = async (id: string): Promise<Blob> => {
  const response = await api.get(`/files/download-folder/${id}`, {
    responseType: 'blob'
  });
  return response.data;
};
