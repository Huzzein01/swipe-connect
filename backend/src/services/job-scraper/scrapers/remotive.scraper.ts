import { BaseScraper } from '../base.scraper';
import { IJob } from '../../../models/Job';

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  description: string;
  candidate_required_location: string;
  job_type: string;
  publication_date: string;
  url: string;
  tags: string[];
}

export class RemotiveScraper extends BaseScraper {
  readonly sourceName = 'Remotive';
  readonly sourceUrl = 'https://remotive.io';

  async scrape(): Promise<IJob[]> {
    try {
      const response = await this.fetchJson<{ jobs: RemotiveJob[] }>(
        'https://remotive.io/api/remote-jobs'
      );

      return response.jobs.map(job => this.createJob({
        title: job.title,
        company: job.company_name,
        description: job.description,
        location: job.candidate_required_location,
        type: job.job_type,
        requirements: job.tags,
        source: {
          name: this.sourceName,
          url: this.sourceUrl,
          id: `remotive-${job.id}`,
        },
        applicationUrl: job.url,
        postedDate: new Date(job.publication_date),
      }));
    } catch (error) {
      console.error('Error scraping Remotive:', error);
      throw error;
    }
  }
} 