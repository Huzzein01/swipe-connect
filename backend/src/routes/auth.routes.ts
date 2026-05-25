import express from 'express';
import passport from 'passport';
import { login, linkedinCallback, getProfile, updatePreferences } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const isLinkedInConfigured =
  Boolean(process.env.LINKEDIN_CLIENT_ID) &&
  Boolean(process.env.LINKEDIN_CLIENT_SECRET) &&
  Boolean(process.env.LINKEDIN_CALLBACK_URL);

// LinkedIn OAuth routes
router.get('/login', login);
if (isLinkedInConfigured) {
  router.get('/linkedin', passport.authenticate('linkedin'));
  router.get(
    '/linkedin/callback',
    passport.authenticate('linkedin', { session: false }),
    linkedinCallback
  );
} else {
  router.get('/linkedin', (_req, res) => {
    res.status(503).json({
      message: 'LinkedIn OAuth is not configured yet.',
      requiredEnv: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_CALLBACK_URL'],
    });
  });
}

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/preferences', authenticate, updatePreferences);

export default router; 
