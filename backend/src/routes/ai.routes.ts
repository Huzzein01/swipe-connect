import express from 'express';
import { analyzeMatchController, tailorResumeController } from '../controllers/ai.controller';

const router = express.Router();

// POST /api/ai/analyze  — resume vs JD match score
router.post('/analyze', analyzeMatchController);

// POST /api/ai/tailor   — AI-tailored resume (premium)
router.post('/tailor', tailorResumeController);

export default router;
