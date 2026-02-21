import { Job, Resume } from '../types/job';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface FileAsset {
  uri: string;
  name: string;
  type: string;
}

export const aiService = {
  parseResume: async (file: FileAsset): Promise<Resume> => {
    const formData = new FormData();
    formData.append('resume', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await axios.post(`${API_URL}/ai/parse-resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  applyToJob: async (jobId: string, resume: Resume): Promise<{ success: boolean; message: string }> => {
    const response = await axios.post(`${API_URL}/ai/apply-job`, {
      jobId,
      resume,
    });

    return response.data;
  },

  getJobRecommendations: async (resume: Resume, preferences: any): Promise<Job[]> => {
    const response = await axios.post(`${API_URL}/ai/recommend-jobs`, {
      resume,
      preferences,
    });

    return response.data;
  },

  getJobMatchScore: async (job: Job, resume: Resume): Promise<number> => {
    const response = await axios.post(`${API_URL}/ai/job-match-score`, {
      job,
      resume,
    });

    return response.data.score;
  },
};
