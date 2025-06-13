import express from 'express';
import { getJobs, saveJob, swipeJob, scrapeJobs } from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Protected routes
router.get('/', authenticate, getJobs);
router.post('/:jobId/save', authenticate, saveJob);
router.post('/:jobId/swipe', authenticate, swipeJob);

// Admin route for scraping jobs
router.post('/scrape', authenticate, scrapeJobs);

export default router; 