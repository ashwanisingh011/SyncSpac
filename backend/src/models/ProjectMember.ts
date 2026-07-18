import mongoose, {Document, Types} from 'mongoose'
import { UserRole } from '../types/roles.js'

export interface IProjectMember extends Document{
    project: Types.ObjectId,
    user: Types.ObjectId,
    role: UserRole,
    organization: Types.ObjectId,
}

const projectMemberSchema = new mongoose.Schema<IProjectMember>({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.MEMBER
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    }
}, {timestamps: true})

projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });
export default mongoose.model<IProjectMember>('ProjectMember', projectMemberSchema)