import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  linkedInId: string;
  resume?: {
    filePath: string;
    parsedData?: {
      skills: string[];
      experience: {
        company: string;
        title: string;
        startDate: string;
        endDate: string;
        description: string;
      }[];
      education: {
        school: string;
        degree: string;
        field: string;
        graduationDate: string;
      }[];
    };
  };
  phone?: string;
  experience?: {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education?: {
    school: string;
    degree: string;
    field: string;
    graduationDate: string;
  }[];
  preferences: {
    jobTypes: string[];
    locations: string[];
    experienceLevel: string;
    salaryRange: {
      min: number;
      max: number;
    };
    startups: Array<{
      startup: mongoose.Types.ObjectId;
      action: 'like' | 'dislike';
      timestamp: Date;
    }>;
  };
  savedJobs: mongoose.Types.ObjectId[];
  swipedJobs: {
    jobId: mongoose.Types.ObjectId;
    action: 'like' | 'dislike';
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  linkedInId: { type: String, required: true, unique: true },
  resume: {
    filePath: String,
    parsedData: {
      skills: [String],
      experience: [{
        company: String,
        title: String,
        startDate: String,
        endDate: String,
        description: String,
      }],
      education: [{
        school: String,
        degree: String,
        field: String,
        graduationDate: String,
      }],
    },
  },
  phone: String,
  experience: [{
    company: String,
    title: String,
    startDate: String,
    endDate: String,
    description: String,
  }],
  education: [{
    school: String,
    degree: String,
    field: String,
    graduationDate: String,
  }],
  preferences: {
    jobTypes: [String],
    locations: [String],
    experienceLevel: String,
    salaryRange: {
      min: Number,
      max: Number,
    },
    startups: [{
      startup: {
        type: Schema.Types.ObjectId,
        ref: 'Startup',
      },
      action: {
        type: String,
        enum: ['like', 'dislike'],
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  savedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
  swipedJobs: [{
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    action: { type: String, enum: ['like', 'dislike'] },
    timestamp: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', userSchema); 