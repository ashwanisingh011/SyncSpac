import mongoose, {Document, Schema, Types} from 'mongoose';

export interface IProjectSettings extends Document {
    project: Types.ObjectId;
    organization: Types.ObjectId;
    allowSelfInvite: boolean;
    taskEstimatesTypes: 'hours' | 'points';
    defaultAssignee?: Types.ObjectId;
}

const ProjectSettingSchema = new Schema<IProjectSettings>({
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    allowSelfInvite:{
        type: Boolean,
        default: false
    },
    taskEstimatesTypes: {
        type: String,
        enum: ['hours', 'points'],
        default: 'hours'
    },
    defaultAssignee: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
},{timestamps: true})

export default mongoose.model<IProjectSettings>('ProjectSettings', ProjectSettingSchema);







