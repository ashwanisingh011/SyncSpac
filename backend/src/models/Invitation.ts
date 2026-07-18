import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvitation extends Document {
  email: string;
  organization: Types.ObjectId;
  role?: string;
  token: string;
  invitedBy: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required']
  },
  role: {
    type: String,
    default: 'member',
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

export default mongoose.model<IInvitation>('Invitation', invitationSchema);
