import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId | null;
  type: 'INVITATION_RECEIVED' | 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'COMMENT_ADDED' | 'PROJECT_UPDATED';
  title: string;
  message: string;
  isRead: boolean;
  relatedEntity: Types.ObjectId;
  entityModel: 'Task' | 'Project' | 'Organization' | 'Invitation';
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: ['INVITATION_RECEIVED', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'COMMENT_ADDED', 'PROJECT_UPDATED'],
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    relatedEntity: {
      type: Schema.Types.ObjectId,
      required: [true, 'Related entity is required'],
      refPath: 'entityModel',
    },
    entityModel: {
      type: String,
      required: [true, 'Entity model type is required'],
      enum: ['Task', 'Project', 'Organization', 'Invitation'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<INotification>('Notification', notificationSchema);
