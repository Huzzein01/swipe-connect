import { Job, UserPreferences } from '../types/job';
import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  limit,
  getDoc,
} from 'firebase/firestore';

export const jobService = {
  // Get jobs based on user preferences
  getJobs: async (preferences: UserPreferences): Promise<Job[]> => {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('type', 'in', preferences.jobTypes),
      where('remote', '==', preferences.remote),
      orderBy('postedDate', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Job));
  },

  // Get job by ID
  getJobById: async (jobId: string): Promise<Job | null> => {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    
    if (!jobDoc.exists()) {
      return null;
    }

    return { id: jobDoc.id, ...jobDoc.data() } as Job;
  },

  // Save job application
  saveApplication: async (userId: string, jobId: string, status: 'applied' | 'saved' | 'rejected') => {
    const applicationsRef = collection(db, 'applications');
    await addDoc(applicationsRef, {
      userId,
      jobId,
      status,
      appliedAt: new Date().toISOString(),
    });
  },

  // Get user's job applications
  getUserApplications: async (userId: string) => {
    const applicationsRef = collection(db, 'applications');
    const q = query(
      applicationsRef,
      where('userId', '==', userId),
      orderBy('appliedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  // Update application status
  updateApplicationStatus: async (applicationId: string, status: 'applied' | 'saved' | 'rejected') => {
    const applicationRef = doc(db, 'applications', applicationId);
    await updateDoc(applicationRef, { status });
  },

  // Get jobs by location
  getJobsByLocation: async (location: { city: string; state: string; radius: number }) => {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('location.city', '==', location.city),
      where('location.state', '==', location.state),
      orderBy('postedDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Job));
  },

  // Get jobs by industry
  getJobsByIndustry: async (industries: string[]) => {
    const jobsRef = collection(db, 'jobs');
    const q = query(
      jobsRef,
      where('industry', 'in', industries),
      orderBy('postedDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Job));
  },
}; 