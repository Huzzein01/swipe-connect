import { BaseScraper } from '../base.scraper';
import { IJob } from '../../../models/Job';
import * as cheerio from 'cheerio';

export class JobspressoScraper extends BaseScraper {
  readonly sourceName = 'Jobspresso';
  readonly sourceUrl = 'https://jobspresso.co';

  async scrape(): Promise<IJob[]> {
    try {
      const html = await this.fetchUrl(`${this.sourceUrl}/remote-jobs/`);
      const $ = cheerio.load(html);
      const jobs: IJob[] = [];

      $('.job_listings li').each((_, element) => {
        const $job = $(element);
        const title = $job.find('.job_title').text().trim();
        const company = $job.find('.job_company').text().trim();
        const location = $job.find('.job_location').text().trim();
        const description = $job.find('.job_description').text().trim();
        const url = $job.find('a').attr('href') || '';
        const postedDate = new Date($job.find('.job_date').text().trim());

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
      console.error('Error scraping Jobspresso:', error);
      return [];
    }
  }
} 