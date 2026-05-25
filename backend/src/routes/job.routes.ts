import express from 'express';
import {
  applyToJob,
  getJobs,
  listApplications,
  saveJob,
  scrapeJobs,
  swipeJob,
} from '../controllers/job.controller';

const router = express.Router();

router.get('/', getJobs);
router.post('/apply', applyToJob);
router.get('/applications', listApplications);
router.post('/scrape', scrapeJobs);
router.post('/:jobId/save', saveJob);
router.post('/:jobId/swipe', swipeJob);

export default router;
