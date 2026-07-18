import mongoose, { Document, Types } from 'mongoose';

export interface ITaskCommentReaction {
  userId: Types.ObjectId;
  emoji: string;
}

export interface ITaskComment extends Document {
  task: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  reactions: ITaskCommentReaction[];
}

const taskCommentSchema = new mongoose.Schema<ITaskComment>(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    content: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
    },
    reactions: {
      type: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          emoji: { type: String, required: true }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model<ITaskComment>('TaskComment', taskCommentSchema);
