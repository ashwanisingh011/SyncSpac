import mongoose,{Document, Schema} from "mongoose";

export interface IProject extends Document {
    name: string,
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
})

export default mongoose.model<IProject>("Project", ProjectSchema);