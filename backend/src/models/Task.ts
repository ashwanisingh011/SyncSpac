import mongoose, {Document, Schema} from "mongoose"

export interface ITask extends Document {
    title: String,
    columnId: mongoose.Types.ObjectId,
    assignee: mongoose.Types.ObjectId,
    dueDate: Date,
    priority: String,
    attachments: String[],
    subTasks: SubTask[],
    labels: String[],
    description: String,
    comments: Comment[],
    estimatedTime: Number,  
    actualTime: Number,
    
}


const TaskSchema: Schema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    columnId: {
        type: Schema.Types.ObjectId,
        ref: "Column",
        required: true
    },
    assignee: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    dueDate: {
        type: Date,
        default: null
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    attachments: {
        type: [String],
        default: []
    },
    subTasks: {
        type: [{
            title: String,
            completed: Boolean
        }],
        default: []
    },
    labels: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    comments: {
        type: [{
            author: String,
            content: String,
            timestamp: Date
        }],
        default: []
    },
    estimatedTime: {
        type: Number,
        default: 0
    },
    actualTime: {
        type: Number,
        default: 0
    }
})

export default mongoose.model<ITask>("Task", TaskSchema);