import mongoose, {Types, Document} from 'mongoose'

export interface IWorkspaceSettings extends Document {
    organization: Types.ObjectId;
    primaryColor: string;
    secondaryColor: string;
    timezone: string;
    language: string;
    defaultLayout: 'kanban' | 'list' | 'calendar' | 'timeline';
}

const workspaceSettingsSchema = new mongoose.Schema<IWorkspaceSettings>({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
        unique: true
    },
    primaryColor: {
        type: String,
        default: '#000000',
        trim: true 
    },
    secondaryColor: {
        type: String,
        default: '#FFFFFF',
        trim: true
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata'
    },
    language: {
        type: String,
        default: 'en',
        trim: true
    },
    defaultLayout: {
    type: String,
    enum: ['kanban', 'list', 'calendar', 'timeline'],
    default: 'kanban'
}
}, {timestamps: true});

export default mongoose.model<IWorkspaceSettings>('WorkspaceSettings', workspaceSettingsSchema);