export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  industry: string;
  postedDate: string;
  applicationDeadline?: string;
  remote: boolean;
  benefits?: string[];
  companyLogo?: string;
  source?: {
    name: string;
    url: string;
    id: string;
  };
  applicationUrl?: string;
  matchScore?: number;
  companyStage?: string;
  workStyle?: string;
  whyMatch?: string[];
}

export interface UserPreferences {
  industries: string[];
  jobTypes: ('full-time' | 'part-time' | 'contract' | 'internship')[];
  location: {
    city: string;
    state: string;
    radius: number; // in miles
  };
  salaryRange?: {
    min: number;
    max: number;
  };
  remote: boolean;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface Resume {
  id: string;
  userId: string;
  fileUrl: string;
  parsedData: {
    name: string;
    email: string;
    phone?: string;
    location: {
      city: string;
      state: string;
    };
    education: {
      degree: string;
      field: string;
      institution: string;
      graduationDate: string;
    }[];
    experience: {
      title: string;
      company: string;
      location: string;
      startDate: string;
      endDate?: string;
      description: string;
    }[];
    skills: string[];
    certifications?: string[];
  };
  lastUpdated: string;
}

export interface ApplicationRecord {
  id: string;
  job: Job;
  applicant: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  status: 'queued' | 'needs-review' | 'submitted';
  confirmationMessage: string;
  email?: {
    sent: boolean;
    id?: string;
    reason?: string;
  };
  createdAt: string;
  nextStepUrl: string;
}
