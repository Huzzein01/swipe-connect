import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';

const jobService = new JobService();

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const jobs = await jobService.getJobsForUser(req.user!.id, page, limit);
    res.json(jobs);
  } catch (error) {
    next(error);
  }
};

export const saveJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    await jobService.saveJobForUser(req.user!.id, jobId);
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

    await jobService.recordSwipe(req.user!.id, jobId, action as 'like' | 'dislike');
    res.json({ message: 'Swipe recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const scrapeJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await jobService.scrapeAndSaveJobs();
    res.json({ message: 'Jobs scraped successfully' });
  } catch (error) {
    next(error);
  }
}; 