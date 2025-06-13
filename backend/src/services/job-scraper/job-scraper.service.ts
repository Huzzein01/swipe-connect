import axios from 'axios';
import { IJob } from '../../models/Job';
import Job from '../../models/Job';
import { RemotiveScraper } from './scrapers/remotive.scraper';
import { RemoteOKScraper } from './scrapers/remoteok.scraper';
import { WeWorkRemotelyScraper } from './scrapers/weworkremotely.scraper';
import { JobspressoScraper } from './scrapers/jobspresso.scraper';
import { WorkingNomadsScraper } from './scrapers/workingnomads.scraper';
import { JobicyScraper } from './scrapers/jobicy.scraper';
import { WellfoundScraper } from './scrapers/wellfound.scraper';

export class JobScraperService {
  private scrapers: any[] = [];
  private readonly SCRAPE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  private readonly MAX_DAYS_OLD = 30;

  constructor() {
    // Initialize all scrapers
    this.scrapers = [
      new RemotiveScraper(),
      new RemoteOKScraper(),
      new WeWorkRemotelyScraper(),
      new JobspressoScraper(),
      new WorkingNomadsScraper(),
      new JobicyScraper(),
      new WellfoundScraper(),
    ];
  }

  async startScraping() {
    console.log('Starting job scraping service...');
    
    // Initial scrape
    await this.scrapeAllSources();

    // Set up interval for regular scraping
    setInterval(async () => {
      await this.scrapeAllSources();
    }, this.SCRAPE_INTERVAL);
  }

  private async scrapeAllSources() {
    const allJobs: IJob[] = [];
    const errors: { source: string; error: any }[] = [];

    for (const scraper of this.scrapers) {
      try {
        console.log(`Scraping jobs from ${scraper.sourceName}...`);
        const jobs = await scraper.scrape();
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`Error scraping ${scraper.sourceName}:`, error);
        errors.push({ source: scraper.sourceName, error });
      }
    }

    // Filter out old jobs and deduplicate
    const recentJobs = this.filterRecentJobs(allJobs);
    const uniqueJobs = this.deduplicateJobs(recentJobs);

    // Save to database
    await this.saveJobs(uniqueJobs);

    // Log results
    console.log(`Scraped ${allJobs.length} jobs, ${uniqueJobs.length} unique and recent`);
    if (errors.length > 0) {
      console.error('Errors during scraping:', errors);
    }
  }

  private filterRecentJobs(jobs: IJob[]): IJob[] {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.MAX_DAYS_OLD);

    return jobs.filter(job => {
      const postedDate = new Date(job.postedDate);
      return postedDate >= thirtyDaysAgo;
    });
  }

  private deduplicateJobs(jobs: IJob[]): IJob[] {
    const uniqueJobs = new Map<string, IJob>();

    for (const job of jobs) {
      const key = this.generateJobKey(job);
      if (!uniqueJobs.has(key)) {
        uniqueJobs.set(key, job);
      }
    }

    return Array.from(uniqueJobs.values());
  }

  private generateJobKey(job: IJob): string {
    // Create a unique key based on job title, company, and source
    return `${job.title.toLowerCase()}-${job.company.toLowerCase()}-${job.source.id}`;
  }

  private async saveJobs(jobs: IJob[]) {
    try {
      // Use bulkWrite for efficient insertion
      const operations = jobs.map(job => ({
        updateOne: {
          filter: {
            'source.id': job.source.id,
            'source.name': job.source.name,
          },
          update: { $set: job },
          upsert: true,
        },
      }));

      await Job.bulkWrite(operations);
      console.log(`Successfully saved ${jobs.length} jobs to database`);
    } catch (error) {
      console.error('Error saving jobs to database:', error);
      throw error;
    }
  }
} 