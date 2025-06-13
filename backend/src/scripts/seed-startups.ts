import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Startup from '../models/Startup';

dotenv.config();

const startups = [
  {
    name: 'TechFlow',
    description: 'Revolutionizing workflow automation with AI-powered solutions',
    industry: 'SaaS',
    location: 'San Francisco, CA',
    website: 'https://techflow.ai',
    funding: {
      stage: 'Series A',
      amount: 15000000,
      currency: 'USD',
    },
  },
  {
    name: 'GreenEnergy',
    description: 'Sustainable energy solutions for homes and businesses',
    industry: 'CleanTech',
    location: 'Austin, TX',
    website: 'https://greenenergy.co',
    funding: {
      stage: 'Seed',
      amount: 5000000,
      currency: 'USD',
    },
  },
  {
    name: 'HealthTech',
    description: 'Digital health platform connecting patients with healthcare providers',
    industry: 'Healthcare',
    location: 'Boston, MA',
    website: 'https://healthtech.io',
    funding: {
      stage: 'Series B',
      amount: 25000000,
      currency: 'USD',
    },
  },
  {
    name: 'EduTech',
    description: 'Personalized learning platform using AI to adapt to student needs',
    industry: 'Education',
    location: 'New York, NY',
    website: 'https://edutech.com',
    funding: {
      stage: 'Series A',
      amount: 12000000,
      currency: 'USD',
    },
  },
  {
    name: 'FinTech',
    description: 'Mobile-first banking solutions for the modern consumer',
    industry: 'FinTech',
    location: 'Miami, FL',
    website: 'https://fintech.app',
    funding: {
      stage: 'Seed',
      amount: 3000000,
      currency: 'USD',
    },
  },
];

async function seedStartups() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swipeconnect');
    console.log('Connected to MongoDB');

    // Clear existing startups
    await Startup.deleteMany({});
    console.log('Cleared existing startups');

    // Insert new startups
    await Startup.insertMany(startups);
    console.log('Seeded startups successfully');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding startups:', error);
    process.exit(1);
  }
}

seedStartups(); 