/**
 * ATS Scanner Service — inspired by career-ops scan.mjs
 *
 * Pure HTTP, zero LLM tokens. Hits Greenhouse, Ashby, Lever,
 * BambooHR, Teamtailor, and Workday APIs directly and normalizes
 * results into the standard NormalizedJob shape.
 */

import axios, { AxiosRequestConfig } from 'axios';
import { Portal, portalsByAts } from '../config/portals';
import { NormalizedJob } from './public-job-feed.service';

const TIMEOUT = 8000;
const MAX_PER_COMPANY = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const stripHtml = (s = '') =>
  s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const inferType = (s = ''): NormalizedJob['type'] => {
  const l = s.toLowerCase();
  if (l.includes('intern')) return 'internship';
  if (l.includes('part')) return 'part-time';
  if (l.includes('contract') || l.includes('freelance')) return 'contract';
  return 'full-time';
};

const inferRequirements = (text: string): string[] => {
  const bank = [
    'React', 'React Native', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Rust',
    'SQL', 'GraphQL', 'REST', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
    'Product Management', 'Product Strategy', 'Analytics', 'Figma', 'User Research',
    'Machine Learning', 'LLM', 'AI', 'Data Science', 'Accessibility', 'Mobile',
  ];
  const lower = text.toLowerCase();
  return [...new Set(bank.filter((s) => lower.includes(s.toLowerCase())))].slice(0, 6);
};

const scoreJob = (text: string): number => {
  const techTerms = ['typescript', 'react', 'node', 'python', 'mobile', 'llm', 'ai', 'product', 'data', 'remote'];
  const lower = text.toLowerCase();
  const hits = techTerms.filter((t) => lower.includes(t)).length;
  return Math.min(96, 62 + hits * 4 + (lower.includes('remote') ? 6 : 0));
};

const buildJob = (
  partial: Partial<NormalizedJob> & Pick<NormalizedJob, 'id' | 'title' | 'company' | 'applicationUrl'>,
  portal: Portal
): NormalizedJob => {
  const text = `${partial.title} ${partial.description || ''} ${(partial.requirements || []).join(' ')}`;
  return {
    location: 'Remote or on-site',
    description: '',
    requirements: [],
    type: 'full-time',
    industry: portal.industry,
    postedDate: new Date().toISOString(),
    remote: /remote/i.test(partial.location || partial.title || ''),
    benefits: [],
    source: { name: portal.company, url: partial.applicationUrl, id: partial.id },
    matchScore: scoreJob(text),
    companyStage: portal.stage || 'Hiring',
    workStyle: /remote/i.test(partial.location || '') ? 'Remote' : 'Hybrid or on-site',
    whyMatch: ['Application link available', portal.industry + ' company', portal.stage || 'Hiring'],
    ...partial,
  } as NormalizedJob;
};

const get = (url: string, config?: AxiosRequestConfig) =>
  axios.get(url, { timeout: TIMEOUT, ...config });

const post = (url: string, data: any, config?: AxiosRequestConfig) =>
  axios.post(url, data, { timeout: TIMEOUT, headers: { 'Content-Type': 'application/json' }, ...config });

// ─── Greenhouse ───────────────────────────────────────────────────────────────

const fetchGreenhouse = async (portal: Portal): Promise<NormalizedJob[]> => {
  const url = `https://boards-api.greenhouse.io/v1/boards/${portal.slug}/jobs`;
  const res = await get(url, { params: { content: 'true' } });
  const jobs: any[] = res.data?.jobs || [];
  return jobs.slice(0, MAX_PER_COMPANY).map((j) => {
    const description = stripHtml(j.content || j.metadata?.[0]?.value || '');
    return buildJob({
      id: `greenhouse-${portal.slug}-${j.id}`,
      title: j.title,
      company: portal.company,
      location: j.location?.name || 'Not specified',
      description,
      requirements: inferRequirements(`${j.title} ${description}`),
      type: inferType(j.title),
      applicationUrl: j.absolute_url,
    }, portal);
  });
};

// ─── Ashby ────────────────────────────────────────────────────────────────────

const ASHBY_QUERY = `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
  jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
    jobPostings {
      id
      title
      locationName
      employmentType
      descriptionHtml
      externalLink
    }
  }
}`;

const fetchAshby = async (portal: Portal): Promise<NormalizedJob[]> => {
  const res = await post(
    'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams',
    {
      operationName: 'ApiJobBoardWithTeams',
      variables: { organizationHostedJobsPageName: portal.slug },
      query: ASHBY_QUERY,
    }
  );
  const postings: any[] = res.data?.data?.jobBoard?.jobPostings || [];
  return postings.slice(0, MAX_PER_COMPANY).map((j) => {
    const description = stripHtml(j.descriptionHtml || '');
    const appUrl = j.externalLink || `https://jobs.ashbyhq.com/${portal.slug}/${j.id}`;
    return buildJob({
      id: `ashby-${portal.slug}-${j.id}`,
      title: j.title,
      company: portal.company,
      location: j.locationName || 'Remote',
      description,
      requirements: inferRequirements(`${j.title} ${description}`),
      type: inferType(j.employmentType || ''),
      applicationUrl: appUrl,
    }, portal);
  });
};

// ─── Lever ────────────────────────────────────────────────────────────────────

const fetchLever = async (portal: Portal): Promise<NormalizedJob[]> => {
  const res = await get(`https://api.lever.co/v0/postings/${portal.slug}?mode=json`);
  const postings: any[] = Array.isArray(res.data) ? res.data : [];
  return postings.slice(0, MAX_PER_COMPANY).map((j) => {
    const description = stripHtml(j.descriptionPlain || j.description || '');
    return buildJob({
      id: `lever-${portal.slug}-${j.id}`,
      title: j.text,
      company: portal.company,
      location: j.categories?.location || j.location || 'Not specified',
      description,
      requirements: inferRequirements(`${j.text} ${description} ${(j.tags || []).join(' ')}`),
      type: inferType(j.categories?.commitment || ''),
      applicationUrl: j.hostedUrl,
    }, portal);
  });
};

// ─── BambooHR ─────────────────────────────────────────────────────────────────

const fetchBambooHR = async (portal: Portal): Promise<NormalizedJob[]> => {
  const res = await get(`https://${portal.slug}.bamboohr.com/careers/list`);
  const jobs: any[] = res.data?.result || [];
  return jobs.slice(0, MAX_PER_COMPANY).map((j) => {
    return buildJob({
      id: `bamboohr-${portal.slug}-${j.id}`,
      title: j.jobOpeningName,
      company: portal.company,
      location: j.location?.city ? `${j.location.city}, ${j.location.state || ''}`.trim() : 'Not specified',
      description: j.jobOpeningDescription ? stripHtml(j.jobOpeningDescription) : '',
      requirements: inferRequirements(j.jobOpeningName || ''),
      applicationUrl: `https://${portal.slug}.bamboohr.com/careers/${j.id}`,
    }, portal);
  });
};

// ─── Teamtailor ───────────────────────────────────────────────────────────────

const parseRssItem = (item: string) => ({
  title: (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || '',
  link: (item.match(/<link>(.*?)<\/link>/) || [])?.[1]?.trim() || '',
  description: (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || [])?.[1]?.trim() || '',
});

const fetchTeamtailor = async (portal: Portal): Promise<NormalizedJob[]> => {
  const res = await get(`https://${portal.slug}.teamtailor.com/jobs.rss`, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
  });
  const xml: string = typeof res.data === 'string' ? res.data : '';
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  return items.slice(0, MAX_PER_COMPANY).map((rawItem, i) => {
    const { title, link, description } = parseRssItem(rawItem);
    const desc = stripHtml(description);
    return buildJob({
      id: `teamtailor-${portal.slug}-${i}`,
      title,
      company: portal.company,
      location: 'See job listing',
      description: desc,
      requirements: inferRequirements(`${title} ${desc}`),
      applicationUrl: link,
    }, portal);
  }).filter((j) => j.title && j.applicationUrl);
};

// ─── Workday ──────────────────────────────────────────────────────────────────

const fetchWorkday = async (portal: Portal): Promise<NormalizedJob[]> => {
  const { slug, workdayShard = slug, workdaySite = 'External_Career_Site' } = portal;
  const url = `https://${slug}.${workdayShard}.myworkdayjobs.com/wday/cxs/${slug}/${workdaySite}/jobs`;
  const res = await post(url, { appliedFacets: {}, limit: 20, offset: 0, searchText: '' });
  const postings: any[] = res.data?.jobPostings || [];
  return postings.slice(0, MAX_PER_COMPANY).map((j) => {
    return buildJob({
      id: `workday-${portal.slug}-${j.bulletFields?.[0] || j.title}`,
      title: j.title,
      company: portal.company,
      location: j.locationsText || 'Not specified',
      description: j.jobDescription || '',
      requirements: inferRequirements(j.title || ''),
      applicationUrl: `https://${slug}.${workdayShard}.myworkdayjobs.com${j.externalPath || ''}`,
    }, portal);
  });
};

// ─── Workable ─────────────────────────────────────────────────────────────────

const fetchWorkable = async (portal: Portal): Promise<NormalizedJob[]> => {
  const res = await get(`https://apply.workable.com/api/v3/accounts/${portal.slug}/jobs`, {
    params: { details: 'true', limit: 20 },
  });
  const results: any[] = res.data?.results || [];
  return results.slice(0, MAX_PER_COMPANY).map((j) => {
    const description = stripHtml(j.description || j.requirements || '');
    return buildJob({
      id: `workable-${portal.slug}-${j.shortcode || j.id}`,
      title: j.title,
      company: portal.company,
      location: j.location?.location_str || j.city || 'Not specified',
      description,
      requirements: inferRequirements(`${j.title} ${description} ${(j.skills || []).join(' ')}`),
      type: inferType(j.employment_type || ''),
      applicationUrl: `https://apply.workable.com/${portal.slug}/j/${j.shortcode || j.id}`,
    }, portal);
  });
};

// ─── SmartRecruiters ──────────────────────────────────────────────────────────

const fetchSmartRecruiters = async (portal: Portal): Promise<NormalizedJob[]> => {
  const res = await get(`https://api.smartrecruiters.com/v1/companies/${portal.slug}/postings`, {
    params: { status: 'PUBLIC', limit: 20 },
  });
  const content: any[] = res.data?.content || [];
  return content.slice(0, MAX_PER_COMPANY).map((j) => {
    const description = stripHtml(j.jobAd?.sections?.jobDescription?.text || '');
    return buildJob({
      id: `smartrecruiters-${portal.slug}-${j.id}`,
      title: j.name,
      company: portal.company,
      location: j.location?.city ? `${j.location.city}, ${j.location.country}` : 'Not specified',
      description,
      requirements: inferRequirements(`${j.name} ${description}`),
      type: inferType(j.typeOfEmployment?.label || ''),
      applicationUrl: j.ref || `https://jobs.smartrecruiters.com/${portal.slug}/${j.id}`,
    }, portal);
  });
};

// ─── Per-provider dispatcher ──────────────────────────────────────────────────

const fetchPortal = async (portal: Portal): Promise<NormalizedJob[]> => {
  try {
    switch (portal.ats) {
      case 'greenhouse':      return await fetchGreenhouse(portal);
      case 'ashby':           return await fetchAshby(portal);
      case 'lever':           return await fetchLever(portal);
      case 'bamboohr':        return await fetchBambooHR(portal);
      case 'teamtailor':      return await fetchTeamtailor(portal);
      case 'workday':         return await fetchWorkday(portal);
      case 'workable':        return await fetchWorkable(portal);
      case 'smartrecruiters': return await fetchSmartRecruiters(portal);
      default:                return [];
    }
  } catch (err: any) {
    // Silently skip unreachable portals — never fail the full scan
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[ats-scanner] ${portal.company} (${portal.ats}) skipped: ${err?.message || 'error'}`);
    }
    return [];
  }
};

// ─── Main scanner class ───────────────────────────────────────────────────────

type ScanOptions = {
  /** Filter by title keyword (case-insensitive) */
  titleFilter?: string[];
  /** Filter to only remote jobs */
  remoteOnly?: boolean;
  /** Max jobs returned across all portals */
  limit?: number;
  /** Run portals concurrently in batches to avoid rate-limit hammering */
  batchSize?: number;
};

type ScanResult = {
  jobs: NormalizedJob[];
  portalsScanned: number;
  portalsSucceeded: number;
  durationMs: number;
};

export class AtsScannerService {
  /** In-memory cache: maps cacheKey → { jobs, expiresAt } */
  private cache = new Map<string, { jobs: NormalizedJob[]; expiresAt: number }>();
  private readonly CACHE_TTL_MS = Number(process.env.SCRAPING_INTERVAL) || 6 * 60 * 60 * 1000;

  /** Run a full scan across all registered portals */
  async scan(options: ScanOptions = {}): Promise<ScanResult> {
    const cacheKey = JSON.stringify(options);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { jobs: cached.jobs, portalsScanned: 0, portalsSucceeded: 0, durationMs: 0 };
    }

    const { PORTALS } = await import('../config/portals');
    const { titleFilter = [], remoteOnly = false, limit = 200, batchSize = 8 } = options;
    const start = Date.now();
    let portalsSucceeded = 0;

    // Batch portals to avoid hammering all at once
    const allJobs: NormalizedJob[] = [];
    for (let i = 0; i < PORTALS.length; i += batchSize) {
      const batch = PORTALS.slice(i, i + batchSize);
      const results = await Promise.allSettled(batch.map(fetchPortal));
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          portalsSucceeded++;
          allJobs.push(...r.value);
        } else {
          console.warn(`[ats-scanner] ${batch[idx].company} failed: ${(r as any).reason?.message}`);
        }
      });
    }

    // Filter, deduplicate, sort
    let filtered = allJobs.filter((j) => {
      if (!j.title || !j.applicationUrl) return false;
      if (remoteOnly && !j.remote) return false;
      if (titleFilter.length) {
        const titleLower = j.title.toLowerCase();
        if (!titleFilter.some((kw) => titleLower.includes(kw.toLowerCase()))) return false;
      }
      return true;
    });

    // Deduplicate by company+title
    const seen = new Set<string>();
    filtered = filtered.filter((j) => {
      const key = `${j.company.toLowerCase()}-${j.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const jobs = filtered.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
    const durationMs = Date.now() - start;

    this.cache.set(cacheKey, { jobs, expiresAt: Date.now() + this.CACHE_TTL_MS });

    console.log(`[ats-scanner] Scanned ${PORTALS.length} portals, ${portalsSucceeded} succeeded, ${jobs.length} jobs in ${durationMs}ms`);
    return { jobs, portalsScanned: PORTALS.length, portalsSucceeded, durationMs };
  }

  /** Quick scan: only Greenhouse + Ashby (fastest/most coverage) */
  async quickScan(options: ScanOptions = {}): Promise<NormalizedJob[]> {
    const { PORTALS } = await import('../config/portals');
    const priority = PORTALS.filter((p) => p.ats === 'greenhouse' || p.ats === 'ashby');
    const results = await Promise.allSettled(priority.map(fetchPortal));
    const jobs = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    return jobs
      .filter((j) => Boolean(j.title && j.applicationUrl))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, options.limit || 100);
  }

  /** Invalidate cache (e.g. called from the scheduled scraper) */
  invalidateCache() {
    this.cache.clear();
  }
}

export const atsScannerService = new AtsScannerService();
