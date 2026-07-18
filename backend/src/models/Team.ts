import mongoose, { Document, Types } from 'mongoose';

export interface ITeam extends Document {
  orgId: Types.ObjectId;
  name: string;
  description?: string;
  lead?: Types.ObjectId;
  members: Types.ObjectId[];
  projectIds: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new mongoose.Schema<ITeam>(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Team name is required'],
      maxlength: [100, 'Team name cannot exceed 100 characters'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    projectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITeam>('Team', teamSchema);
