import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import User from '../models/User';

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
        let user = await User.findOne({ linkedInId: profile.id });

        if (!user) {
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          user = await User.create({
            linkedInId: profile.id,
            email: profile.emails?.[0]?.value,
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