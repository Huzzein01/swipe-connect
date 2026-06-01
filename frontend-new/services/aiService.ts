import { Platform } from 'react-native';
import { Job, Resume } from '../types/job';
import axios from 'axios';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://127.0.0.1:3001/api');

export interface FileAsset {
  uri: string;
  name: string;
  type: string;
}

export type MatchAnalysis = {
  score: number;
  grade: string;
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

const resumeToText = (resume: Resume | null): string => {
  if (!resume?.parsedData) return '';
  const d = resume.parsedData;
  const lines: string[] = [];
  if (d.name) lines.push(`Name: ${d.name}`);
  if (d.email) lines.push(`Email: ${d.email}`);
  if (d.skills?.length) lines.push(`Skills: ${d.skills.join(', ')}`);
  if (d.experience?.length) {
    d.experience.forEach((e) => {
      lines.push(`${e.title} at ${e.company} (${e.startDate}–${e.endDate}): ${e.description}`);
    });
  }
  if (d.education?.length) {
    d.education.forEach((e) => {
      lines.push(`${e.degree} in ${e.field} — ${e.institution} (${e.graduationDate})`);
    });
  }
  return lines.join('\n');
};

export const analyzeJobMatch = async (job: Job, resume: Resume | null): Promise<MatchAnalysis> => {
  try {
    const resumeText = resumeToText(resume);
    const response = await axios.post(`${API_BASE_URL}/ai/analyze`, {
      resumeText,
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description,
      requirements: job.requirements,
    });
    return response.data as MatchAnalysis;
  } catch {
    // Local keyword fallback when backend unavailable
    const resumeText = resumeToText(resume).toLowerCase();
    const matched = (job.requirements || []).filter((r) => resumeText.includes(r.toLowerCase()));
    const total = job.requirements?.length || 1;
    const score = Math.max(Math.round((matched.length / total) * 100), job.matchScore || 70);
    return {
      score,
      grade: score >= 85 ? 'A' : score >= 70 ? 'B+' : score >= 55 ? 'B' : 'C',
      strengths: matched.slice(0, 3).map((s) => `${s} matches this role`),
      gaps: (job.requirements || []).filter((r) => !resumeText.includes(r.toLowerCase())).slice(0, 3),
      summary: 'Match score estimated from resume keywords.',
      recommendation: score >= 70 ? 'apply' : 'consider',
    };
  }
};

export const tailorResumeForJob = async (job: Job, resume: Resume): Promise<TailoredResume> => {
  const resumeText = resumeToText(resume);
  const response = await axios.post(`${API_BASE_URL}/ai/tailor`, {
    resumeText,
    jobTitle: job.title,
    company: job.company,
    jobDescription: job.description,
    requirements: job.requirements,
  });
  return response.data as TailoredResume;
};

// ─── Legacy methods (preserved) ───────────────────────────────────────────────
export const aiService = {
  parseResume: async (file: FileAsset): Promise<Resume> => {
    const formData = new FormData();
    formData.append('resume', { uri: file.uri, name: file.name, type: file.type } as any);
    const response = await axios.post(`${API_BASE_URL}/ai/parse-resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  applyToJob: async (jobId: string, resume: Resume) => {
    const response = await axios.post(`${API_BASE_URL}/ai/apply-job`, { jobId, resume });
    return response.data;
  },
  getJobRecommendations: async (resume: Resume, preferences: any): Promise<Job[]> => {
    const response = await axios.post(`${API_BASE_URL}/ai/recommend-jobs`, { resume, preferences });
    return response.data;
  },
  getJobMatchScore: async (job: Job, resume: Resume): Promise<number> => {
    const response = await axios.post(`${API_BASE_URL}/ai/job-match-score`, { job, resume });
    return response.data.score;
  },
};
