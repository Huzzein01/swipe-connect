import { Job, UserPreferences } from '../types/job';

const roleTemplates = [
  { title: 'Frontend Engineer', industry: 'Technology', skills: ['React', 'TypeScript', 'Accessibility', 'Design Systems'] },
  { title: 'Product Manager', industry: 'SaaS', skills: ['Roadmapping', 'Analytics', 'User Research', 'B2B SaaS'] },
  { title: 'Data Analyst', industry: 'Fintech', skills: ['SQL', 'Looker', 'Experimentation', 'Python'] },
  { title: 'Customer Success Manager', industry: 'AI', skills: ['Onboarding', 'SaaS', 'Stakeholder Management', 'Expansion'] },
  { title: 'Product Designer', industry: 'Health Tech', skills: ['Figma', 'Mobile UX', 'Design Systems', 'Research'] },
  { title: 'Backend Engineer', industry: 'Technology', skills: ['Node.js', 'MongoDB', 'APIs', 'Cloud'] },
  { title: 'Growth Marketer', industry: 'Ecommerce', skills: ['Lifecycle', 'Paid Social', 'A/B Testing', 'CRM'] },
  { title: 'Operations Lead', industry: 'Logistics', skills: ['Process Design', 'Dashboards', 'Vendor Ops', 'Automation'] },
];

const companies = [
  'Northstar Labs',
  'Brightline Health',
  'Atlas Ops',
  'Luma Commerce',
  'Cinder AI',
  'Harbor Transit',
  'SignalWorks',
  'NovaPay',
  'Meridian Cloud',
  'FieldStack',
];

const cities = [
  { city: 'Chicago', state: 'IL' },
  { city: 'Austin', state: 'TX' },
  { city: 'New York', state: 'NY' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'San Francisco', state: 'CA' },
];

const jobTypes: Job['type'][] = ['full-time', 'part-time', 'contract', 'internship'];

const experienceLabels: Record<UserPreferences['experienceLevel'], string[]> = {
  entry: ['Associate', 'Junior', 'Coordinator'],
  mid: ['', 'Mid-Level', 'Product-minded'],
  senior: ['Senior', 'Lead', 'Staff'],
  executive: ['Director of', 'Head of', 'VP of'],
};

const sentence = (value: string) => value.replace(/\s+/g, ' ').trim();

export const summarizeDescription = (description: string, maxLength = 220) => {
  const clean = sentence(description.replace(/<[^>]+>/g, ' '));
  if (clean.length <= maxLength) return clean;
  const slice = clean.slice(0, maxLength);
  return `${slice.slice(0, Math.max(slice.lastIndexOf('.'), slice.lastIndexOf(' '))).trim()}...`;
};

export const detailSectionsForJob = (job: Job) => {
  const description = sentence(job.description);
  const chunks = description
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return {
    overview: summarizeDescription(description, 320),
    responsibilities: chunks.slice(1, 4).length > 0
      ? chunks.slice(1, 4)
      : [
          `Own ${job.title.toLowerCase()} work across discovery, delivery, and measurement.`,
          'Partner with product, design, and cross-functional stakeholders.',
          'Ship high-quality work with clear communication and strong follow-through.',
        ],
    requirements: job.requirements.slice(0, 6),
    benefits: job.benefits?.slice(0, 5) || ['Competitive compensation', 'Collaborative team', 'Growth opportunities'],
  };
};

const matchesPreferences = (job: Job, preferences?: UserPreferences) => {
  if (!preferences) return true;
  if (preferences.remote && !job.remote) return false;
  if (preferences.jobTypes.length > 0 && !preferences.jobTypes.includes(job.type)) return false;
  if (preferences.industries.length > 0) {
    const haystack = `${job.industry} ${job.title} ${job.company} ${job.requirements.join(' ')}`.toLowerCase();
    const hasIndustryMatch = preferences.industries.some((industry) =>
      haystack.includes(industry.toLowerCase().replace(' tech', ''))
    );
    if (!hasIndustryMatch && preferences.industries.length < 4) return false;
  }
  return true;
};

const experienceTitle = (baseTitle: string, level: UserPreferences['experienceLevel'], index: number) => {
  const prefixes = experienceLabels[level];
  const prefix = prefixes[index % prefixes.length];
  if (!prefix) return baseTitle;
  if (prefix.endsWith('of')) return `${prefix} ${baseTitle.replace(/^Product |^Frontend |^Backend /, '')}`;
  return `${prefix} ${baseTitle}`;
};

export const buildSimulatedJobDeck = (
  sourceJobs: Job[],
  preferences?: UserPreferences,
  desiredCount = 1000
): Job[] => {
  const preferredTypes = preferences?.jobTypes.length ? preferences.jobTypes : jobTypes;
  const preferredIndustries = preferences?.industries.length ? preferences.industries : [];
  const generated: Job[] = [];

  for (let index = 0; index < desiredCount; index += 1) {
    const template = roleTemplates[index % roleTemplates.length];
    const company = companies[index % companies.length];
    const city = cities[index % cities.length];
    const remote = preferences?.remote ? true : index % 3 === 0;
    const type = preferredTypes[index % preferredTypes.length] || 'full-time';
    const industry = preferredIndustries[index % Math.max(preferredIndustries.length, 1)] || template.industry;
    const title = experienceTitle(template.title, preferences?.experienceLevel || 'mid', index);
    const salaryMin = 70000 + ((index * 7000) % 90000);
    const salaryMax = salaryMin + 25000 + ((index * 3000) % 35000);

    generated.push({
      id: `sim-${index + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title,
      company,
      location: remote ? 'Remote - US' : `${city.city}, ${city.state}`,
      description: `${company} is hiring a ${title} to help build practical, measurable products in ${industry}. This role focuses on clear ownership, fast collaboration, and thoughtful execution. You will work with a lean team, turn ambiguous goals into weekly milestones, and contribute to customer-facing improvements that can be explained clearly to stakeholders.`,
      requirements: template.skills,
      type,
      industry,
      postedDate: new Date(Date.now() - index * 3600000).toISOString(),
      remote,
      salary: { min: salaryMin, max: salaryMax, currency: 'USD' },
      benefits: ['Flexible schedule', 'Learning stipend', 'Health coverage'],
      applicationUrl: `https://example.com/apply/simulated-${index + 1}`,
      source: { name: 'SwipeConnect Simulated', url: 'https://swipeconnect.com/jobs', id: `sim-${index + 1}` },
      matchScore: Math.max(62, 97 - (index % 31)),
      companyStage: ['Seed', 'Series A', 'Series B', 'Growth'][index % 4],
      workStyle: remote ? 'Remote-first' : 'Hybrid',
      whyMatch: [
        `${industry} interest match`,
        `${type.replace('-', ' ')} preference`,
        remote ? 'Remote preference' : 'Location-compatible role',
      ],
    });
  }

  const normalizedSource = sourceJobs.map((job) => ({
    ...job,
    description: summarizeDescription(job.description, 900),
    matchScore: job.matchScore || 82,
    workStyle: job.workStyle || (job.remote ? 'Remote-first' : 'Hybrid or on-site'),
    whyMatch: job.whyMatch || ['Relevant role', 'Application link available', 'Fresh job source'],
  }));

  const filteredSource = normalizedSource.filter((job) => matchesPreferences(job, preferences));
  const filteredGenerated = generated.filter((job) => matchesPreferences(job, preferences));
  const merged = [...filteredSource, ...filteredGenerated];
  const seen = new Set<string>();

  return merged.filter((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  }).slice(0, desiredCount);
};
