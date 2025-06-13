import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const generateToken = (user: any) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRATION }
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
    const user = await User.findById(req.user?.id).select('-__v');
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
    const { industries, roles, locations, salaryRange } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      {
        $set: {
          'preferences.industries': industries,
          'preferences.roles': roles,
          'preferences.locations': locations,
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