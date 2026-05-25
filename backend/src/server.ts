import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import { JobService } from './services/job.service';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import startupRoutes from './routes/startup.routes';
import userRoutes from './routes/user.routes';
import './config/passport';

const app = express();
const PORT = process.env.PORT || 3001;
const jobService = new JobService();

if (!process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET not set. Using default is insecure in production.');
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:8092',
      'http://127.0.0.1:8092',
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'offline-demo-mode',
    jobSources: ['Himalayas', 'Remotive', 'Arbeitnow'],
  });
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

const mongoUri = process.env.MONGODB_URI;

if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB');
      await jobService.scrapeAndSaveJobs();
      startServer();
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      console.log('Starting server in offline demo mode.');
      startServer();
    });
} else {
  console.log('MONGODB_URI not set. Starting server in offline demo mode.');
  startServer();
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB runtime error:', error);
});

mongoose.connection.on('disconnected', () => {
  if (mongoUri) {
    console.warn('MongoDB disconnected; public job API fallback remains available.');
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await mongoose.connection.close();
  process.exit(0);
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
}); 
