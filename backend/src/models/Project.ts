import mongoose, {Document, Types} from 'mongoose'

export enum ProjectType {
    SOFTWARE = 'software',
    MARKETING = 'marketing',
    HR = 'hr',
    CLIENT = 'client',
}

export enum ProjectVisibilty{
    PUBLIC = 'public',
    PRIVATE = 'private'
}

export interface IProject extends Document {
    name: string;
    key: string;
    description: string;
    logo?: string;
    projectType: ProjectType;
    visibility: ProjectVisibilty
    isArchived: boolean;
    status: 'active' | 'on-hold' | 'completed'
    organization: Types.ObjectId;
    owner: Types.ObjectId;
    taskCount: number;
    lastTaskSequence: number;
    defaultLayout: 'kanban' | 'list' | 'calendar' | 'timeline';
}

const projectSchema = new mongoose.Schema<IProject>({
    name:{
        type: String,
        required: true,
        trim: true
    },
    key: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        match: /^[A-Z0-9]+$/
    },
    
    description: {
        type: String,
        trim: true,
        default: ''
    },
    logo: {
        type: String,
        default: ''
    },
    projectType: {
        type: String,
        enum: Object.values(ProjectType),
        default: ProjectType.SOFTWARE
    },
    visibility: {
        type: String,
        enum: Object.values(ProjectVisibilty),
        default: ProjectVisibilty.PRIVATE
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'on-hold', 'completed'],
        default: 'active'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskCount: {
        type: Number,
        default: 0
    },
    lastTaskSequence: {
        type: Number,
        default: 0
    },
    defaultLayout: {
    type: String,
    enum: ['kanban', 'list', 'calendar', 'timeline'],
    default: 'kanban'
}
}, {timestamps: true})

projectSchema.index({organization: 1, name: 1}, {unique: true});

export default mongoose.model<IProject>('Project', projectSchema);

