import mongoose, { Document, Types } from 'mongoose';

export interface ITaskAttachment extends Document {
  task: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileKey: string; // Cloudinary public ID
  fileSize: number;
  mimeType: string;
}

const taskAttachmentSchema = new mongoose.Schema<ITaskAttachment>(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required'],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    fileKey: {
      type: String,
      required: [true, 'File Cloudinary key is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'Mime type is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITaskAttachment>('TaskAttachment', taskAttachmentSchema);
