import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  members: {
    user: mongoose.Types.ObjectId;
    role: string;
  }[];
  projects: mongoose.Types.ObjectId[];
}

const WorkspaceSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', // <-- This links to your User model!
      required: true 
    },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'member', 'guest'], default: 'member' }
      }
    ],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }]
  },
  { timestamps: true }
);

export default mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);