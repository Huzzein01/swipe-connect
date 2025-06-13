import express from 'express';
import passport from 'passport';
import { login, linkedinCallback, getProfile, updatePreferences } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// LinkedIn OAuth routes
router.get('/login', login);
router.get('/linkedin', passport.authenticate('linkedin'));
router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { session: false }),
  linkedinCallback
);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/preferences', authenticate, updatePreferences);

export default router; 