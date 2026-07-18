import mongoose, { Document, Types } from 'mongoose';

export interface ITaskDependency extends Document {
  task: Types.ObjectId;
  dependsOn: Types.ObjectId;
  type: 'blocks' | 'blocked-by';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskDependencySchema = new mongoose.Schema<ITaskDependency>(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required'],
      index: true,
    },
    dependsOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Dependent task reference is required'],
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked-by'],
      default: 'blocked-by',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  { timestamps: true }
);

// Prevent duplicate dependency declarations
taskDependencySchema.index({ task: 1, dependsOn: 1, type: 1 }, { unique: true });

export default mongoose.model<ITaskDependency>('TaskDependency', taskDependencySchema);
