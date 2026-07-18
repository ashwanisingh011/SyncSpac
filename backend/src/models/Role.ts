import mongoose, { Document, Types } from 'mongoose';

export interface IRole extends Document {
  name: string;
  code: string;
  description?: string;
  orgId?: Types.ObjectId | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new mongoose.Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Role code is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IRole>('Role', roleSchema);
