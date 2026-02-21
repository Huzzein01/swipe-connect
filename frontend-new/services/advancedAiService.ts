import { Job, Resume } from '../types/job';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const advancedAiService = {
  // Analyze resume for improvement suggestions
  analyzeResume: async (resume: Resume): Promise<{
    suggestions: string[];
    score: number;
    improvements: {
      skills: string[];
      experience: string[];
      education: string[];
    };
  }> => {
    const response = await axios.post(`${API_URL}/ai/analyze-resume`, { resume });
    return response.data;
  },

  // Generate personalized cover letter
  generateCoverLetter: async (job: Job, resume: Resume): Promise<string> => {
    const response = await axios.post(`${API_URL}/ai/generate-cover-letter`, {
      job,
      resume,
    });
    return response.data.coverLetter;
  },

  // Optimize resume for specific job
  optimizeResumeForJob: async (job: Job, resume: Resume): Promise<Resume> => {
    const response = await axios.post(`${API_URL}/ai/optimize-resume`, {
      job,
      resume,
    });
    return response.data.optimizedResume;
  },

  // Get career path suggestions
  getCareerPathSuggestions: async (resume: Resume): Promise<{
    suggestedRoles: string[];
    requiredSkills: string[];
    learningPath: {
      courses: string[];
      certifications: string[];
      timeline: string;
    };
  }> => {
    const response = await axios.post(`${API_URL}/ai/career-path`, { resume });
    return response.data;
  },

  // Get salary insights
  getSalaryInsights: async (job: Job, resume: Resume): Promise<{
    salaryRange: {
      min: number;
      max: number;
      median: number;
    };
    marketDemand: number;
    growthPotential: number;
    requiredSkills: string[];
  }> => {
    const response = await axios.post(`${API_URL}/ai/salary-insights`, {
      job,
      resume,
    });
    return response.data;
  },

  // Get interview preparation
  getInterviewPrep: async (job: Job, resume: Resume): Promise<{
    commonQuestions: string[];
    technicalQuestions: string[];
    behavioralQuestions: string[];
    preparationTips: string[];
    companyInsights: string[];
  }> => {
    const response = await axios.post(`${API_URL}/ai/interview-prep`, {
      job,
      resume,
    });
    return response.data;
  },

  // Get job market trends
  getJobMarketTrends: async (industry: string, location: string): Promise<{
    demandTrend: number;
    salaryTrend: number;
    requiredSkills: string[];
    emergingRoles: string[];
    marketInsights: string[];
  }> => {
    const response = await axios.post(`${API_URL}/ai/market-trends`, {
      industry,
      location,
    });
    return response.data;
  },

  // Get personalized learning recommendations
  getLearningRecommendations: async (resume: Resume, targetRole: string): Promise<{
    courses: {
      name: string;
      platform: string;
      duration: string;
      cost: string;
      url: string;
    }[];
    certifications: {
      name: string;
      issuer: string;
      duration: string;
      cost: string;
      url: string;
    }[];
    skills: {
      name: string;
      level: string;
      resources: string[];
    }[];
  }> => {
    const response = await axios.post(`${API_URL}/ai/learning-recommendations`, {
      resume,
      targetRole,
    });
    return response.data;
  },
}; 