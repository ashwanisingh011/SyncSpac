import mongoose, { Document, Types } from 'mongoose';

export interface ITaskHistory extends Document {
  task: Types.ObjectId;
  user: Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'comment' | 'attachment';
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskHistorySchema = new mongoose.Schema<ITaskHistory>(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'comment', 'attachment'],
      required: [true, 'Action type is required'],
    },
    field: {
      type: String,
      trim: true,
      default: null,
    },
    oldValue: {
      type: String,
      trim: true,
      default: null,
    },
    newValue: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITaskHistory>('TaskHistory', taskHistorySchema);
