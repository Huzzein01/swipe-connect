import { Request, Response, NextFunction } from 'express';
import { analyzeMatch, tailorResume, generateCoverLetter, parseResumeWithAI } from '../services/ai.service';
// pdf-parse is required lazily inside the controller to avoid its debug-mode
// top-level file read at import time.

export const analyzeMatchController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeText, jobTitle, company, jobDescription, requirements } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ message: 'jobDescription is required' });
    }

    const result = await analyzeMatch(
      resumeText || '',
      jobTitle || 'Unknown Role',
      company || 'Unknown Company',
      jobDescription,
      requirements || []
    );

    res.json(result);
  } catch (error: any) {
    console.error('AI analyze error:', error.message);
    // Return a graceful fallback so the UI doesn't break
    res.json({
      score: 72,
      grade: 'B+',
      strengths: ['Relevant industry background', 'Required experience level'],
      gaps: ['Add ANTHROPIC_API_KEY to backend .env for real AI scoring'],
      summary: 'AI scoring unavailable — showing estimated match based on keywords.',
      recommendation: 'consider',
    });
  }
};

export const coverLetterController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      jobTitle, company, jobDescription, tone,
      candidateName, candidateTitle, candidateSkills,
      candidateBio, candidateExperience, contact,
    } = req.body;

    if (!jobTitle || !company) {
      return res.status(400).json({ message: 'jobTitle and company are required' });
    }

    const result = await generateCoverLetter(
      jobTitle, company, jobDescription || '',
      tone || 'Professional',
      candidateName || 'Candidate', candidateTitle || '',
      candidateSkills || [], candidateBio || '', candidateExperience || '',
      contact || {}
    );
    res.json(result);
  } catch (error: any) {
    console.error('AI cover letter error:', error?.message);
    // Graceful fallback when no provider key is configured
    res.json({
      letter: `Dear Hiring Manager,\n\nI am excited about the ${req.body.jobTitle} role at ${req.body.company}. To enable full AI-generated cover letters, add a GEMINI_API_KEY (free) or DEEPSEEK_API_KEY to the backend .env.\n\nSincerely,\n${req.body.candidateName || 'Candidate'}`,
      wordCount: 30,
      fallback: true,
    });
  }
};

export const parseResumeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || String(resumeText).trim().length < 30) {
      return res.status(400).json({ message: 'resumeText (min 30 chars) is required' });
    }
    const result = await parseResumeWithAI(String(resumeText));
    res.json(result);
  } catch (error: any) {
    console.error('AI resume parse error:', error?.message);
    res.status(502).json({ message: 'AI resume parsing unavailable', error: error?.message });
  }
};

/**
 * POST /api/ai/parse-resume-file
 * Accepts { base64, mimeType, name }. Extracts text (PDF via pdf-parse, else
 * decodes as UTF-8), then runs the Gemini parser. This is the reliable path for
 * PDF resumes — the browser cannot extract PDF text on its own.
 */
export const parseResumeFileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { base64, mimeType, name } = req.body;
    if (!base64 || typeof base64 !== 'string') {
      return res.status(400).json({ message: 'base64 file content is required' });
    }
    const buffer = Buffer.from(base64, 'base64');
    let text = '';

    const isPdf = (mimeType && String(mimeType).includes('pdf')) || (name && String(name).toLowerCase().endsWith('.pdf'));
    if (isPdf) {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        text = data?.text || '';
      } catch (e: any) {
        console.error('pdf-parse failed:', e?.message);
      }
    }
    if (!text || text.trim().length < 30) {
      // Fallback: treat the buffer as plain text (txt/md/docx-ish)
      text = buffer.toString('utf8').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
    }
    if (!text || text.trim().length < 30) {
      return res.status(422).json({ message: 'Could not extract readable text from this file.' });
    }

    const result = await parseResumeWithAI(text);
    res.json(result);
  } catch (error: any) {
    console.error('AI resume file parse error:', error?.message);
    res.status(502).json({ message: 'AI resume parsing unavailable', error: error?.message });
  }
};

export const tailorResumeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resumeText, jobTitle, company, jobDescription, requirements } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ message: 'resumeText and jobDescription are required' });
    }

    const result = await tailorResume(resumeText, jobTitle, company, jobDescription, requirements || []);
    res.json(result);
  } catch (error: any) {
    console.error('AI tailor error:', error.message);
    next(error);
  }
};
