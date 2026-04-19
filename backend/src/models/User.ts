import mongoose, {Schema, Document} from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: string;
}

const UserSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        trim: true
    },
    avatar: {
        type: String,
        default: '',
        trim: true 
    },
}, {timestamps: true});

export default mongoose.model<IUser>('User', UserSchema);