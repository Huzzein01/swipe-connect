import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job, Resume, UserPreferences } from '../types/job';

export type DemoJob = Job & {
  matchScore: number;
  companyStage: string;
  workStyle: string;
  whyMatch: string[];
};

type DemoState = {
  preferences: UserPreferences;
  resume: Resume | null;
  reviewedJobIds: string[];
  appliedJobIds: string[];
  savedJobIds: string[];
  skippedJobIds: string[];
};

type DemoContextType = DemoState & {
  jobs: DemoJob[];
  remainingJobs: DemoJob[];
  highFitJobs: DemoJob[];
  appliedJobs: DemoJob[];
  savedJobs: DemoJob[];
  stats: {
    matches: number;
    reviewed: number;
    applied: number;
    saved: number;
    remaining: number;
  };
  recordSwipe: (jobId: string, action: 'apply' | 'skip') => Promise<void>;
  saveJob: (jobId: string) => Promise<void>;
  savePreferences: (preferences: UserPreferences) => Promise<void>;
  saveResume: (resume: Resume) => Promise<void>;
  createSampleResume: (userId: string) => Resume;
  resetDeck: () => Promise<void>;
  resetDemo: () => Promise<void>;
};

const STORAGE_KEY = 'swipeconnect.demoState';

export const DEMO_JOBS: DemoJob[] = [
  {
    id: 'northstar-product-designer',
    title: 'Product Designer',
    company: 'Northstar Labs',
    location: 'Remote - US',
    description:
      'Shape mobile onboarding, marketplace discovery, and retention loops for a fast-growing fintech product team.',
    requirements: ['Figma', 'Mobile UX', 'Design Systems', 'User Research'],
    type: 'full-time',
    industry: 'Fintech',
    postedDate: new Date().toISOString(),
    remote: true,
    salary: { min: 135000, max: 165000, currency: 'USD' },
    benefits: ['Equity', 'Home office budget', 'Quarterly team retreats'],
    matchScore: 94,
    companyStage: 'Series B',
    workStyle: 'Async-friendly',
    whyMatch: ['Mobile product experience', 'Fintech interest', 'Remote preference'],
  },
  {
    id: 'brightline-frontend-engineer',
    title: 'Frontend Engineer',
    company: 'Brightline Health',
    location: 'Chicago, IL',
    description:
      'Build React Native patient workflows, polish clinical dashboards, and partner closely with product and design.',
    requirements: ['React Native', 'TypeScript', 'GraphQL', 'Accessibility'],
    type: 'full-time',
    industry: 'Health Tech',
    postedDate: new Date().toISOString(),
    remote: true,
    salary: { min: 145000, max: 178000, currency: 'USD' },
    benefits: ['Medical coverage', 'Learning stipend', 'Flexible PTO'],
    matchScore: 89,
    companyStage: 'Growth',
    workStyle: 'Hybrid optional',
    whyMatch: ['React Native stack', 'Chicago friendly', 'Senior IC track'],
  },
  {
    id: 'atlas-ops-product-manager',
    title: 'Senior Product Manager',
    company: 'Atlas Ops',
    location: 'Austin, TX',
    description:
      'Lead workflow automation for internal operations teams, from roadmap discovery through launch instrumentation.',
    requirements: ['Product Strategy', 'B2B SaaS', 'Analytics', 'Roadmapping'],
    type: 'full-time',
    industry: 'SaaS',
    postedDate: new Date().toISOString(),
    remote: false,
    salary: { min: 155000, max: 190000, currency: 'USD' },
    benefits: ['Bonus plan', 'Equity refreshers', 'Mentorship program'],
    matchScore: 83,
    companyStage: 'Series C',
    workStyle: 'Office-led',
    whyMatch: ['Product leadership', 'Workflow tools', 'Strong salary fit'],
  },
  {
    id: 'luma-data-analyst',
    title: 'Data Analyst',
    company: 'Luma Commerce',
    location: 'New York, NY',
    description:
      'Turn product, acquisition, and lifecycle data into decisions for a commerce platform with millions of shoppers.',
    requirements: ['SQL', 'Looker', 'Experimentation', 'Python'],
    type: 'full-time',
    industry: 'Ecommerce',
    postedDate: new Date().toISOString(),
    remote: true,
    salary: { min: 98000, max: 125000, currency: 'USD' },
    benefits: ['Wellness stipend', 'Equity', 'Remote Fridays'],
    matchScore: 81,
    companyStage: 'Series A',
    workStyle: 'Flexible hybrid',
    whyMatch: ['Analytics skill match', 'Remote-friendly', 'Growth-stage company'],
  },
  {
    id: 'cinder-customer-success',
    title: 'Customer Success Manager',
    company: 'Cinder AI',
    location: 'Remote - North America',
    description:
      'Own onboarding, expansion, and adoption for customers using AI tools to modernize support operations.',
    requirements: ['SaaS', 'Onboarding', 'Stakeholder Management', 'AI Tools'],
    type: 'full-time',
    industry: 'AI',
    postedDate: new Date().toISOString(),
    remote: true,
    salary: { min: 105000, max: 135000, currency: 'USD' },
    benefits: ['Commission', 'Learning stipend', 'Home office setup'],
    matchScore: 78,
    companyStage: 'Seed',
    workStyle: 'Remote-first',
    whyMatch: ['Client-facing experience', 'AI interest', 'Remote preference'],
  },
  {
    id: 'harbor-mobile-engineer',
    title: 'Mobile Engineer',
    company: 'Harbor Transit',
    location: 'Seattle, WA',
    description:
      'Build commuter-facing mobile experiences for real-time trip planning, payments, and service disruption alerts.',
    requirements: ['React Native', 'Maps', 'Payments', 'Performance'],
    type: 'contract',
    industry: 'Transportation',
    postedDate: new Date().toISOString(),
    remote: false,
    salary: { min: 120000, max: 155000, currency: 'USD' },
    benefits: ['Contract extension option', 'Transit credit', 'Equipment stipend'],
    matchScore: 74,
    companyStage: 'Public-private',
    workStyle: 'On-site collaboration',
    whyMatch: ['Mobile stack', 'User-facing product', 'Strong compensation'],
  },
];

const defaultPreferences: UserPreferences = {
  industries: ['Technology', 'Fintech', 'Health Tech'],
  jobTypes: ['full-time'],
  location: { city: 'Chicago', state: 'IL', radius: 50 },
  salaryRange: { min: 110000, max: 180000 },
  remote: true,
  experienceLevel: 'mid',
};

const defaultState: DemoState = {
  preferences: defaultPreferences,
  resume: null,
  reviewedJobIds: [],
  appliedJobIds: [],
  savedJobIds: [],
  skippedJobIds: [],
};

const DemoContext = createContext<DemoContextType>({} as DemoContextType);

export const useDemo = () => useContext(DemoContext);

const unique = (items: string[]) => Array.from(new Set(items));

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DemoState>(defaultState);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setState({ ...defaultState, ...JSON.parse(stored) });
        }
      } catch (error) {
        console.error('Error loading demo state:', error);
      }
    };

    loadState();
  }, []);

  const persist = async (nextState: DemoState) => {
    setState(nextState);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const jobsById = useMemo(
    () => new Map(DEMO_JOBS.map((job) => [job.id, job])),
    []
  );

  const remainingJobs = DEMO_JOBS.filter((job) => !state.reviewedJobIds.includes(job.id));
  const highFitJobs = DEMO_JOBS.filter((job) => !state.skippedJobIds.includes(job.id))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
  const appliedJobs = state.appliedJobIds
    .map((id) => jobsById.get(id))
    .filter((job): job is DemoJob => Boolean(job));
  const savedJobs = state.savedJobIds
    .map((id) => jobsById.get(id))
    .filter((job): job is DemoJob => Boolean(job));

  const recordSwipe = async (jobId: string, action: 'apply' | 'skip') => {
    const nextState: DemoState = {
      ...state,
      reviewedJobIds: unique([...state.reviewedJobIds, jobId]),
      appliedJobIds: action === 'apply' ? unique([...state.appliedJobIds, jobId]) : state.appliedJobIds,
      skippedJobIds: action === 'skip' ? unique([...state.skippedJobIds, jobId]) : state.skippedJobIds,
    };
    await persist(nextState);
  };

  const saveJob = async (jobId: string) => {
    const nextState: DemoState = {
      ...state,
      reviewedJobIds: unique([...state.reviewedJobIds, jobId]),
      savedJobIds: unique([...state.savedJobIds, jobId]),
    };
    await persist(nextState);
  };

  const savePreferences = async (preferences: UserPreferences) => {
    await persist({ ...state, preferences });
  };

  const saveResume = async (resume: Resume) => {
    await persist({ ...state, resume });
  };

  const createSampleResume = (userId: string): Resume => ({
    id: 'sample-resume',
    userId,
    fileUrl: 'sample-resume.pdf',
    parsedData: {
      name: 'Preview User',
      email: 'preview@swipeconnect.app',
      phone: '(312) 555-0147',
      location: { city: state.preferences.location.city || 'Chicago', state: state.preferences.location.state || 'IL' },
      education: [
        {
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          institution: 'University of Illinois',
          graduationDate: '2020-05',
        },
      ],
      experience: [
        {
          title: 'Product-minded Frontend Engineer',
          company: 'LaunchWorks',
          location: 'Chicago, IL',
          startDate: '2021-02',
          endDate: 'Present',
          description: 'Built React Native experiences, improved activation funnels, and partnered with design on mobile workflows.',
        },
      ],
      skills: ['React Native', 'TypeScript', 'Product Strategy', 'Analytics', 'User Research'],
      certifications: ['Google UX Design Certificate'],
    },
    lastUpdated: new Date().toISOString(),
  });

  const resetDeck = async () => {
    await persist({
      ...state,
      reviewedJobIds: [],
      appliedJobIds: [],
      savedJobIds: [],
      skippedJobIds: [],
    });
  };

  const resetDemo = async () => {
    await persist(defaultState);
  };

  const value: DemoContextType = {
    ...state,
    jobs: DEMO_JOBS,
    remainingJobs,
    highFitJobs,
    appliedJobs,
    savedJobs,
    stats: {
      matches: DEMO_JOBS.length - state.skippedJobIds.length,
      reviewed: state.reviewedJobIds.length,
      applied: state.appliedJobIds.length,
      saved: state.savedJobIds.length,
      remaining: remainingJobs.length,
    },
    recordSwipe,
    saveJob,
    savePreferences,
    saveResume,
    createSampleResume,
    resetDeck,
    resetDemo,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};
