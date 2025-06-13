import { IJob } from '../../models/Job';
import Job from '../../models/Job';

export abstract class BaseScraper {
  abstract readonly sourceName: string;
  abstract readonly sourceUrl: string;

  abstract scrape(): Promise<IJob[]>;

  protected createJob(data: Partial<IJob>): IJob {
    const jobData = {
      title: data.title || '',
      company: data.company || '',
      description: data.description || '',
      location: data.location || '',
      type: data.type || 'Full-time',
      requirements: data.requirements || [],
      benefits: data.benefits || [],
      source: {
        name: this.sourceName,
        url: this.sourceUrl,
        id: data.source?.id || this.sourceName.toLowerCase(),
      },
      applicationUrl: data.applicationUrl || '',
      postedDate: data.postedDate || new Date(),
      expiresAt: data.expiresAt,
      isActive: true,
    };

    return new Job(jobData) as IJob;
  }

  protected async fetchUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.text();
  }

  protected async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.json();
  }
} 