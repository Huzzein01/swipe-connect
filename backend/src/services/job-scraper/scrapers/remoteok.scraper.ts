import { BaseScraper } from '../base.scraper';
import { IJob } from '../../../models/Job';

interface RemoteOKJob {
  id: string;
  position: string;
  company: string;
  description: string;
  location: string;
  tags: string[];
  url: string;
  date: string;
}

export class RemoteOKScraper extends BaseScraper {
  readonly sourceName = 'RemoteOK';
  readonly sourceUrl = 'https://remoteok.com';

  async scrape(): Promise<IJob[]> {
    try {
      const response = await this.fetchJson<RemoteOKJob[]>(`${this.sourceUrl}/api/v1/jobs`);
      
      return response.map(job => this.createJob({
        title: job.position,
        company: job.company,
        description: job.description,
        location: job.location,
        type: 'Remote',
        requirements: job.tags,
        source: {
          id: job.id,
          name: this.sourceName,
          url: `${this.sourceUrl}/remote-jobs/${job.id}`,
        },
        applicationUrl: job.url,
        postedDate: new Date(job.date),
      }));
    } catch (error) {
      console.error('Error scraping RemoteOK:', error);
      return [];
    }
  }
} 