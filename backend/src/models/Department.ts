import mongoose, { Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  orgId: Types.ObjectId;
  name: string;
  head?: Types.ObjectId;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new mongoose.Schema<IDepartment>(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    memberCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDepartment>('Department', departmentSchema);
