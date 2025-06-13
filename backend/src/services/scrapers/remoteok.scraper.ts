import { BaseScraper } from './base.scraper';
import { IJob } from '../../models/Job';
import * as cheerio from 'cheerio';

export class RemoteOkScraper extends BaseScraper {
  protected source = 'Remote OK';
  protected baseUrl = 'https://remoteok.com/remote-jobs';

  protected async parseJobListings(html: string): Promise<Partial<IJob>[]> {
    const $ = cheerio.load(html);
    const jobs: Partial<IJob>[] = [];

    $('.job').each((_, element) => {
      const $job = $(element);
      const title = $job.find('.company_and_position h2').text().trim();
      const company = $job.find('.company_and_position h3').text().trim();
      const location = 'Remote';
      const description = $job.find('.description').text().trim();
      const applicationUrl = $job.find('.action-apply').attr('href') || '';
      const postedDate = new Date($job.find('.time').attr('datetime') || '');

      // Only include jobs from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (postedDate >= thirtyDaysAgo) {
        jobs.push({
          title,
          company,
          location,
          description,
          type: 'Remote',
          applicationUrl,
          postedDate,
          isActive: true,
          source: {
            name: this.source,
            url: this.baseUrl,
            id: $job.attr('data-id') || '',
          },
        });
      }
    });

    return jobs;
  }

  protected async parseJobDetails(html: string): Promise<Partial<IJob>> {
    const $ = cheerio.load(html);
    const job: Partial<IJob> = {};

    job.title = $('.company_and_position h2').text().trim();
    job.company = $('.company_and_position h3').text().trim();
    job.description = $('.description').text().trim();
    job.location = 'Remote';
    job.type = 'Remote';
    job.applicationUrl = $('.action-apply').attr('href') || '';
    job.postedDate = new Date($('.time').attr('datetime') || '');
    job.isActive = true;

    return job;
  }
} 