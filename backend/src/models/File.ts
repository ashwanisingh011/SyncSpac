import mongoose, { Document, Types } from 'mongoose';

export interface IFileVersion {
  fileUrl: string;
  fileKey: string;
  version: number;
  fileSize: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
}

export interface IFile extends Document {
  projectId: Types.ObjectId;
  orgId: Types.ObjectId;
  name: string;
  isFolder: boolean;
  parentId?: Types.ObjectId | null;
  fileUrl?: string;
  fileKey?: string;
  fileSize?: number;
  mimeType?: string;
  version: number;
  versions: IFileVersion[];
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const fileVersionSchema = new mongoose.Schema<IFileVersion>({
  fileUrl: { type: String, required: true },
  fileKey: { type: String, required: true },
  version: { type: Number, required: true },
  fileSize: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const fileSchema = new mongoose.Schema<IFile>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'File/Folder name is required'],
      trim: true,
    },
    isFolder: {
      type: Boolean,
      default: false,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileKey: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
    versions: [fileVersionSchema],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate names of folders/files within the same folder parent scope in a project
fileSchema.index({ projectId: 1, parentId: 1, name: 1 }, { unique: true });

export default mongoose.model<IFile>('File', fileSchema);
