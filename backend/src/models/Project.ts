import mongoose,{Document, Schema} from "mongoose";

export interface IProject extends Document {
    name: string,
    description?: string,
    workspace: mongoose.Types.ObjectId,
    columns: {
        todo: mongoose.Types.ObjectId[];
        inProgress: mongoose.Types.ObjectId[];
        done: mongoose.Types.ObjectId[];
    }
}

const ProjectSchema: Schema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true
    },
    columns: {
        todo: [{type: Schema.Types.ObjectId, ref: "Task"}],
        inProgress: [{type: Schema.Types.ObjectId, ref: "Task"}],
        done: [{type: Schema.Types.ObjectId, ref: "Task"}]
    }
}, {timestamps: true});

export default mongoose.model<IProject>("Project", ProjectSchema);