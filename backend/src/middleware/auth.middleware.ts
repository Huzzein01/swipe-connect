import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

interface JwtPayload {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
}

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-only-jwt-secret-change-in-production') as JwtPayload;
    if (decoded.id?.startsWith('linkedin-')) {
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        email: decoded.email,
        name: decoded.name || decoded.displayName || 'LinkedIn Member',
        displayName: decoded.displayName || decoded.name,
        photoURL: decoded.photoURL,
      } as any;
      return next();
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user as any;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}; 
