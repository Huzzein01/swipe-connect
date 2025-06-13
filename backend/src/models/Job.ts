import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  title: string;
  company: string;
  description: string;
  location: string;
  type: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  requirements: string[];
  benefits?: string[];
  source: {
    name: string;
    url: string;
    id: string;
  };
  applicationUrl: string;
  postedDate: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true },
    salary: {
      min: Number,
      max: Number,
      currency: String,
    },
    requirements: [String],
    benefits: [String],
    source: {
      name: { type: String, required: true },
      url: { type: String, required: true },
      id: { type: String, required: true },
    },
    applicationUrl: { type: String, required: true },
    postedDate: { type: Date, required: true },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for efficient querying
JobSchema.index({ postedDate: -1 });
JobSchema.index({ isActive: 1 });
JobSchema.index({ 'source.name': 1, 'source.id': 1 }, { unique: true });

export default mongoose.model<IJob>('Job', JobSchema); 