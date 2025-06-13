import { IJob } from '../models/Job';
import Job from '../models/Job';
import User from '../models/User';
import { RemoteOkScraper } from './scrapers/remoteok.scraper';

export class JobService {
  private scrapers = [new RemoteOkScraper()];

  public async scrapeAndSaveJobs(): Promise<void> {
    try {
      for (const scraper of this.scrapers) {
        const jobs = await scraper.scrapeJobs();
        
        for (const job of jobs) {
          await Job.findOneAndUpdate(
            { 'source.name': job.source?.name, 'source.id': job.source?.id },
            job,
            { upsert: true, new: true }
          );
        }
      }
    } catch (error) {
      console.error('Error scraping and saving jobs:', error);
      throw error;
    }
  }

  public async getJobsForUser(userId: string, page = 1, limit = 10): Promise<IJob[]> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const query: any = { isActive: true };

      // Apply user preferences if they exist
      if (user.preferences.industries.length > 0) {
        query.title = { $regex: user.preferences.industries.join('|'), $options: 'i' };
      }

      if (user.preferences.locations.length > 0) {
        query.location = { $regex: user.preferences.locations.join('|'), $options: 'i' };
      }

      // Exclude already swiped jobs
      const swipedJobIds = user.swipedJobs.map((swipe: { jobId: string }) => swipe.jobId);
      query._id = { $nin: swipedJobIds };

      return await Job.find(query)
        .sort({ postedDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    } catch (error) {
      console.error('Error getting jobs for user:', error);
      throw error;
    }
  }

  public async saveJobForUser(userId: string, jobId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { savedJobs: jobId } }
      );
    } catch (error) {
      console.error('Error saving job for user:', error);
      throw error;
    }
  }

  public async recordSwipe(userId: string, jobId: string, action: 'like' | 'dislike'): Promise<void> {
    try {
      await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            swipedJobs: {
              jobId,
              action,
              timestamp: new Date(),
            },
          },
        }
      );
    } catch (error) {
      console.error('Error recording swipe:', error);
      throw error;
    }
  }
} 