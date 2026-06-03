import axios from 'axios';

/**
 * Multi-provider LLM layer.
 * Tries providers in priority order based on which API keys are present:
 *   1. Google Gemini   (GEMINI_API_KEY)    — free tier, generous limits
 *   2. DeepSeek        (DEEPSEEK_API_KEY)  — free/cheap, OpenAI-compatible
 *   3. Anthropic Claude(ANTHROPIC_API_KEY) — fallback
 * Throws only if every configured provider fails (or none configured).
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Gemini free tier intermittently returns 503 / "high demand". Retry a few times.
const isTransient = (err: any): boolean => {
  const status = err?.response?.status;
  const msg = String(err?.response?.data?.error?.message || err?.message || '').toLowerCase();
  return status === 503 || status === 429 || msg.includes('high demand') || msg.includes('overloaded');
};

const callGemini = async (prompt: string, maxTokens: number): Promise<string> => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('no-gemini');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      // Headroom above maxTokens because thinking models can spend tokens
      // before emitting text; thinkingBudget:0 disables thinking on 2.5.
      maxOutputTokens: maxTokens + 512,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  let lastErr: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await axios.post(url, body, {
        headers: { 'content-type': 'application/json' },
        timeout: 30000,
      });
      const text = res.data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
      if (!text) throw new Error('gemini-empty');
      return text;
    } catch (err: any) {
      lastErr = err;
      if (isTransient(err) && attempt < 2) {
        await sleep(700 * (attempt + 1)); // 0.7s, 1.4s backoff
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
};

const callDeepSeek = async (prompt: string, maxTokens: number): Promise<string> => {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('no-deepseek');
  const res = await axios.post(
    'https://api.deepseek.com/chat/completions',
    {
      model: DEEPSEEK_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    },
    { headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' }, timeout: 25000 }
  );
  const text = res.data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('deepseek-empty');
  return text;
};

const callAnthropic = async (prompt: string, maxTokens: number): Promise<string> => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('no-anthropic');
  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    { model: ANTHROPIC_MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] },
    {
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      timeout: 25000,
    }
  );
  const text = res.data?.content?.[0]?.text || '';
  if (!text) throw new Error('anthropic-empty');
  return text;
};

/** Returns true if at least one provider key is configured. */
export const hasAnyProvider = (): boolean =>
  Boolean(process.env.GEMINI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY);

/** Try each configured provider in priority order; return first success. */
const callLLM = async (prompt: string, maxTokens = 1024): Promise<string> => {
  const providers: Array<{ name: string; fn: () => Promise<string> }> = [
    { name: 'gemini', fn: () => callGemini(prompt, maxTokens) },
    { name: 'deepseek', fn: () => callDeepSeek(prompt, maxTokens) },
    { name: 'anthropic', fn: () => callAnthropic(prompt, maxTokens) },
  ];

  let lastErr: any;
  for (const p of providers) {
    try {
      return await p.fn();
    } catch (err: any) {
      // "no-*" means key absent — skip quietly. Other errors: log and try next.
      if (!String(err?.message).startsWith('no-')) {
        console.warn(`[ai] ${p.name} failed:`, err?.response?.data?.error?.message || err?.message);
      }
      lastErr = err;
    }
  }
  throw new Error(lastErr?.message || 'No AI provider configured');
};

// Back-compat shim — existing callers used callClaude(model, prompt, tokens)
const callClaude = (_model: string, prompt: string, maxTokens = 1024): Promise<string> =>
  callLLM(prompt, maxTokens);

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

const TONE_GUIDE: Record<string, string> = {
  professional: 'polished, confident, business-formal. Measured and precise.',
  enthusiastic: 'warm and energetic while staying professional. Show genuine excitement.',
  concise: 'tight and direct. Short sentences, no filler, every line earns its place.',
  storytelling: 'open with a brief, specific anecdote that illustrates a relevant strength, then connect it to the role.',
};

/** AI cover letter generation — follows a clean professional template */
export const generateCoverLetter = async (
  jobTitle: string,
  company: string,
  jobDescription: string,
  tone: string,
  candidateName: string,
  candidateTitle: string,
  candidateSkills: string[],
  candidateBio: string,
  candidateExperience: string,
  contact?: { email?: string; phone?: string; location?: string; linkedin?: string }
): Promise<CoverLetterResult> => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const toneKey = (tone || 'professional').toLowerCase();
  const toneNote = TONE_GUIDE[toneKey] || TONE_GUIDE.professional;

  const contactBlock = [
    candidateName,
    contact?.email,
    contact?.phone,
    contact?.location,
    contact?.linkedin,
  ].filter(Boolean).join(' | ');

  const prompt = `Write a complete, ready-to-send cover letter. Return ONLY the letter text — no markdown, no commentary, no placeholders like [Your Name].

=== CANDIDATE ===
Name: ${candidateName}
Current title: ${candidateTitle || 'Professional'}
Experience: ${candidateExperience || 'several years'}
Top skills: ${candidateSkills.slice(0, 8).join(', ') || 'relevant skills'}
Background: ${candidateBio || 'experienced professional'}
Contact line to use as the header: ${contactBlock}

=== ROLE ===
Position: ${jobTitle}
Company: ${company}
${jobDescription ? `Job description (tailor the letter to THIS — reference its specific responsibilities, requirements, and language):\n${jobDescription.slice(0, 1600)}` : ''}

=== FORMAT (follow exactly) ===
Line 1: ${contactBlock}
Line 2: (blank)
Line 3: ${today}
Line 4: (blank)
Line 5: Dear Hiring Manager,
Then 4 substantial paragraphs:
  1. A specific hook naming the ${jobTitle} role at ${company} and what draws the candidate to it (no "I am writing to apply").
  2. Map the candidate's concrete experience/skills to 2–3 specific requirements or responsibilities pulled FROM THE JOB DESCRIPTION above.
  3. Why this company/team specifically — reference something concrete about the role.
  4. Forward-looking close + a clear call to action for an interview.
Then: Sincerely,
Then: ${candidateName}

=== STYLE & LENGTH (strict) ===
Tone: ${toneNote}
- LENGTH: the letter body MUST be at least 250 words (aim 280–380). Add specific, relevant detail from the job description and the candidate's background — never pad with clichés.
- No clichés ("passionate", "team player", "hit the ground running").
- Specific, human, and tailored to ${company} and the job description. Never invent fake metrics or employers.`;

  const generate = async () => (await callLLM(prompt, 1400)).trim();

  let clean = await generate();
  let wordCount = clean.split(/\s+/).filter(Boolean).length;

  // Enforce the 250-word minimum: if short, ask the model to expand once.
  if (wordCount < 250) {
    try {
      const expandPrompt = `The cover letter below is only ${wordCount} words. Rewrite it to be at least 250 words (aim 300) by adding specific, relevant detail tying the candidate's experience to the job description — no clichés, no invented facts. Keep the same header, date, greeting, and sign-off. Return ONLY the letter.\n\n${clean}`;
      const expanded = (await callLLM(expandPrompt, 1400)).trim();
      if (expanded.split(/\s+/).filter(Boolean).length > wordCount) {
        clean = expanded;
        wordCount = clean.split(/\s+/).filter(Boolean).length;
      }
    } catch { /* keep first draft */ }
  }

  return { letter: clean, wordCount };
};

export type ATSResult = {
  score: number;                 // 0–100 overall ATS-readiness
  rating: string;                // Excellent / Strong / Fair / Needs work
  breakdown: Array<{ category: string; score: number; max: number; note: string }>;
  strengths: string[];
  improvements: string[];        // concrete, actionable suggestions
  missingKeywords: string[];     // keywords/skills to consider adding
  summary: string;
};

/** ATS resume scanner — scores a resume for applicant-tracking-system readiness */
export const scanResumeATS = async (resumeText: string, targetRole?: string): Promise<ATSResult> => {
  const prompt = `You are an ATS (Applicant Tracking System) expert and professional resume reviewer. Analyze the resume below for ATS-readiness and overall quality. ${targetRole ? `The candidate is targeting "${targetRole}" roles — judge keyword alignment against that.` : ''} Return ONLY raw JSON (no markdown).

Score these 5 categories (each out of the max shown), then an overall 0–100 score:
- "Formatting & Parseability" (max 20): clean structure, standard section headings, no tables/columns/graphics that break ATS parsing.
- "Keyword Optimization" (max 25): presence of role-relevant skills, tools, and terminology.
- "Impact & Achievements" (max 20): quantified results and strong action verbs vs. vague duties.
- "Clarity & Structure" (max 20): logical sections (summary, experience, skills, education), readable, consistent.
- "Contact & Completeness" (max 15): name, email, phone, location/links, complete history.

RESUME:
${resumeText.slice(0, 4500)}

Return exactly this JSON shape:
{
  "score": <integer 0-100>,
  "rating": "<Excellent|Strong|Fair|Needs work>",
  "breakdown": [{ "category": "", "score": <int>, "max": <int>, "note": "<one-line note>" }],
  "strengths": ["<up to 4 concrete strengths>"],
  "improvements": ["<up to 6 specific, actionable fixes — be concrete, e.g. 'Quantify the X achievement with a metric'>"],
  "missingKeywords": ["<up to 8 skills/keywords worth adding if relevant>"],
  "summary": "<2 sentence overall assessment>"
}`;

  const raw = await callLLM(prompt, 1800);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON for ATS scan');
  const r = JSON.parse(jsonMatch[0]) as ATSResult;
  return {
    score: Math.max(0, Math.min(100, Number(r.score) || 0)),
    rating: String(r.rating || ''),
    breakdown: Array.isArray(r.breakdown) ? r.breakdown : [],
    strengths: Array.isArray(r.strengths) ? r.strengths.map(String) : [],
    improvements: Array.isArray(r.improvements) ? r.improvements.map(String) : [],
    missingKeywords: Array.isArray(r.missingKeywords) ? r.missingKeywords.map(String) : [],
    summary: String(r.summary || ''),
  };
};

export type ParsedResumeAI = {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  skills: string[];
  experienceSummary: string;
  experience: Array<{ title: string; company: string; startDate: string; endDate: string; description: string }>;
  education: Array<{ degree: string; field: string; institution: string; graduationDate: string }>;
};

/** AI resume parsing — extracts name, skills (from skills + experience), and a summary */
export const parseResumeWithAI = async (resumeText: string): Promise<ParsedResumeAI> => {
  const prompt = `You are a resume parser. Extract structured data from the resume text below and return ONLY raw JSON (no markdown, no commentary).

Rules:
- name: the candidate's full name (from the top of the resume).
- skills: a DEDUPLICATED union of (a) skills explicitly listed in any Skills section AND (b) skills, tools, technologies, languages, frameworks, and methodologies clearly implied by the Experience descriptions. Aim for 8–15 concrete skills. Title-case them.
- experienceSummary: a sharp 2–3 sentence professional summary of the candidate's overall experience and strengths, written in third person.
- title: the candidate's most recent/current job title.
- Use "" for any string you cannot find. Never invent employers, schools, or dates.

RESUME TEXT:
${resumeText.slice(0, 4500)}

Return exactly this JSON shape:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "title": "",
  "skills": [],
  "experienceSummary": "",
  "experience": [{ "title": "", "company": "", "startDate": "", "endDate": "", "description": "" }],
  "education": [{ "degree": "", "field": "", "institution": "", "graduationDate": "" }]
}`;

  const raw = await callLLM(prompt, 1500);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON for resume');
  const parsed = JSON.parse(jsonMatch[0]) as ParsedResumeAI;
  // Defensive normalization so the frontend never receives non-arrays/objects
  return {
    name: String(parsed.name || ''),
    email: String(parsed.email || ''),
    phone: String(parsed.phone || ''),
    location: String(parsed.location || ''),
    title: String(parsed.title || ''),
    skills: Array.isArray(parsed.skills) ? parsed.skills.map(String).filter(Boolean) : [],
    experienceSummary: String(parsed.experienceSummary || ''),
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
  };
};

// ─── Fallback scoring (no API key, or Claude unavailable) ─────────────────────
const fallbackMatchScore = (resumeText: string, requirements: string[]): MatchAnalysis => {
  // No resume → neutral score in the 65–78 range. We cannot grade against nothing;
  // return an "unscored" result that nudges toward apply/consider without misleading.
  if (!resumeText || resumeText.trim().length < 20) {
    const neutralScore = 68;
    return {
      score: neutralScore,
      grade: 'B',
      strengths: ['Upload your resume for a personalised AI score', 'Role has an active application link'],
      gaps: ['Resume not yet uploaded — score is estimated'],
      summary: 'Add your resume to unlock a real AI match score for this role.',
      recommendation: 'consider',
    };
  }

  const lower = resumeText.toLowerCase();
  const matched = requirements.filter((r) => lower.includes(r.toLowerCase()));
  const total = requirements.length || 1;
  // Floor at 45 so a partially matching resume never shows an implausible 0–10%
  const rawScore = Math.round((matched.length / total) * 100);
  const score = Math.max(rawScore, 45);
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B+' : score >= 58 ? 'B' : score >= 45 ? 'C' : 'D';
  const gaps = requirements.filter((r) => !lower.includes(r.toLowerCase())).slice(0, 3);
  return {
    score,
    grade,
    strengths: matched.length > 0
      ? matched.slice(0, 3).map((s) => `${s} found in resume`)
      : ['Relevant professional background detected'],
    gaps: gaps.map((g) => `${g} not detected in resume`),
    summary: matched.length > 0
      ? `Resume matches ${matched.length} of ${requirements.length} listed requirements.`
      : 'Limited keyword overlap — consider tailoring your resume for this role.',
    recommendation: score >= 70 ? 'apply' : score >= 50 ? 'consider' : 'skip',
  };
};
