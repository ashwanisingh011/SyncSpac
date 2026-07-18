import mongoose, { Document, Types } from 'mongoose';

export interface ITaskTimeLog extends Document {
  task: Types.ObjectId;
  user: Types.ObjectId;
  duration: number; // in minutes
  description?: string;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskTimeLogSchema = new mongoose.Schema<ITaskTimeLog>(
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
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Logged duration must be at least 1 minute'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    loggedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITaskTimeLog>('TaskTimeLog', taskTimeLogSchema);
