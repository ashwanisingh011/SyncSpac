import mongoose, { Document } from 'mongoose';

export interface IPermission extends Document {
  code: string;
  label: string;
  module: 'auth' | 'workspace' | 'project' | 'task' | 'sprint' | 'team' | 'billing' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new mongoose.Schema<IPermission>(
  {
    code: {
      type: String,
      required: [true, 'Permission code is required'],
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: [true, 'Permission label is required'],
      trim: true,
    },
    module: {
      type: String,
      required: [true, 'Permission module is required'],
      enum: ['auth', 'workspace', 'project', 'task', 'sprint', 'team', 'billing', 'admin'],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPermission>('Permission', permissionSchema);
