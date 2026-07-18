import mongoose, {Document, Types} from 'mongoose';

export interface IOrganization extends Document {
    name: string,
    slug: string,
    description?: string,
    logo?: string,
    owner: Types.ObjectId,
    subscriptionStatus: 'trial' | 'active' | 'suspended';
    plan: 'free' | 'pro' | 'business' | 'enterprise';
    isDeleted: boolean;
    cardLast4?: string;
    cardBrand?: string;
    billingCycle?: 'monthly' | 'yearly';
    processedPayments?: string[];
}

const organizationSchema = new mongoose.Schema<IOrganization>({
    name:{
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        lowercase: true,
        index: true
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
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subscriptionStatus: {
        type: String,
        enum: ['trial', 'active', 'suspended'],
        default: 'trial'
    },
    plan: {
        type: String,
        default: 'free',
        lowercase: true,
        trim: true
    },
    cardLast4: {
        type: String,
        default: ''
    },
    cardBrand: {
        type: String,
        default: ''
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    processedPayments: {
        type: [String],
        default: []
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

organizationSchema.pre('validate', function(next: any) {
   if(this.name && !this.slug){
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
   }
   next();
});

export default mongoose.model<IOrganization>('Organization', organizationSchema)
