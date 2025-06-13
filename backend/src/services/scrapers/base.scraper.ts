import axios from 'axios';
import { IJob } from '../../models/Job';

export abstract class BaseScraper {
  protected abstract source: string;
  protected abstract baseUrl: string;

  protected async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  protected abstract parseJobListings(html: string): Promise<Partial<IJob>[]>;
  protected abstract parseJobDetails(html: string): Promise<Partial<IJob>>;

  public async scrapeJobs(): Promise<Partial<IJob>[]> {
    try {
      const html = await this.fetchPage(this.baseUrl);
      const jobs = await this.parseJobListings(html);
      
      // Add source information to each job
      return jobs.map(job => ({
        ...job,
        source: {
          name: this.source,
          url: this.baseUrl,
          id: job.source?.id || '',
        },
      }));
    } catch (error) {
      console.error(`Error scraping ${this.source}:`, error);
      return [];
    }
  }
} 