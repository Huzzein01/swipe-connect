import { JobScraperService } from '../services/job-scraper/job-scraper.service';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startJobScraper() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swipeconnect');
    console.log('Connected to MongoDB');

    // Initialize and start the job scraper service
    const jobScraperService = new JobScraperService();
    await jobScraperService.startScraping();
    console.log('Job scraper service started successfully');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down job scraper service...');
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting job scraper service:', error);
    process.exit(1);
  }
}

// Start the service
startJobScraper(); 