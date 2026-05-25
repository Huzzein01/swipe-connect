import mongoose from 'mongoose';
import Job from '../models/Job';
import User from '../models/User';
import { PublicJobFeedService, NormalizedJob } from './public-job-feed.service';

const publicJobFeedService = new PublicJobFeedService();

const isMongoConnected = () => mongoose.connection.readyState === 1;

const toClientJob = (job: any): NormalizedJob => ({
  id: String(job._id || job.id),
  title: job.title,
  company: job.company,
  location: job.location,
  description: job.description,
  requirements: job.requirements || [],
  salary: job.salary,
  type: job.type || 'full-time',
  industry: job.industry || job.source?.name || 'General',
  postedDate: job.postedDate instanceof Date ? job.postedDate.toISOString() : job.postedDate,
  remote: Boolean(job.remote ?? /remote/i.test(job.location || '')),
  benefits: job.benefits || [],
  companyLogo: job.companyLogo,
  source: job.source,
  applicationUrl: job.applicationUrl,
  matchScore: job.matchScore || 78,
  companyStage: job.companyStage || 'Hiring company',
  workStyle: job.workStyle || (/remote/i.test(job.location || '') ? 'Remote' : 'Hybrid or on-site'),
  whyMatch: job.whyMatch || ['Relevant role', 'Application link available', 'Fresh job source'],
});

export class JobService {
  public async scrapeAndSaveJobs(): Promise<void> {
    if (!isMongoConnected()) {
      console.log('MongoDB is not connected; skipping persistent job cache.');
      return;
    }

    const jobs = await publicJobFeedService.fetchJobs({ limit: 40 });
    for (const job of jobs) {
      await Job.findOneAndUpdate(
        { 'source.name': job.source.name, 'source.id': job.source.id },
        {
          title: job.title,
          company: job.company,
          description: job.description,
          location: job.location,
          type: job.type,
          salary: job.salary,
          requirements: job.requirements,
          benefits: job.benefits,
          source: job.source,
          applicationUrl: job.applicationUrl,
          postedDate: new Date(job.postedDate),
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }
  }

  public async getJobsForUser(userId?: string, page = 1, limit = 20, query?: string): Promise<NormalizedJob[]> {
    if (!isMongoConnected()) {
      return publicJobFeedService.fetchJobs({ query, limit });
    }

    const filter: any = { isActive: true };
    const user = userId ? await User.findById(userId) : null;

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }

    if (user?.preferences?.locations?.length) {
      filter.location = { $regex: user.preferences.locations.join('|'), $options: 'i' };
    }

    if (user?.swipedJobs?.length) {
      filter._id = { $nin: user.swipedJobs.map((swipe) => swipe.jobId) };
    }

    const jobs = await Job.find(filter)
      .sort({ postedDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (jobs.length > 0) {
      return jobs.map(toClientJob);
    }

    return publicJobFeedService.fetchJobs({ query, limit });
  }

  public async saveJobForUser(userId: string | undefined, jobId: string): Promise<void> {
    if (!userId || !isMongoConnected() || !mongoose.Types.ObjectId.isValid(jobId)) return;
    await User.findByIdAndUpdate(userId, { $addToSet: { savedJobs: jobId } });
  }

  public async recordSwipe(userId: string | undefined, jobId: string, action: 'like' | 'dislike'): Promise<void> {
    if (!userId || !isMongoConnected() || !mongoose.Types.ObjectId.isValid(jobId)) return;
    await User.findByIdAndUpdate(userId, {
      $push: {
        swipedJobs: {
          jobId,
          action,
          timestamp: new Date(),
        },
      },
    });
  }
}
