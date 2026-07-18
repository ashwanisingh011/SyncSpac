import mongoose,{Document, Types} from 'mongoose';

export interface ISession extends Document {
    user: Types.ObjectId;
    refreshToken: string;
    userAgent: string;
    ipAddress: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
}



const SessionSchema = new mongoose.Schema<ISession>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    refreshToken: {
        type: String,
        index: true
    },
    userAgent: {
        type: String
    },
    ipAddress: {
        type: String
    },
    expiresAt: {
        type: Date
    },
    lastActivityAt: {
        type: Date
    }
}, {timestamps: true});

export default mongoose.model<ISession>('Session', SessionSchema);