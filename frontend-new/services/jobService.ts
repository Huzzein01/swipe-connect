import { Platform } from 'react-native';
import { ApplicationRecord, Job, Resume, UserPreferences } from '../types/job';
import { buildSimulatedJobDeck } from './simulatedJobs';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://127.0.0.1:3001/api');

type ApplicantPayload = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

const fallbackJobs: Job[] = [
  {
    id: 'local-react-native-engineer',
    title: 'React Native Engineer',
    company: 'Northstar Labs',
    location: 'Remote - US',
    description: 'Build mobile onboarding and job discovery workflows for a fast-growing marketplace product.',
    requirements: ['React Native', 'TypeScript', 'Mobile UX', 'API Integration'],
    type: 'full-time',
    industry: 'Technology',
    postedDate: new Date().toISOString(),
    remote: true,
    salary: { min: 130000, max: 170000, currency: 'USD' },
    benefits: ['Equity', 'Remote budget', 'Health coverage'],
    applicationUrl: 'https://example.com/apply/react-native-engineer',
    source: { name: 'Local Fallback', url: 'https://example.com/jobs', id: 'local-react-native-engineer' },
    matchScore: 94,
    companyStage: 'Series B',
    workStyle: 'Remote-first',
    whyMatch: ['React Native appears in your resume', 'Remote role', 'Strong compensation fit'],
  },
  {
    id: 'local-product-manager',
    title: 'Senior Product Manager',
    company: 'Atlas Ops',
    location: 'Austin, TX',
    description: 'Lead workflow automation products from discovery through launch and measurement.',
    requirements: ['Product Strategy', 'Analytics', 'Roadmapping', 'B2B SaaS'],
    type: 'full-time',
    industry: 'SaaS',
    postedDate: new Date().toISOString(),
    remote: false,
    salary: { min: 150000, max: 190000, currency: 'USD' },
    benefits: ['Equity', 'Bonus plan', 'Learning stipend'],
    applicationUrl: 'https://example.com/apply/product-manager',
    source: { name: 'Local Fallback', url: 'https://example.com/jobs', id: 'local-product-manager' },
    matchScore: 86,
    companyStage: 'Series C',
    workStyle: 'Hybrid',
    whyMatch: ['Product leadership fit', 'Analytics-heavy role', 'Salary range matches preferences'],
  },
];

const requestJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json();
};

const queryFromPreferences = (preferences?: UserPreferences) => {
  const terms = [
    ...(preferences?.industries || []),
    ...(preferences?.jobTypes || []),
    preferences?.remote ? 'remote' : '',
    preferences?.experienceLevel || '',
  ].filter(Boolean);

  return terms.length > 0 ? terms.join(' ') : 'react native product manager data analyst';
};

export const jobService = {
  apiBaseUrl: API_BASE_URL,

  getJobs: async (preferences?: UserPreferences): Promise<Job[]> => {
    try {
      const query = encodeURIComponent(queryFromPreferences(preferences));
      const data = await requestJson<{ jobs: Job[] }>(`/jobs?q=${query}&limit=48`);
      return buildSimulatedJobDeck(data.jobs.length > 0 ? data.jobs : fallbackJobs, preferences, 1000);
    } catch (error) {
      console.warn('Using local job fallback because the backend job feed is unavailable.', error);
      return buildSimulatedJobDeck(fallbackJobs, preferences, 1000);
    }
  },

  saveJob: async (jobId: string) => {
    try {
      await requestJson(`/jobs/${encodeURIComponent(jobId)}/save`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.warn('Unable to persist saved job to backend.', error);
    }
  },

  recordSwipe: async (jobId: string, action: 'like' | 'dislike') => {
    try {
      await requestJson(`/jobs/${encodeURIComponent(jobId)}/swipe`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
    } catch (error) {
      console.warn('Unable to persist swipe to backend.', error);
    }
  },

  applyToJob: async (job: Job, applicant: ApplicantPayload, resume?: Resume | null): Promise<ApplicationRecord> => {
    const data = await requestJson<{ application: ApplicationRecord }>('/jobs/apply', {
      method: 'POST',
      body: JSON.stringify({
        job,
        applicant,
        resume,
      }),
    });

    return data.application;
  },
};
