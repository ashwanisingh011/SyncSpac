import mongoose, { Document, Types } from 'mongoose';
import Project from './Project.js';

export interface IChecklistItem {
  _id: Types.ObjectId;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  type: 'task' | 'bug' | 'epic' | 'story' | 'subtask' | 'improvement';
  status: string;
  priority: 'low' | 'medium' | 'high';
  project: Types.ObjectId;
  sprintId: Types.ObjectId;
  storyPoints: number;
  organization: Types.ObjectId;
  taskKey: string;      // e.g., "ENG-1"
  sequence: number;     // e.g., 1
  dueDate?: Date;
  estimatedTime?: number; // in minutes
  watchers: Types.ObjectId[];
  checklist: IChecklistItem[];
  labels: Types.ObjectId[];
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  assignedBy?: Types.ObjectId;
}

const checklistItemSchema = new mongoose.Schema<IChecklistItem>(
  {
    title: {
      type: String,
      required: [true, 'Checklist item title is required'],
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['task', 'bug', 'epic', 'story', 'subtask', 'improvement'],
      default: 'task',
    },
    status: {
      type: String,
      default: 'todo',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    sprintId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sprint',
        default: null // Null explicitly indicates the task resides in the loose Backlog
    },
    storyPoints: {
        type: Number,
        min: [0, 'Story points cannot be negative'],
        max: [100, 'Story points cannot exceed an enterprise threshold of 100'],
        default: 0 // Default to 0 meaning unestimated
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    taskKey: {
      type: String,
      required: true 
    },
    sequence: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
    },
    estimatedTime: {
      type: Number,
      min: [0, 'Estimated time cannot be negative'],
    },
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    checklist: [checklistItemSchema],
    labels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label',
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

taskSchema.index(
  { organization: 1, taskKey: 1 },
  { 
    unique: true, 
    partialFilterExpression: { taskKey: { $exists: true } } 
  }
);

taskSchema.pre('validate', async function (next) {
  if (this.isNew) {
    try {
      const project = await mongoose.model('Project').findOneAndUpdate(
        { _id: this.project },
        { $inc: { lastTaskSequence: 1 } },
        { new: true, useFindAndModify: false }
      ).select('key lastTaskSequence');

      if (!project) {
        return next(new Error('Project not found'));
      }

      const seq = project.lastTaskSequence;
      const prefix = project.key ? project.key.toUpperCase() : 'TASK';
      this.taskKey = `${prefix}-${seq}`;

      const lastTask = await mongoose.model('Task')
        .findOne({ project: this.project, organization: this.organization })
        .sort({ sequence: -1 })
        .select('sequence');

      const nextSequence = lastTask && typeof lastTask.sequence === 'number' ? lastTask.sequence + 1 : 1;
      this.sequence = nextSequence;
    } catch (error: any) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model<ITask>('Task', taskSchema);
