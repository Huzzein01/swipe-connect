import axios from 'axios';

export type NormalizedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  industry: string;
  postedDate: string;
  remote: boolean;
  benefits?: string[];
  companyLogo?: string;
  source: {
    name: string;
    url: string;
    id: string;
  };
  applicationUrl: string;
  matchScore: number;
  companyStage: string;
  workStyle: string;
  whyMatch: string[];
};

type FeedOptions = {
  query?: string;
  skills?: string[];
  limit?: number;
};

const DEFAULT_SKILLS = ['React Native', 'TypeScript', 'Product Strategy', 'Analytics'];
const REQUEST_TIMEOUT_MS = 8000;

const fallbackJobs: NormalizedJob[] = [
  {
    id: 'fallback-react-native-engineer',
    title: 'React Native Engineer',
    company: 'Northstar Labs',
    location: 'Remote - US',
    description: 'Build mobile workflows for a fast-growing marketplace team using React Native and TypeScript.',
    requirements: ['React Native', 'TypeScript', 'Mobile UX', 'API Integration'],
    type: 'full-time',
    industry: 'Technology',
    postedDate: new Date().toISOString(),
    remote: true,
    salary: { min: 130000, max: 170000, currency: 'USD' },
    benefits: ['Equity', 'Remote budget', 'Health coverage'],
    source: {
      name: 'SwipeConnect Demo Feed',
      url: 'https://swipeconnect.local/jobs/fallback-react-native-engineer',
      id: 'fallback-react-native-engineer',
    },
    applicationUrl: 'https://swipeconnect.local/apply/fallback-react-native-engineer',
    matchScore: 94,
    companyStage: 'Series B',
    workStyle: 'Remote-first',
    whyMatch: ['React Native appears in your resume', 'Remote role', 'Strong compensation fit'],
  },
  {
    id: 'fallback-product-manager',
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
    source: {
      name: 'SwipeConnect Demo Feed',
      url: 'https://swipeconnect.local/jobs/fallback-product-manager',
      id: 'fallback-product-manager',
    },
    applicationUrl: 'https://swipeconnect.local/apply/fallback-product-manager',
    matchScore: 86,
    companyStage: 'Series C',
    workStyle: 'Hybrid',
    whyMatch: ['Product leadership fit', 'Analytics-heavy role', 'Salary range matches preferences'],
  },
];

const stripHtml = (value = '') =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const compact = (items: Array<string | undefined | null>) =>
  Array.from(new Set(items.filter((item): item is string => Boolean(item && item.trim()))));

const inferType = (value = ''): NormalizedJob['type'] => {
  const lower = value.toLowerCase();
  if (lower.includes('intern')) return 'internship';
  if (lower.includes('part')) return 'part-time';
  if (lower.includes('contract') || lower.includes('freelance')) return 'contract';
  return 'full-time';
};

const inferRequirements = (text: string, seed: string[] = []) => {
  const skillBank = [
    'React Native',
    'React',
    'TypeScript',
    'JavaScript',
    'Node.js',
    'Python',
    'SQL',
    'GraphQL',
    'AWS',
    'Docker',
    'Kubernetes',
    'Product Strategy',
    'Analytics',
    'Figma',
    'User Research',
    'Accessibility',
  ];
  const lower = text.toLowerCase();
  return compact([...seed, ...skillBank.filter((skill) => lower.includes(skill.toLowerCase()))]).slice(0, 6);
};

const scoreJob = (jobText: string, skills = DEFAULT_SKILLS) => {
  const lower = jobText.toLowerCase();
  const matched = skills.filter((skill) => lower.includes(skill.toLowerCase()));
  return Math.min(96, 68 + matched.length * 7 + (lower.includes('remote') ? 7 : 0));
};

const whyMatch = (job: Pick<NormalizedJob, 'requirements' | 'remote' | 'salary'>, skills = DEFAULT_SKILLS) => {
  const matched = job.requirements.filter((skill) =>
    skills.some((resumeSkill) => resumeSkill.toLowerCase() === skill.toLowerCase())
  );
  return compact([
    matched[0] ? `${matched[0]} appears in your resume` : 'Relevant skills detected',
    job.remote ? 'Remote-friendly role' : 'Location-based opportunity',
    job.salary ? 'Compensation is visible' : 'Application link available',
  ]).slice(0, 3);
};

const normalizeHimalayasJob = (job: any, skills?: string[]): NormalizedJob => {
  const description = stripHtml(job.description || job.excerpt || '');
  const requirements = inferRequirements(`${job.title} ${description}`, job.categories || []);
  const normalized: NormalizedJob = {
    id: `himalayas-${job.guid || job.id || job.companySlug}-${job.title}`,
    title: job.title,
    company: job.companyName || 'Unknown Company',
    location: compact([...(job.locationRestrictions || []), ...(job.timezoneRestrictions || []).map((tz: number) => `UTC${tz >= 0 ? '+' : ''}${tz}`)]).join(', ') || 'Remote',
    description,
    requirements,
    type: inferType(job.employmentType),
    industry: job.parentCategories?.[0] || job.categories?.[0] || 'Remote',
    postedDate: job.pubDate || job.date || new Date().toISOString(),
    remote: true,
    companyLogo: job.companyLogo,
    salary:
      job.minSalary && job.maxSalary
        ? { min: Number(job.minSalary), max: Number(job.maxSalary), currency: job.currency || 'USD' }
        : undefined,
    source: {
      name: 'Himalayas',
      url: job.applicationLink || job.url || 'https://himalayas.app/jobs',
      id: String(job.guid || job.id || job.title),
    },
    applicationUrl: job.applicationLink || job.url || 'https://himalayas.app/jobs',
    matchScore: 0,
    companyStage: 'Remote company',
    workStyle: 'Remote',
    whyMatch: [],
  };
  normalized.matchScore = scoreJob(`${normalized.title} ${normalized.description}`, skills);
  normalized.whyMatch = whyMatch(normalized, skills);
  return normalized;
};

const normalizeRemotiveJob = (job: any, skills?: string[]): NormalizedJob => {
  const description = stripHtml(job.description || '');
  const requirements = inferRequirements(`${job.title} ${description}`, job.tags || []);
  const normalized: NormalizedJob = {
    id: `remotive-${job.id}`,
    title: job.title,
    company: job.company_name || 'Unknown Company',
    location: job.candidate_required_location || 'Remote',
    description,
    requirements,
    type: inferType(job.job_type),
    industry: job.category || 'Remote',
    postedDate: job.publication_date || new Date().toISOString(),
    remote: true,
    companyLogo: job.company_logo,
    salary: undefined,
    benefits: ['Remote'],
    source: {
      name: 'Remotive',
      url: job.url,
      id: String(job.id),
    },
    applicationUrl: job.url,
    matchScore: 0,
    companyStage: 'Remote company',
    workStyle: 'Remote',
    whyMatch: [],
  };
  normalized.matchScore = scoreJob(`${normalized.title} ${normalized.description}`, skills);
  normalized.whyMatch = whyMatch(normalized, skills);
  return normalized;
};

const normalizeArbeitnowJob = (job: any, skills?: string[]): NormalizedJob => {
  const description = stripHtml(job.description || '');
  const requirements = inferRequirements(`${job.title} ${description}`, job.tags || []);
  const normalized: NormalizedJob = {
    id: `arbeitnow-${job.slug}`,
    title: job.title,
    company: job.company_name || 'Unknown Company',
    location: job.location || 'Not specified',
    description,
    requirements,
    type: inferType(job.job_types?.[0] || ''),
    industry: job.tags?.[0] || 'General',
    postedDate: job.created_at ? new Date(job.created_at * 1000).toISOString() : new Date().toISOString(),
    remote: Boolean(job.remote),
    salary: undefined,
    benefits: job.remote ? ['Remote option'] : undefined,
    source: {
      name: 'Arbeitnow',
      url: job.url,
      id: String(job.slug),
    },
    applicationUrl: job.url,
    matchScore: 0,
    companyStage: 'Hiring company',
    workStyle: job.remote ? 'Remote' : 'On-site or hybrid',
    whyMatch: [],
  };
  normalized.matchScore = scoreJob(`${normalized.title} ${normalized.description}`, skills);
  normalized.whyMatch = whyMatch(normalized, skills);
  return normalized;
};

export class PublicJobFeedService {
  async fetchJobs(options: FeedOptions = {}): Promise<NormalizedJob[]> {
    const query = options.query || 'react native product manager data analyst';
    const limit = options.limit || 24;

    const [himalayas, remotive, arbeitnow] = await Promise.allSettled([
      this.fetchHimalayas(query, options.skills),
      this.fetchRemotive(query, options.skills),
      this.fetchArbeitnow(options.skills),
    ]);

    const jobs = [
      ...(himalayas.status === 'fulfilled' ? himalayas.value : []),
      ...(remotive.status === 'fulfilled' ? remotive.value : []),
      ...(arbeitnow.status === 'fulfilled' ? arbeitnow.value : []),
    ];

    const deduped = new Map<string, NormalizedJob>();
    for (const job of jobs) {
      const key = `${job.company.toLowerCase()}-${job.title.toLowerCase()}`;
      if (!deduped.has(key)) deduped.set(key, job);
    }

    const normalizedJobs = Array.from(deduped.values())
      .filter((job) => job.title && job.company && job.applicationUrl)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return normalizedJobs.length > 0 ? normalizedJobs : fallbackJobs;
  }

  private async fetchHimalayas(query: string, skills?: string[]) {
    const response = await axios.get('https://himalayas.app/jobs/api/search', {
      timeout: REQUEST_TIMEOUT_MS,
      params: { query, sort: 'recent', page: 1 },
    });
    return (response.data?.jobs || []).map((job: any) => normalizeHimalayasJob(job, skills));
  }

  private async fetchRemotive(query: string, skills?: string[]) {
    const response = await axios.get('https://remotive.com/api/remote-jobs', {
      timeout: REQUEST_TIMEOUT_MS,
      params: { search: query, limit: 20 },
    });
    return (response.data?.jobs || []).map((job: any) => normalizeRemotiveJob(job, skills));
  }

  private async fetchArbeitnow(skills?: string[]) {
    const response = await axios.get('https://arbeitnow.com/api/job-board-api', {
      timeout: REQUEST_TIMEOUT_MS,
    });
    return (response.data?.data || []).slice(0, 20).map((job: any) => normalizeArbeitnowJob(job, skills));
  }
}
