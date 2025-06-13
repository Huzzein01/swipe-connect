import express from 'express';
import { authenticateToken } from '../middleware/auth';
import Startup from '../models/Startup';
import User from '../models/User';
import { IUser } from '../models/User';

const router = express.Router();

// Get startups for swiping
router.get('/', authenticateToken, async (req, res) => {
  try {
    const startups = await Startup.find({ isActive: true })
      .select('-__v')
      .limit(20);
    res.json(startups);
  } catch (error) {
    console.error('Error fetching startups:', error);
    res.status(500).json({ message: 'Error fetching startups' });
  }
});

// Swipe on a startup
router.post('/:startupId/swipe', authenticateToken, async (req, res) => {
  try {
    const { startupId } = req.params;
    const { action } = req.body;
    const user = req.user as IUser;

    // Update user's startup preferences
    await User.findByIdAndUpdate(user._id, {
      $push: {
        'preferences.startups': {
          startup: startupId,
          action,
          timestamp: new Date(),
        },
      },
    });

    res.json({ message: 'Startup preference saved' });
  } catch (error) {
    console.error('Error saving startup preference:', error);
    res.status(500).json({ message: 'Error saving startup preference' });
  }
});

// Get user's startup preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = req.user as IUser;
    const userWithPreferences = await User.findById(user._id)
      .select('preferences.startups')
      .populate('preferences.startups.startup');

    res.json(userWithPreferences?.preferences.startups || []);
  } catch (error) {
    console.error('Error fetching startup preferences:', error);
    res.status(500).json({ message: 'Error fetching startup preferences' });
  }
});

export default router; 