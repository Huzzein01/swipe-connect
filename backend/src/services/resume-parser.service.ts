import pdfParse from 'pdf-parse';
import { readFile } from 'fs/promises';
import { promisify } from 'util';

interface ParsedResume {
  text: string;
  skills: string[];
  experience: {
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    school: string;
    degree: string;
    field: string;
    graduationDate: string;
  }[];
}

export async function parseResume(filePath: string): Promise<ParsedResume> {
  try {
    // Read PDF file
    const dataBuffer = await readFile(filePath);
    const data = await pdfParse(dataBuffer);

    // Extract text content
    const text = data.text;

    // Extract skills (basic implementation)
    const skills = extractSkills(text);

    // Extract experience (basic implementation)
    const experience = extractExperience(text);

    // Extract education (basic implementation)
    const education = extractEducation(text);

    return {
      text,
      skills,
      experience,
      education,
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw error;
  }
}

function extractSkills(text: string): string[] {
  // This is a basic implementation. In a real app, you would use NLP or ML
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
    'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git',
    'Agile', 'Scrum', 'Project Management', 'Leadership',
  ];

  return commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

function extractExperience(text: string): ParsedResume['experience'] {
  // This is a basic implementation. In a real app, you would use NLP or ML
  const experience: ParsedResume['experience'] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/20\d{2}/)) { // Basic date detection
      const exp = {
        company: lines[i - 1] || 'Unknown Company',
        title: lines[i - 2] || 'Unknown Title',
        startDate: line.split('-')[0].trim(),
        endDate: line.split('-')[1]?.trim() || 'Present',
        description: lines.slice(i + 1, i + 4).join(' '),
      };
      experience.push(exp);
    }
  }

  return experience;
}

function extractEducation(text: string): ParsedResume['education'] {
  // This is a basic implementation. In a real app, you would use NLP or ML
  const education: ParsedResume['education'] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\./i)) {
      const edu = {
        school: lines[i - 1] || 'Unknown School',
        degree: line,
        field: lines[i + 1] || 'Unknown Field',
        graduationDate: lines[i + 2]?.match(/\d{4}/)?.[0] || 'Unknown',
      };
      education.push(edu);
    }
  }

  return education;
} 