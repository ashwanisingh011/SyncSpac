import mongoose, {Schema, Document} from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?: string;
    status: 'todo' | 'inProgress' | 'done';
    project: mongoose.Types.ObjectId;
    assigned?: mongoose.Types.ObjectId;
}

const TaskSchema: Schema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['todo', 'inProgress', 'done'],
        default: 'todo'
    },
    project: {
        type: mongoose.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    assigned: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, {timestamps: true});

export default mongoose.model<ITask>('Task', TaskSchema);