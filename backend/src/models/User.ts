import mongoose, { Document, Types } from 'mongoose';
import { UserRole } from '../types/roles.js'
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  password?: string;
  googleId?: string;
  githubId?: string;
  organization?: Types.ObjectId;
  organizations?: Types.ObjectId[];
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  verificationToken?: string;
  verificationTokenExpire?: Date;
  isTwoFactorEnabled: boolean;
  twoFactorOTP?: string;
  twoFactorOTPExpire?: Date;
  passwordResetToken?: string;
  passwordResetExpire?: Date;
  phoneNumber?: string;
  designation?: string;
  pendingEmail?: string;
  emailChangeToken?: string;
  emailChangeTokenExpire?: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  username: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function (this: any) {
      return !this.googleId && !this.githubId;
    },
    minlength: 6,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  organizations: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization'
    }],
    default: []
  },
  role: {
    type: String,
    default: UserRole.MEMBER
  },
  avatar: {
    type: String,
    default: ""
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationToken: {
    type: String,
    select: false
  },
  verificationTokenExpire: {
    type: Date,
    select: false
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },

  twoFactorOTP: {
    type: String,
    select: false
  },

  twoFactorOTPExpire: {
    type: Date,
    select: false
  },

  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpire: {
    type: Date,
    select: false
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  designation: {
    type: String,
    trim: true,
  },
  pendingEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  emailChangeToken: {
    type: String,
    select: false
  },
  emailChangeTokenExpire: {
    type: Date,
    select: false
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.username && this.name) {
    this.username = this.name.toLowerCase().replace(/\s+/g, '');
  } else if (this.username) {
    this.username = this.username.toLowerCase().trim();
  }

  if (!this.isModified('password') || !this.password) return next();

  if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$') || this.password.startsWith('$2y$')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
