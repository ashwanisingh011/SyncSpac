import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZipArchive } from 'archiver';
import axios from 'axios';
import File, { IFile, IFileVersion } from '../models/File.js';
import ProjectMember from '../models/ProjectMember.js';
import OrganizationMember from '../models/OrganizationMember.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorMiddleware.js';
import { v2 as cloudinary } from 'cloudinary';
import { normalizeRoleCode, isSuperAdminRole } from '../utils/rbacMatrix.js';

// Check if user is a member of the project
const validateProjectMembership = async (projectId: string, userId: string, userRole: string) => {
  const normalized = normalizeRoleCode(userRole);
  if (
    isSuperAdminRole(userRole) ||
    ['org_admin', 'project_manager', 'team_lead'].includes(normalized)
  ) return true;

  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ForbiddenError('You are not a member of this project');
  }

  const project = await Project.findById(projectId).select('owner organization');
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Directly check database organization membership to make permission check resilient
  if (project.organization) {
    const orgMember = await OrganizationMember.findOne({
      organization: project.organization,
      user: new mongoose.Types.ObjectId(userId),
      status: 'active'
    });
    if (orgMember && ['org_admin', 'project_manager', 'team_lead'].includes(normalizeRoleCode(orgMember.role))) {
      return true;
    }
  }

  const membership = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId)
  });

  if (membership) return true;

  if (project.owner.toString() === userId) {
    return true;
  }

  const taskAssigned = await Task.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: new mongoose.Types.ObjectId(userId)
  }).select('_id');

  if (taskAssigned) {
    return true;
  }

  throw new ForbiddenError('You are not a member of this project');
};

// Helper to check if a user is allowed to replace/delete a specific file/folder
const canUserModifyOrDeleteFile = async (
  projectId: string,
  fileUploadedBy: string | mongoose.Types.ObjectId | undefined | null,
  user: any
): Promise<boolean> => {
  const userIdStr = user._id.toString();
  const isOwner = fileUploadedBy?.toString() === userIdStr;
  const normalizedUserRole = normalizeRoleCode(user.role);

  // Clients/Customers (role: client) can only delete/modify documents uploaded by other Clients
  if (normalizedUserRole === 'client') {
    if (isOwner) return true;
    if (!fileUploadedBy) return false;
    const uploader = await User.findById(fileUploadedBy).select('role');
    if (!uploader) return false;
    return normalizeRoleCode(uploader.role) === 'client';
  }

  // Owners, SuperAdmins, OrgAdmins, ProjectManagers, and TeamLeads can modify/delete any file in the workspace
  if (
    isOwner ||
    isSuperAdminRole(user.role) ||
    ['org_admin', 'project_manager', 'team_lead'].includes(normalizedUserRole)
  ) {
    return true;
  }

  const project = await Project.findById(projectId).select('owner organization');
  if (!project) return false;

  // Project owner (creator) can modify/delete any file in their project
  if (project.owner.toString() === userIdStr) {
    return true;
  }

  // Directly check database organization membership to make permission check resilient
  if (project.organization) {
    const orgMember = await OrganizationMember.findOne({
      organization: project.organization,
      user: user._id,
      status: 'active'
    });
    if (orgMember && ['org_admin', 'project_manager', 'team_lead'].includes(normalizeRoleCode(orgMember.role))) {
      return true;
    }
  }

  // Project managers (either globally or project-specific role) can modify/delete any file
  if (normalizedUserRole === 'project_manager') {
    return true;
  }

  const membership = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: user._id
  });

  if (membership && ['project_manager', 'team_lead'].includes(normalizeRoleCode(membership.role))) {
    return true;
  }

  return false;
};

// Check if user is allowed to modify (create, upload, delete) files/folders in the project
const validateFileModifyPermission = async (projectId: string, userId: string, userRole: string) => {
  const normalizedUserRole = normalizeRoleCode(userRole);
  
  // SuperAdmin, OrgAdmin, ProjectManager, and TeamLead have full modify permissions
  if (
    isSuperAdminRole(userRole) ||
    ['org_admin', 'project_manager', 'team_lead'].includes(normalizedUserRole)
  ) {
    return true;
  }

  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ForbiddenError('You do not have permission to modify files in this project');
  }

  // Project Owner is always allowed
  const project = await Project.findById(projectId).select('owner organization');
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  if (project.owner.toString() === userId) {
    return true;
  }

  // Directly check database organization membership to make permission check resilient
  if (project.organization) {
    const orgMember = await OrganizationMember.findOne({
      organization: project.organization,
      user: new mongoose.Types.ObjectId(userId),
      status: 'active'
    });
    if (orgMember && ['org_admin', 'project_manager', 'team_lead'].includes(normalizeRoleCode(orgMember.role))) {
      return true;
    }
  }

  // Resolve project membership
  const membership = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId)
  });

  if (!membership) {
    throw new ForbiddenError('You are not a member of this project');
  }

  // Check if project member role has file modify privileges
  // In a standard project, project_manager, team_lead, developer, qa_tester, and member are allowed to contribute files.
  const projectRole = normalizeRoleCode(membership.role);
  const allowedRoles = ['project_manager', 'team_lead', 'developer', 'qa_tester', 'member', 'client'];
  
  if (allowedRoles.includes(projectRole) || allowedRoles.includes(normalizedUserRole)) {
    return true;
  }

  throw new ForbiddenError('You do not have permission to modify files in this project');
};


/**
 * @desc    Get files and folders in a project/directory
 * @route   GET /api/files
 * @access  Private
 */
export const getFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, parentId } = req.query;
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    if (!projectId) {
      throw new BadRequestError('Project ID is required');
    }

    await validateProjectMembership(projectId as string, req.user!._id.toString(), req.user!.role);

    // Convert parentId query param
    let parentQuery: any = null;
    if (parentId && parentId !== 'root' && parentId !== 'null') {
      parentQuery = new mongoose.Types.ObjectId(parentId as string);
    }

    const files = await File.find({
      projectId: new mongoose.Types.ObjectId(projectId as string),
      orgId,
      parentId: parentQuery
    })
    .populate('uploadedBy', 'name email avatar role')
    .sort({ isFolder: -1, name: 1 }); // Folders first, then alphabetical

    res.status(200).json({
      success: true,
      data: files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a folder
 * @route   POST /api/files/folder
 * @access  Private
 */
export const createFolder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, parentId, name } = req.body;
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    if (!projectId || !name) {
      throw new BadRequestError('Project ID and folder name are required');
    }

    await validateProjectMembership(projectId, req.user!._id.toString(), req.user!.role);
    await validateFileModifyPermission(projectId, req.user!._id.toString(), req.user!.role);

    let parentQuery: any = null;
    if (parentId && parentId !== 'root') {
      parentQuery = new mongoose.Types.ObjectId(parentId);
    }

    // Check for duplicate folder name in same path
    const duplicate = await File.findOne({
      projectId,
      parentId: parentQuery,
      name: name.trim()
    });

    if (duplicate) {
      throw new BadRequestError('A file or folder with this name already exists in this directory');
    }

    const folder = new File({
      projectId,
      orgId,
      name: name.trim(),
      isFolder: true,
      parentId: parentQuery,
      uploadedBy: req.user!._id
    });

    await folder.save();

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: folder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload file & handle versioning
 * @route   POST /api/files/upload
 * @access  Private
 */
export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, parentId } = req.body;
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    if (!projectId) {
      throw new BadRequestError('Project ID is required');
    }

    if (!req.file) {
      throw new BadRequestError('No file provided');
    }

    await validateProjectMembership(projectId, req.user!._id.toString(), req.user!.role);
    await validateFileModifyPermission(projectId, req.user!._id.toString(), req.user!.role);

    let parentQuery: any = null;
    if (parentId && parentId !== 'root' && parentId !== 'null') {
      parentQuery = new mongoose.Types.ObjectId(parentId);
    }

    const originalName = req.file.originalname;
    const fileUrl = req.file.path; // Cloudinary URL
    const fileKey = (req.file as any).filename; // Cloudinary Public ID
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    // Check if file with same name exists in directory for versioning
    const existingFile = await File.findOne({
      projectId,
      parentId: parentQuery,
      name: originalName,
      isFolder: false
    });

    let savedFile: IFile;

    if (existingFile) {
      const allowedToReplace = await canUserModifyOrDeleteFile(projectId, existingFile.uploadedBy, req.user!);
      if (!allowedToReplace) {
        throw new ForbiddenError('You do not have permission to replace this file');
      }

      // 1. Versioning: Move current version to history
      const oldVersion: IFileVersion = {
        fileUrl: existingFile.fileUrl!,
        fileKey: existingFile.fileKey!,
        version: existingFile.version,
        fileSize: existingFile.fileSize || 0,
        uploadedBy: existingFile.uploadedBy,
        createdAt: existingFile.updatedAt || new Date()
      };

      existingFile.versions.push(oldVersion);
      existingFile.fileUrl = fileUrl;
      existingFile.fileKey = fileKey;
      existingFile.fileSize = fileSize;
      existingFile.mimeType = mimeType;
      existingFile.version += 1;
      existingFile.uploadedBy = req.user!._id;

      savedFile = await existingFile.save();
    } else {
      // 2. New File creation
      const newFile = new File({
        projectId,
        orgId,
        name: originalName,
        isFolder: false,
        parentId: parentQuery,
        fileUrl,
        fileKey,
        fileSize,
        mimeType,
        version: 1,
        versions: [],
        uploadedBy: req.user!._id
      });

      savedFile = await newFile.save();
    }

    if (savedFile.parentId) {
      await updateParentFolderSizes(savedFile.parentId);
    }

    // Populate uploader details
    const populated = await File.findById(savedFile._id).populate('uploadedBy', 'name email avatar role');

    res.status(201).json({
      success: true,
      message: existingFile ? `File uploaded as version ${savedFile.version}` : 'File uploaded successfully',
      data: populated
    });
  } catch (error) {
    if (req.file && (req.file as any).filename) {
      const resourceType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';
      try {
        await cloudinary.uploader.destroy((req.file as any).filename, { resource_type: resourceType });
      } catch (cleanupError) {
        console.error('Failed to clean up Cloudinary upload on error:', cleanupError);
      }
    }
    next(error);
  }
};

// Recursive helper to gather all fileKeys and ObjectIds in a folder hierarchy
const gatherFolderContents = async (
  folderId: mongoose.Types.ObjectId,
  keysToDelete: string[],
  idsToDelete: mongoose.Types.ObjectId[]
) => {
  // Find immediate children
  const children = await File.find({ parentId: folderId });

  for (const child of children) {
    idsToDelete.push(child._id as mongoose.Types.ObjectId);
    if (!child.isFolder) {
      if (child.fileKey) keysToDelete.push(child.fileKey);
      // Gather keys from older versions too
      child.versions.forEach(v => {
        if (v.fileKey) keysToDelete.push(v.fileKey);
      });
    } else {
      // Recurse into subfolder
      await gatherFolderContents(child._id as mongoose.Types.ObjectId, keysToDelete, idsToDelete);
    }
  }
};

/**
 * @desc    Delete a file or folder
 * @route   DELETE /api/files/:id
 * @access  Private
 */
export const deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    const file = await File.findById(id);

    if (!file) {
      throw new NotFoundError('File/Folder not found');
    }

    await validateProjectMembership(file.projectId.toString(), req.user!._id.toString(), req.user!.role);
    await validateFileModifyPermission(file.projectId.toString(), req.user!._id.toString(), req.user!.role);

    const allowedToDelete = await canUserModifyOrDeleteFile(file.projectId.toString(), file.uploadedBy, req.user!);
    if (!allowedToDelete) {
      throw new ForbiddenError('You do not have permission to delete this file');
    }

    const keysToDelete: string[] = [];
    const idsToDelete: mongoose.Types.ObjectId[] = [file._id as mongoose.Types.ObjectId];

    if (file.isFolder) {
      // Gather all children recursively
      await gatherFolderContents(file._id as mongoose.Types.ObjectId, keysToDelete, idsToDelete);
    } else {
      if (file.fileKey) keysToDelete.push(file.fileKey);
      file.versions.forEach(v => {
        if (v.fileKey) keysToDelete.push(v.fileKey);
      });
    }

    // Delete assets from Cloudinary in background
    if (keysToDelete.length > 0) {
      Promise.all(keysToDelete.map(key => cloudinary.uploader.destroy(key)))
        .catch(err => console.error('Cloudinary asset deletion failed:', err));
    }

    const parentId = file.parentId;

    // Delete records from database
    await File.deleteMany({ _id: { $in: idsToDelete } });

    if (parentId) {
      await updateParentFolderSizes(parentId);
    }

    res.status(200).json({
      success: true,
      message: file.isFolder ? 'Folder and all its contents deleted' : 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const calculateFolderSize = async (folderId: mongoose.Types.ObjectId): Promise<number> => {
  let size = 0;
  const children = await File.find({ parentId: folderId });
  for (const child of children) {
    if (child.isFolder) {
      size += await calculateFolderSize(child._id as mongoose.Types.ObjectId);
    } else {
      size += child.fileSize || 0;
    }
  }
  return size;
};

const updateParentFolderSizes = async (parentId: mongoose.Types.ObjectId | null | undefined): Promise<void> => {
  if (!parentId) return;

  let totalSize = 0;
  const children = await File.find({ parentId });
  for (const child of children) {
    totalSize += child.fileSize || 0;
  }

  const parentFolder = await File.findById(parentId);
  if (parentFolder) {
    parentFolder.fileSize = totalSize;
    await parentFolder.save();

    if (parentFolder.parentId) {
      await updateParentFolderSizes(parentFolder.parentId);
    }
  }
};

interface IZipFileItem {
  name: string;
  fileUrl: string;
  relativePath: string;
}

const gatherFilesForZip = async (
  folderId: mongoose.Types.ObjectId,
  currentRelativePath: string,
  items: IZipFileItem[]
) => {
  const children = await File.find({ parentId: folderId });
  for (const child of children) {
    if (child.isFolder) {
      await gatherFilesForZip(
        child._id as mongoose.Types.ObjectId,
        `${currentRelativePath}${child.name}/`,
        items
      );
    } else {
      if (child.fileUrl) {
        items.push({
          name: child.name,
          fileUrl: child.fileUrl,
          relativePath: `${currentRelativePath}${child.name}`
        });
      }
    }
  }
};

/**
 * @desc    Download a folder as a ZIP file
 * @route   GET /api/files/download-folder/:id
 * @access  Private
 */
export const downloadFolderAsZip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organization;

    if (!orgId) {
      throw new BadRequestError('Active Organization context not found');
    }

    const folder = await File.findById(id);
    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    if (!folder.isFolder) {
      throw new BadRequestError('Target is not a folder');
    }

    await validateProjectMembership(folder.projectId.toString(), req.user!._id.toString(), req.user!.role);

    const items: IZipFileItem[] = [];
    await gatherFilesForZip(folder._id as mongoose.Types.ObjectId, `${folder.name}/`, items);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(folder.name)}.zip"`);

    const archive = new ZipArchive({
      zlib: { level: 9 }
    });

    archive.on('error', (err: any) => {
      console.error('Archiver error:', err);
      // If headers aren't sent yet, we can send error, otherwise we just close the connection
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Archive creation failed' });
      }
    });

    archive.pipe(res);

    const failedFiles: { name: string; status: number; statusText: string; url: string }[] = [];

    for (const item of items) {
      try {
        const fileResponse = await axios.get(item.fileUrl, { responseType: 'stream' });
        archive.append(fileResponse.data, { name: item.relativePath });
      } catch (err: any) {
        console.error(`Failed to add file ${item.relativePath} to zip:`, err);
        failedFiles.push({
          name: item.relativePath,
          status: err.response?.status || 0,
          statusText: err.response?.statusText || err.message || 'Fetch/Stream error',
          url: item.fileUrl
        });
      }
    }

    if (failedFiles.length > 0) {
      let warningText = `The following files could not be included in this ZIP archive:\n`;
      failedFiles.forEach(f => {
        warningText += `- ${f.name} (Status: ${f.status} ${f.statusText})\n`;
      });
      
      warningText += `\nWhy did this happen?\n`;
      warningText += `This usually happens because the Cloudinary account has a security setting enabled that blocks the delivery of PDF, ZIP, and other non-image files (returning 401 Unauthorized).\n\n`;
      warningText += `How to fix this:\n`;
      warningText += `1. Log in to your Cloudinary Console (https://cloudinary.com).\n`;
      warningText += `2. Click on Settings (gear icon in the bottom left or top right).\n`;
      warningText += `3. Navigate to the "Security" tab.\n`;
      warningText += `4. Locate the option "Restrict PDF and ZIP files delivery" (or "PDF and ZIP files delivery").\n`;
      warningText += `5. Uncheck/Disable this restriction (or select "Allow delivery of PDF and ZIP files"), and save your changes.\n`;
      warningText += `6. Wait a few seconds for CDN propagation, and try downloading the folder again.\n`;

      archive.append(Buffer.from(warningText), { name: 'WARNING_skipped_files.txt' });
    }

    await archive.finalize();
  } catch (error) {
    next(error);
  }
};
