import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import mongoose from 'mongoose';
import User from '../models/User';

const hasLinkedInConfig =
  process.env.LINKEDIN_CLIENT_ID &&
  process.env.LINKEDIN_CLIENT_SECRET &&
  process.env.LINKEDIN_CALLBACK_URL;

if (hasLinkedInConfig) {
  passport.use(
    new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL!,
      scope: ['openid', 'profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        const email = profile.emails?.[0]?.value || `${profile.id}@linkedin.local`;
        const fallbackUser = {
          _id: `linkedin-${profile.id}`,
          email,
          name: `${firstName} ${lastName}`.trim() || 'LinkedIn Member',
          firstName,
          lastName,
          linkedInId: profile.id,
          photoURL: profile.photos?.[0]?.value,
        };

        if (mongoose.connection.readyState !== 1) {
          return done(null, fallbackUser);
        }

        let user = await User.findOne({ linkedInId: profile.id });

        if (!user) {
          user = await User.create({
            linkedInId: profile.id,
            email,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            profilePicture: profile.photos?.[0]?.value,
            headline: profile._json?.headline,
            preferences: {
              jobTypes: [],
              locations: [],
              experienceLevel: '',
              salaryRange: {
                min: 0,
                max: 0,
              },
              startups: [],
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
    )
  );
} else {
  console.warn('LinkedIn OAuth is disabled until LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_CALLBACK_URL are set.');
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
}); 
