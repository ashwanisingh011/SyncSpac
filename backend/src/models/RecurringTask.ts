import mongoose, { Document, Types } from 'mongoose';

export interface IRecurringTask extends Document {
  organization: Types.ObjectId;
  project: Types.ObjectId;
  title: string;
  description?: string;
  type: 'task' | 'bug' | 'epic' | 'story' | 'subtask' | 'improvement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime?: number; // in minutes
  assignee?: Types.ObjectId;
  labels: Types.ObjectId[];
  cronExpression: string; // e.g., '0 0 * * *'
  nextRunTime: Date;
  lastRunTime?: Date;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const recurringTaskSchema = new mongoose.Schema<IRecurringTask>(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['task', 'bug', 'epic', 'story', 'subtask', 'improvement'],
      default: 'task',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    estimatedTime: {
      type: Number,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    labels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label',
      },
    ],
    cronExpression: {
      type: String,
      required: [true, 'Cron expression is required'],
      trim: true,
    },
    nextRunTime: {
      type: Date,
      required: [true, 'Next run time is required'],
      index: true,
    },
    lastRunTime: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IRecurringTask>('RecurringTask', recurringTaskSchema);
