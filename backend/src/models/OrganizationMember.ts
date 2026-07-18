import mongoose, { Document, Types } from 'mongoose';

export enum OrgRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member',
    GUEST = 'guest'
}

export interface IOrganizationMember extends Document{
    organization: Types.ObjectId;
    user: Types.ObjectId;
    role: string;
    status: 'pending' | 'active' | 'suspended';
    invitedBy?: Types.ObjectId;
    joinedAt?: Date 
    invitedToken?: string;
    invitedTokenExpire?: Date;
}

const OrganizationMemberSchema = new mongoose.Schema<IOrganizationMember>({
    organization: {
        type: mongoose.Schema.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    role: {
        type: String,
        default: OrgRole.MEMBER,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'pending',
        // required: true
    },
    invitedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    joinedAt: {
        type: Date
    },
    invitedToken: {
        type: String,
        select: false
    },
    invitedTokenExpire: {
        type: Date,
        select: false
    }
}, {timestamps: true})

OrganizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });

export default mongoose.model<IOrganizationMember>('OrganizationMember', OrganizationMemberSchema);
