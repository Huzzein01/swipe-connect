import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id?.toString?.() || user.id,
      email: user.email,
      name: user.name,
      displayName: user.name,
      photoURL: user.photoURL || user.profilePicture,
    },
    process.env.JWT_SECRET || 'dev-only-jwt-secret-change-in-production',
    { expiresIn: (process.env.JWT_EXPIRATION || '7d') as any }
  );
};

export const login = (req: Request, res: Response) => {
  res.json({ message: 'Please authenticate with LinkedIn' });
};

export const linkedinCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)?._id || (req.user as any)?.id;
    if (typeof userId === 'string' && userId.startsWith('linkedin-')) {
      return res.json(req.user);
    }

    const user = await User.findById(userId).select('-__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobTypes, locations, experienceLevel, salaryRange } = req.body;
    const user = await User.findByIdAndUpdate(
      (req.user as any)?._id || (req.user as any)?.id,
      {
        $set: {
          'preferences.jobTypes': jobTypes,
          'preferences.locations': locations,
          'preferences.experienceLevel': experienceLevel,
          'preferences.salaryRange': salaryRange,
        },
      },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    next(error);
  }
}; 
