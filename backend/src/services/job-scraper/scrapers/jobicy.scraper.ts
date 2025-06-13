import { BaseScraper } from '../base.scraper';
import { IJob } from '../../../models/Job';
import * as cheerio from 'cheerio';

export class JobicyScraper extends BaseScraper {
  readonly sourceName = 'Jobicy';
  readonly sourceUrl = 'https://jobicy.com';

  async scrape(): Promise<IJob[]> {
    try {
      const html = await this.fetchUrl(`${this.sourceUrl}/remote-jobs`);
      const $ = cheerio.load(html);
      const jobs: IJob[] = [];

      $('.job-card').each((_, element) => {
        const $job = $(element);
        const title = $job.find('.job-title').text().trim();
        const company = $job.find('.company-name').text().trim();
        const location = $job.find('.location').text().trim();
        const description = $job.find('.job-description').text().trim();
        const url = $job.find('a').attr('href') || '';
        const postedDate = new Date($job.find('.date').text().trim());

        jobs.push(this.createJob({
          title,
          company,
          description,
          location,
          type: 'Remote',
          requirements: [],
          source: {
            id: url.split('/').pop() || '',
            name: this.sourceName,
            url: `${this.sourceUrl}${url}`,
          },
          applicationUrl: `${this.sourceUrl}${url}`,
          postedDate,
        }));
      });

      return jobs;
    } catch (error) {
      console.error('Error scraping Jobicy:', error);
      return [];
    }
  }
} 