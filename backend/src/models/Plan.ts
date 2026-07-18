import mongoose, { Document } from 'mongoose';

export interface IPlanFeature {
  label: string;
  included: boolean;
}

export interface IPlanLimits {
  users: number; // -1 for unlimited
  projects: number; // -1 for unlimited
  storage: number; // GB, -1 for unlimited
  apiCalls: number; // -1 for unlimited
}

export interface IPlan extends Document {
  name: string;
  code: string; // unique, uppercase, e.g., 'FREE', 'PRO', 'BUSINESS'
  description: string;
  billingCycle: 'monthly' | 'yearly';
  price: number;
  currency: string; // default: 'INR'
  status: 'active' | 'inactive';
  badge?: string;
  features: IPlanFeature[];
  limits: IPlanLimits;
}

const planSchema = new mongoose.Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    badge: { type: String, default: '' },
    features: [
      {
        label: { type: String, required: true },
        included: { type: Boolean, default: true },
      },
    ],
    limits: {
      users: { type: Number, default: -1 },
      projects: { type: Number, default: -1 },
      storage: { type: Number, default: -1 },
      apiCalls: { type: Number, default: -1 },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>('Plan', planSchema);
