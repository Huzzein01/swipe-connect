/**
 * Company portal registry — maps company slugs to their ATS provider.
 * Each entry mirrors career-ops portals.yml structure.
 * Zero LLM tokens — pure HTTP calls to structured ATS APIs.
 */

export type AtsProvider = 'greenhouse' | 'ashby' | 'lever' | 'bamboohr' | 'teamtailor' | 'workday';

export type Portal = {
  company: string;          // Display name
  slug: string;             // ATS-specific identifier (subdomain / board slug)
  ats: AtsProvider;
  industry: string;
  stage?: string;
  /** Workday-only extra fields */
  workdayShard?: string;    // e.g. "wd5"
  workdaySite?: string;     // e.g. "External_Career_Site"
};

export const PORTALS: Portal[] = [
  // ─── Greenhouse ─────────────────────────────────────────────────────────
  { company: 'Anthropic',        slug: 'anthropic',        ats: 'greenhouse', industry: 'AI', stage: 'Growth' },
  { company: 'OpenAI',           slug: 'openai',           ats: 'greenhouse', industry: 'AI', stage: 'Growth' },
  { company: 'Figma',            slug: 'figma',            ats: 'greenhouse', industry: 'Design Tools', stage: 'Post-IPO' },
  { company: 'Notion',           slug: 'notionlabs',       ats: 'greenhouse', industry: 'Productivity', stage: 'Series C' },
  { company: 'Linear',           slug: 'linear',           ats: 'greenhouse', industry: 'Dev Tools', stage: 'Series B' },
  { company: 'Vercel',           slug: 'vercel',           ats: 'greenhouse', industry: 'Cloud', stage: 'Series D' },
  { company: 'Replit',           slug: 'replit',           ats: 'greenhouse', industry: 'Dev Tools', stage: 'Series B' },
  { company: 'Retool',           slug: 'retool',           ats: 'greenhouse', industry: 'Dev Tools', stage: 'Series C' },
  { company: 'Brex',             slug: 'brex',             ats: 'greenhouse', industry: 'Fintech', stage: 'Series D' },
  { company: 'Plaid',            slug: 'plaid',            ats: 'greenhouse', industry: 'Fintech', stage: 'Growth' },
  { company: 'Loom',             slug: 'loom',             ats: 'greenhouse', industry: 'SaaS', stage: 'Acquired' },
  { company: 'Discord',          slug: 'discord',          ats: 'greenhouse', industry: 'Social', stage: 'Series H' },
  { company: 'Intercom',         slug: 'intercom',         ats: 'greenhouse', industry: 'SaaS', stage: 'Growth' },
  { company: 'PlanetScale',      slug: 'planetscale',      ats: 'greenhouse', industry: 'Database', stage: 'Series C' },
  { company: 'Glean',            slug: 'glean',            ats: 'greenhouse', industry: 'AI', stage: 'Series D' },
  { company: 'Hightouch',        slug: 'hightouch',        ats: 'greenhouse', industry: 'Data', stage: 'Series B' },
  { company: 'RunPod',           slug: 'runpod',           ats: 'greenhouse', industry: 'Cloud', stage: 'Seed' },
  { company: 'Ramp',             slug: 'ramp',             ats: 'greenhouse', industry: 'Fintech', stage: 'Series D' },
  { company: 'Rippling',         slug: 'rippling',         ats: 'greenhouse', industry: 'HR Tech', stage: 'Series E' },
  { company: 'Airtable',         slug: 'airtable',         ats: 'greenhouse', industry: 'SaaS', stage: 'Series F' },
  { company: 'Scale AI',         slug: 'scaleai',          ats: 'greenhouse', industry: 'AI', stage: 'Series F' },
  { company: 'Weights & Biases', slug: 'wandb',            ats: 'greenhouse', industry: 'ML Tools', stage: 'Series C' },
  { company: 'Hugging Face',     slug: 'huggingface',      ats: 'greenhouse', industry: 'AI', stage: 'Series D' },
  { company: 'Mistral AI',       slug: 'mistral',          ats: 'greenhouse', industry: 'AI', stage: 'Series B' },

  // ─── Ashby ──────────────────────────────────────────────────────────────
  { company: 'Deepgram',         slug: 'deepgram',         ats: 'ashby', industry: 'AI', stage: 'Series B' },
  { company: 'Cohere',           slug: 'cohere',           ats: 'ashby', industry: 'AI', stage: 'Series C' },
  { company: 'WorkOS',           slug: 'workos',           ats: 'ashby', industry: 'Dev Tools', stage: 'Series B' },
  { company: 'Resend',           slug: 'resend',           ats: 'ashby', industry: 'Dev Tools', stage: 'Series A' },
  { company: 'Supabase',         slug: 'supabase',         ats: 'ashby', industry: 'Database', stage: 'Series C' },
  { company: 'Photoroom',        slug: 'photoroom',        ats: 'ashby', industry: 'AI', stage: 'Series A' },
  { company: 'Cal.com',          slug: 'calcom',           ats: 'ashby', industry: 'SaaS', stage: 'Series A' },
  { company: 'Clerk',            slug: 'clerk',            ats: 'ashby', industry: 'Dev Tools', stage: 'Series A' },
  { company: 'Neon',             slug: 'neon',             ats: 'ashby', industry: 'Database', stage: 'Series B' },
  { company: 'ElevenLabs',       slug: 'elevenlabs',       ats: 'ashby', industry: 'AI', stage: 'Series B' },
  { company: 'Perplexity',       slug: 'perplexityai',     ats: 'ashby', industry: 'AI', stage: 'Series B' },
  { company: 'Runway',           slug: 'runwayml',         ats: 'ashby', industry: 'AI', stage: 'Series C' },
  { company: 'Together AI',      slug: 'togetherai',       ats: 'ashby', industry: 'AI', stage: 'Series A' },
  { company: 'Modal',            slug: 'modal',            ats: 'ashby', industry: 'Cloud', stage: 'Series B' },
  { company: 'Weaviate',         slug: 'weaviate',         ats: 'ashby', industry: 'Database', stage: 'Series B' },
  { company: 'Qdrant',           slug: 'qdrant',           ats: 'ashby', industry: 'Database', stage: 'Series A' },
  { company: 'n8n',              slug: 'n8n',              ats: 'ashby', industry: 'Automation', stage: 'Series B' },

  // ─── Lever ──────────────────────────────────────────────────────────────
  { company: 'Netflix',          slug: 'netflix',          ats: 'lever', industry: 'Entertainment', stage: 'Public' },
  { company: 'Yelp',             slug: 'yelp',             ats: 'lever', industry: 'Marketplace', stage: 'Public' },
  { company: 'Eventbrite',       slug: 'eventbrite',       ats: 'lever', industry: 'Events', stage: 'Public' },
  { company: 'Lyft',             slug: 'lyft',             ats: 'lever', industry: 'Transportation', stage: 'Public' },
  { company: 'Robinhood',        slug: 'robinhood',        ats: 'lever', industry: 'Fintech', stage: 'Public' },
  { company: 'Reddit',           slug: 'reddit',           ats: 'lever', industry: 'Social', stage: 'Public' },
  { company: 'Twitch',           slug: 'twitch',           ats: 'lever', industry: 'Entertainment', stage: 'Acquired' },

  // ─── BambooHR ────────────────────────────────────────────────────────────
  { company: 'Zapier',           slug: 'zapier',           ats: 'bamboohr', industry: 'Automation', stage: 'Bootstrapped' },
  { company: 'HubSpot',          slug: 'hubspot',          ats: 'bamboohr', industry: 'SaaS', stage: 'Public' },

  // ─── Teamtailor ──────────────────────────────────────────────────────────
  { company: 'Klarna',           slug: 'klarna',           ats: 'teamtailor', industry: 'Fintech', stage: 'Public' },
  { company: 'Spotify',          slug: 'spotify',          ats: 'teamtailor', industry: 'Entertainment', stage: 'Public' },

  // ─── Workday ─────────────────────────────────────────────────────────────
  { company: 'Salesforce',       slug: 'salesforce',       ats: 'workday', industry: 'SaaS', stage: 'Public', workdayShard: 'salesforce', workdaySite: 'External_Career_Site' },
  { company: 'Adobe',            slug: 'adobe',            ats: 'workday', industry: 'SaaS', stage: 'Public', workdayShard: 'adobe',      workdaySite: 'External_Career_Site' },
];

/** Lookup by ATS type for bulk scans */
export const portalsByAts = (ats: AtsProvider) => PORTALS.filter((p) => p.ats === ats);
