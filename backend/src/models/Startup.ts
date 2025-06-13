import mongoose, { Document, Schema } from 'mongoose';

export interface IStartup extends Document {
  name: string;
  description: string;
  industry: string;
  location: string;
  logo?: string;
  website: string;
  funding?: {
    stage: string;
    amount: number;
    currency: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const startupSchema = new Schema<IStartup>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
  },
  website: {
    type: String,
    required: true,
  },
  funding: {
    stage: String,
    amount: Number,
    currency: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model<IStartup>('Startup', startupSchema); 