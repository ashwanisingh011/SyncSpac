import mongoose, {Document, Types} from 'mongoose'

export interface IProjectStatus extends Document{
    name: string;
    color: string;
    order: number;
    project: Types.ObjectId;
    organization: Types.ObjectId;
}

const ProjectStatusSchema = new mongoose.Schema<IProjectStatus>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    color:{
        type: String,
        default: '#cbd5e0'
    },
    order: {
        type: Number,
        default: 0
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true 
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true 
    }
}, { timestamps: true });

ProjectStatusSchema.index({project: 1, name: 1}, {unique: true});

export default mongoose.model<IProjectStatus>('ProjectStatus', ProjectStatusSchema);





