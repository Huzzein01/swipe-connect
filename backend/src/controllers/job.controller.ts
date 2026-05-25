import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';
import { ApplicationService } from '../services/application.service';

const jobService = new JobService();
const applicationService = new ApplicationService();
const getUserId = (req: Request) => (req.user as any)?._id?.toString?.() || (req.user as any)?.id;

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const query = req.query.q as string | undefined;
    const jobs = await jobService.getJobsForUser(getUserId(req), page, limit, query);
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
};

export const saveJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    await jobService.saveJobForUser(getUserId(req), jobId);
    res.json({ message: 'Job saved successfully' });
  } catch (error) {
    next(error);
  }
};

export const swipeJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const { action } = req.body;

    if (!['like', 'dislike'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await jobService.recordSwipe(getUserId(req), jobId, action as 'like' | 'dislike');
    res.json({ message: 'Swipe recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const applyToJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { job, applicant, resume } = req.body;

    if (!job?.id || !job?.title || !job?.company || !job?.applicationUrl) {
      return res.status(400).json({ message: 'A complete job payload is required.' });
    }

    const application = await applicationService.queueApplication({
      job,
      applicant: applicant || {},
      resume,
    });

    res.status(201).json({ application });
  } catch (error) {
    next(error);
  }
};

export const listApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.query.email as string | undefined;
    const applications = await applicationService.listApplications(email);
    res.json({ applications });
  } catch (error) {
    next(error);
  }
};

export const scrapeJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await jobService.scrapeAndSaveJobs();
    res.json({ message: 'Jobs refreshed successfully' });
  } catch (error) {
    next(error);
  }
};
