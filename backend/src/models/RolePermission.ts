import mongoose, { Document, Types } from 'mongoose';

export interface IRolePermission extends Document {
  roleId: Types.ObjectId;
  permissionId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rolePermissionSchema = new mongoose.Schema<IRolePermission>(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role ID is required'],
    },
    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission',
      required: [true, 'Permission ID is required'],
    },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate permissions on a role
rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

export default mongoose.model<IRolePermission>('RolePermission', rolePermissionSchema);
