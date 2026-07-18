import mongoose, { Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  performedBy: Types.ObjectId;
  action:
    | 'ban_user'
    | 'unban_user'
    | 'suspend_org'
    | 'activate_org'
    | 'change_role'
    | 'delete_project'
    | 'seed_superadmin'
    | 'change_plan';
  targetUserId?: Types.ObjectId;
  targetOrgId?: Types.ObjectId;
  targetResourceId?: Types.ObjectId;
  targetModel?: string;
  reason?: string;
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performing user is required'],
      index: true,
    },
    action: {
      type: String,
      enum: [
        'ban_user',
        'unban_user',
        'suspend_org',
        'activate_org',
        'change_role',
        'delete_project',
        'seed_superadmin',
        'change_plan',
      ],
      required: [true, 'Action type is required'],
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetOrgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    targetResourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetModel: {
      type: String,
      trim: true,
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
