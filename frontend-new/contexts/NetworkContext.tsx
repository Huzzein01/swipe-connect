import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NetworkProfile = {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  avatar: string;          // initials fallback
  photoUrl?: string;
  bio: string;
  skills: string[];
  interests: string[];
  lookingFor: string;
  projectIdeas: string[];
  experience: string;
  matchScore: number;
};

export type NetworkMatch = {
  id: string;
  profile: NetworkProfile;
  matchedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
};

export type Message = {
  id: string;
  matchId: string;
  senderId: string;        // 'me' or profile id
  text: string;
  timestamp: string;
  attachment?: {
    type: 'link' | 'github' | 'pdf' | 'file';
    url: string;
    name: string;
  };
};

type NetworkState = {
  matches: NetworkMatch[];
  messages: Record<string, Message[]>; // matchId → messages[]
};

type NetworkContextType = NetworkState & {
  addMatch: (profile: NetworkProfile) => void;
  sendMessage: (matchId: string, text: string, attachment?: Message['attachment']) => void;
  markRead: (matchId: string) => void;
};

// ─── Seed profiles ───────────────────────────────────────────────────────────

export const NETWORK_PROFILES: NetworkProfile[] = [
  {
    id: 'maya-founder',
    name: 'Maya Johnson',
    title: 'AI Product Founder',
    company: 'Stealth',
    location: 'Austin, TX',
    avatar: 'MJ',
    bio: 'Building lightweight AI operations tooling for small service businesses. Previously led product at a Series B logistics company.',
    skills: ['Product Strategy', 'AI Tools', 'Fundraising', 'Go-to-market'],
    interests: ['Vertical AI', 'SMB automation', 'No-code builders'],
    lookingFor: 'Technical co-founder for workflow automation tools',
    projectIdeas: ['Vertical AI agents for SMBs', 'AI-powered customer onboarding', 'Ops automation for service businesses'],
    experience: '6 years product, 2 years founder',
    matchScore: 94,
  },
  {
    id: 'darius-engineer',
    name: 'Darius Lee',
    title: 'Full-stack Engineer',
    company: 'Freelance',
    location: 'Remote - US',
    avatar: 'DL',
    bio: 'Ships React Native, Node, and data pipelines from prototype to launch. Looking for a mission-driven founder to build with.',
    skills: ['React Native', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
    interests: ['Mobile marketplaces', 'Job automation', 'Developer tools'],
    lookingFor: 'Founder-led projects with clear customer pain',
    projectIdeas: ['Mobile marketplace for skilled trades', 'Job application automation', 'Dev productivity tools'],
    experience: '5 years full-stack, shipped 3 apps',
    matchScore: 90,
  },
  {
    id: 'amina-growth',
    name: 'Amina Okafor',
    title: 'Growth Marketer',
    company: 'Between roles',
    location: 'Chicago, IL',
    avatar: 'AO',
    bio: 'Turns messy GTM ideas into repeatable acquisition loops. Ran lifecycle and paid for a B2B SaaS that hit $4M ARR.',
    skills: ['Lifecycle Marketing', 'Paid Social', 'Analytics', 'SEO', 'CRM'],
    interests: ['Community-led growth', 'Creator partnerships', 'B2B funnels'],
    lookingFor: 'Early-stage team to validate acquisition channels',
    projectIdeas: ['Community-led SaaS growth', 'Creator partnership platform', 'B2B demand gen agency'],
    experience: '7 years growth, B2B SaaS focus',
    matchScore: 87,
  },
  {
    id: 'leon-designer',
    name: 'Leon Park',
    title: 'Product Designer',
    company: 'Flux Studio',
    location: 'New York, NY',
    avatar: 'LP',
    bio: 'Designing consumer apps and design systems. Obsessed with motion, clarity, and making complex things feel simple.',
    skills: ['Figma', 'Motion Design', 'Design Systems', 'iOS/Android patterns'],
    interests: ['Consumer apps', 'Fintech UX', 'AR/spatial computing'],
    lookingFor: 'Technical partner to co-build a consumer product',
    projectIdeas: ['Personal finance for Gen Z', 'AR try-on for e-commerce', 'Social habit tracker'],
    experience: '4 years product design, 2 YC-backed startups',
    matchScore: 83,
  },
  {
    id: 'saria-data',
    name: 'Saria Obi',
    title: 'Data Scientist',
    company: 'Acme Analytics',
    location: 'San Francisco, CA',
    avatar: 'SO',
    bio: 'Turning messy data into product intelligence. Built ML models for retention, churn, and pricing optimization.',
    skills: ['Python', 'ML', 'SQL', 'Product Analytics', 'LLM fine-tuning'],
    interests: ['AI products', 'EdTech', 'Health data'],
    lookingFor: 'Side project or startup focused on data-driven products',
    projectIdeas: ['AI tutoring personalization', 'Health insights platform', 'Predictive hiring tool'],
    experience: '5 years data, 2 years ML',
    matchScore: 79,
  },
];

// ─── Context ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'swipeconnect.network';
const NetworkContext = createContext<NetworkContextType>({} as NetworkContextType);

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NetworkState>({ matches: [], messages: {} });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setState(JSON.parse(raw)); } catch { /* ignore */ }
      }
    });
  }, []);

  const persist = (next: NetworkState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addMatch = (profile: NetworkProfile) => {
    if (state.matches.some((m) => m.profile.id === profile.id)) return;
    const match: NetworkMatch = {
      id: `match-${Date.now()}`,
      profile,
      matchedAt: new Date().toISOString(),
      unreadCount: 0,
    };
    persist({ ...state, matches: [match, ...state.matches] });
  };

  const sendMessage = (matchId: string, text: string, attachment?: Message['attachment']) => {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      matchId,
      senderId: 'me',
      text,
      timestamp: new Date().toISOString(),
      attachment,
    };
    const thread = [...(state.messages[matchId] || []), msg];
    const nextMatches = state.matches.map((m) =>
      m.id === matchId ? { ...m, lastMessage: text, lastMessageAt: msg.timestamp } : m
    );
    persist({ matches: nextMatches, messages: { ...state.messages, [matchId]: thread } });
  };

  const markRead = (matchId: string) => {
    const nextMatches = state.matches.map((m) =>
      m.id === matchId ? { ...m, unreadCount: 0 } : m
    );
    persist({ ...state, matches: nextMatches });
  };

  return (
    <NetworkContext.Provider value={{ ...state, addMatch, sendMessage, markRead }}>
      {children}
    </NetworkContext.Provider>
  );
};
