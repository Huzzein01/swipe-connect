import axios from 'axios';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const callClaude = async (model: string, prompt: string, maxTokens = 1024): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await axios.post(
    ANTHROPIC_API_URL,
    {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      timeout: 20000,
    }
  );

  return response.data?.content?.[0]?.text || '';
};

export type MatchAnalysis = {
  score: number;            // 0–100
  grade: string;            // A / B+ / B / C / D
  strengths: string[];
  gaps: string[];
  summary: string;
  recommendation: 'apply' | 'consider' | 'skip';
};

export type TailoredResume = {
  tailoredText: string;
  changes: Array<{ section: string; original: string; improved: string }>;
  newScore: number;
  summary: string;
};

/** Fast match analysis using Haiku */
export const analyzeMatch = async (
  resumeText: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  requirements: string[]
): Promise<MatchAnalysis> => {
  const prompt = `You are a professional recruiter and ATS expert. Analyze this resume against the job posting and return a JSON object only — no markdown, no explanation, just raw JSON.

JOB: ${jobTitle} at ${company}
REQUIREMENTS: ${requirements.join(', ')}
JOB DESCRIPTION:
${jobDescription.slice(0, 1200)}

RESUME:
${resumeText.slice(0, 1500)}

Return this exact JSON shape:
{
  "score": <integer 0-100>,
  "grade": "<A|B+|B|C|D>",
  "strengths": ["<up to 3 short strings>"],
  "gaps": ["<up to 3 short strings>"],
  "summary": "<2 sentence plain English summary>",
  "recommendation": "<apply|consider|skip>"
}`;

  try {
    const raw = await callClaude('claude-haiku-4-5', prompt, 512);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]) as MatchAnalysis;
  } catch (err) {
    // Fallback: simple keyword scoring
    return fallbackMatchScore(resumeText, requirements);
  }
};

/** Quality resume tailoring using Sonnet */
export const tailorResume = async (
  resumeText: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  requirements: string[]
): Promise<TailoredResume> => {
  const prompt = `You are an expert resume writer and career coach. Tailor this resume to match the job posting as closely as possible — target 90%+ alignment. Preserve the candidate's real experience but reframe, reorder, and strengthen language to match the job's keywords, skills, and tone.

JOB: ${jobTitle} at ${company}
KEY REQUIREMENTS: ${requirements.join(', ')}
JOB DESCRIPTION:
${jobDescription.slice(0, 1200)}

RESUME:
${resumeText.slice(0, 2000)}

Return this exact JSON shape (no markdown, raw JSON only):
{
  "tailoredText": "<full tailored resume as plain text>",
  "changes": [
    { "section": "<section name>", "original": "<original text snippet>", "improved": "<improved text snippet>" }
  ],
  "newScore": <integer 85-98>,
  "summary": "<2 sentences describing the key changes made>"
}`;

  const raw = await callClaude('claude-sonnet-4-5', prompt, 2048);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');
  return JSON.parse(jsonMatch[0]) as TailoredResume;
};

export type CoverLetterResult = {
  letter: string;
  wordCount: number;
};

/** AI cover letter generation using Sonnet */
export const generateCoverLetter = async (
  jobTitle: string,
  company: string,
  jobDescription: string,
  tone: string,
  candidateName: string,
  candidateTitle: string,
  candidateSkills: string[],
  candidateBio: string,
  candidateExperience: string
): Promise<CoverLetterResult> => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `Write a professional cover letter for a job application. Return only the cover letter text — no JSON, no markdown, no explanation.

Position: ${jobTitle} at ${company}
Tone: ${tone}
Date: ${today}
Candidate name: ${candidateName}
Candidate title: ${candidateTitle}
Candidate skills: ${candidateSkills.join(', ')}
Candidate bio: ${candidateBio}
Years of experience: ${candidateExperience}
${jobDescription ? `Job description:\n${jobDescription.slice(0, 800)}` : ''}

Guidelines:
- Start with the date, then "Dear Hiring Manager,"
- 3–4 paragraphs: hook, relevant experience, why this company, closing
- Tone: ${tone.toLowerCase()}
- Do NOT use clichés like "I am writing to apply" or "passionate"
- End with "Sincerely,\\n${candidateName}"
- Keep under 400 words`;

  const text = await callClaude('claude-sonnet-4-5', prompt, 1024);
  const words = text.trim().split(/\s+/).length;
  return { letter: text.trim(), wordCount: words };
};

// ─── Fallback scoring (no API key) ────────────────────────────────────────────
const fallbackMatchScore = (resumeText: string, requirements: string[]): MatchAnalysis => {
  const lower = resumeText.toLowerCase();
  const matched = requirements.filter((r) => lower.includes(r.toLowerCase()));
  const score = requirements.length > 0 ? Math.round((matched.length / requirements.length) * 100) : 70;
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B+' : score >= 55 ? 'B' : score >= 40 ? 'C' : 'D';
  const gaps = requirements.filter((r) => !lower.includes(r.toLowerCase())).slice(0, 3);
  return {
    score,
    grade,
    strengths: matched.slice(0, 3).map((s) => `${s} listed in resume`),
    gaps: gaps.map((g) => `${g} not found in resume`),
    summary: `Your resume matches ${matched.length} of ${requirements.length} listed requirements.`,
    recommendation: score >= 70 ? 'apply' : score >= 50 ? 'consider' : 'skip',
  };
};
