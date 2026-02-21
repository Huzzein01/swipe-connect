import { Resume } from '../types/job';
import { db, storage } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { aiService, FileAsset } from './aiService';

export const resumeService = {
  uploadResume: async (userId: string, file: FileAsset): Promise<Resume> => {
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `resumes/${userId}/${file.name}`);
    await uploadBytes(storageRef, blob);
    const fileUrl = await getDownloadURL(storageRef);

    const parsedResume = await aiService.parseResume(file);

    const resumeData: Resume = {
      id: doc(collection(db, 'resumes')).id,
      userId,
      fileUrl,
      parsedData: parsedResume.parsedData,
      lastUpdated: new Date().toISOString(),
    };

    await setDoc(doc(db, 'resumes', resumeData.id), resumeData);
    return resumeData;
  },

  getResume: async (userId: string): Promise<Resume | null> => {
    const resumeRef = doc(db, 'resumes', userId);
    const resumeDoc = await getDoc(resumeRef);

    if (!resumeDoc.exists()) {
      return null;
    }

    return resumeDoc.data() as Resume;
  },

  updateResume: async (resumeId: string, updates: Partial<Resume>): Promise<void> => {
    const resumeRef = doc(db, 'resumes', resumeId);
    await updateDoc(resumeRef, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
  },

  deleteResume: async (resumeId: string, fileUrl: string): Promise<void> => {
    await deleteDoc(doc(db, 'resumes', resumeId));

    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  },

  extractSkills: async (resume: Resume): Promise<string[]> => {
    return resume.parsedData.skills;
  },

  extractLocation: async (resume: Resume): Promise<{ city: string; state: string }> => {
    return resume.parsedData.location;
  },

  extractExperience: async (resume: Resume): Promise<Resume['parsedData']['experience']> => {
    return resume.parsedData.experience;
  },

  extractEducation: async (resume: Resume): Promise<Resume['parsedData']['education']> => {
    return resume.parsedData.education;
  },
};
