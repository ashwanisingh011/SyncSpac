import mongoose, { Document, Types } from 'mongoose';

export interface ILabel extends Document {
  name: string;
  color: string;
  organization: Types.ObjectId;
  project?: Types.ObjectId | null;
}

const labelSchema = new mongoose.Schema<ILabel>(
  {
    name: {
      type: String,
      required: [true, 'Label name is required'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Label color is required'],
      trim: true,
      default: '#e0e0e0', // standard grey fallback
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// A label name must be unique within an organization/project scope
labelSchema.index({ organization: 1, project: 1, name: 1 }, { unique: true });

export default mongoose.model<ILabel>('Label', labelSchema);
