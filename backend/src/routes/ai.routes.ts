import express from 'express';
import { analyzeMatchController, coverLetterController, tailorResumeController } from '../controllers/ai.controller';

const router = express.Router();

router.post('/analyze', analyzeMatchController);         // Resume vs JD match score
router.post('/tailor', tailorResumeController);          // AI-tailored resume (premium)
router.post('/cover-letter', coverLetterController);     // AI cover letter (premium)

export default router;
