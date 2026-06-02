import express from 'express';
import { analyzeMatchController, coverLetterController, parseResumeController, parseResumeFileController, tailorResumeController } from '../controllers/ai.controller';

const router = express.Router();

router.post('/analyze', analyzeMatchController);             // Resume vs JD match score
router.post('/tailor', tailorResumeController);              // AI-tailored resume (premium)
router.post('/cover-letter', coverLetterController);         // AI cover letter (premium)
router.post('/parse-resume', parseResumeController);         // AI resume parsing from text
router.post('/parse-resume-file', parseResumeFileController);// AI resume parsing from uploaded file (PDF/text)

export default router;
