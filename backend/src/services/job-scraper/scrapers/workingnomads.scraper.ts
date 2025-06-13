import { BaseScraper } from '../base.scraper';
import { IJob } from '../../../models/Job';
import * as cheerio from 'cheerio';

export class WorkingNomadsScraper extends BaseScraper {
  readonly sourceName = 'WorkingNomads';
  readonly sourceUrl = 'https://www.workingnomads.com';

  async scrape(): Promise<IJob[]> {
    try {
      const html = await this.fetchUrl(`${this.sourceUrl}/jobs`);
      const $ = cheerio.load(html);
      const jobs: IJob[] = [];

      $('.job-list .job').each((_, element) => {
        const $job = $(element);
        const title = $job.find('.title').text().trim();
        const company = $job.find('.company').text().trim();
        const location = $job.find('.location').text().trim();
        const description = $job.find('.description').text().trim();
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
      console.error('Error scraping WorkingNomads:', error);
      return [];
    }
  }
} 