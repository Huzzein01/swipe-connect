import axios from 'axios';
import { IJob } from '../../models/Job';

interface JobData {
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
  benefits: string[];
  source: {
    name: string;
    url: string;
    id: string;
  };
  applicationUrl: string;
  postedDate: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export class LinkedInAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.LINKEDIN_API_KEY || '';
    this.baseUrl = 'https://api.linkedin.com/v2';
  }

  async searchJobs(params: {
    keywords?: string;
    location?: string;
    experience?: string;
    jobType?: string;
    limit?: number;
    offset?: number;
  }): Promise<JobData[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/jobs/search`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          keywords: params.keywords,
          location: params.location,
          experience: params.experience,
          jobType: params.jobType,
          count: params.limit || 10,
          start: params.offset || 0,
        },
      });

      return this.transformJobs(response.data.elements);
    } catch (error) {
      console.error('Error fetching jobs from LinkedIn:', error);
      throw error;
    }
  }

  async getJobDetails(jobId: string): Promise<JobData> {
    try {
      const response = await axios.get(`${this.baseUrl}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return this.transformJob(response.data);
    } catch (error) {
      console.error('Error fetching job details from LinkedIn:', error);
      throw error;
    }
  }

  private transformJobs(jobs: any[]): JobData[] {
    return jobs.map(job => this.transformJob(job));
  }

  private transformJob(job: any): JobData {
    return {
      title: job.title,
      company: job.company.name,
      location: job.location.name,
      type: job.employmentStatus,
      description: job.description,
      requirements: job.requirements || [],
      benefits: job.benefits || [],
      salary: job.salary ? {
        min: job.salary.min,
        max: job.salary.max,
        currency: job.salary.currency,
      } : undefined,
      source: {
        name: 'LinkedIn',
        url: 'https://www.linkedin.com',
        id: job.id
      },
      applicationUrl: job.applyUrl,
      postedDate: new Date(job.postedAt),
      expiresAt: job.expiresAt ? new Date(job.expiresAt) : undefined,
      isActive: true,
    };
  }
} 