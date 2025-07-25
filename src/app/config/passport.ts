import bcryptjs from "bcryptjs";
/* eslint-disable @typescript-eslint/no-explicit-any */
import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import envVariables from "./env";
import User from "../modules/user/user.model";
import { IsActive, UserRole } from "../modules/user/user.interface";
import { Strategy as LocalStrategy } from "passport-local";

// email password authentication with passport

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        // check for email and password has been provided
        if (!email || !password) {
          return done(null, false, { message: "Email and password are required" });
        }

        // check if user exists
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: "User not found" });
        }
        if (!user.isVerified) {
          return done(null, false, { message: "User is not verified" });
        }
        if (user.isActive === IsActive.BLOCKED || user.isActive === IsActive.INACTIVE) {
          return done(null, false, { message: `User is ${user.isActive}` });
        }
        if (user.isDeleted) {
          return done(null, false, { message: "User is deleted" });
        }

        // check if the users is google authenticated

        const isGoogleAuthenticated = user.auths.some((providerObjects) => providerObjects.provider === "google");

        if (isGoogleAuthenticated && !user.password) {
          return done(null, false, { message: "This user is authenticated with Google. Please use Google login." });
        }

        const isPasswordMatch = await bcryptjs.compare(password, user.password as string);

        if (!isPasswordMatch) {
          return done(null, false, { message: "Password is incorrect" });
        }

        return done(null, user);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        done(error);
      }
    }
  )
);

// Configure Passport to use Google OAuth strategy

passport.use(
  new GoogleStrategy(
    {
      clientID: envVariables.GOOGLE_CLIENT_ID,
      clientSecret: envVariables.GOOGLE_CLIENT_SECRET,
      callbackURL: envVariables.GOOGLE_CALLBACK_URL,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(null, false, { message: "Email not found in profile" });
        }

        const user = await User.findOne({ email });

        if (user && !user.isVerified) {
          return done(null, false, { message: "User is not verified" });
        }
        if (user && (user.isActive === IsActive.BLOCKED || user.isActive === IsActive.INACTIVE)) {
          return done(null, false, { message: `User is ${user.isActive}` });
        }
        if (user && user.isDeleted) {
          return done(null, false, { message: "User is deleted" });
        }

        if (!user) {
          const newUser = await User.create({
            email,
            name: profile.displayName,
            picture: profile.photos?.[0].value,
            role: UserRole.USER,
            isVerified: true,
            auths: [
              {
                provider: "google",
                providerId: profile.id,
              },
            ],
          });
          return done(null, newUser);
        }

        return done(null, user);
      } catch (error) {
        // return done(error, null);
        // eslint-disable-next-line no-console
        console.log(error);
        return done(null, false, { message: "An error occurred while processing your request." });
      }
    }
  )
);

// Serialize and deserialize user instances to support persistent login sessions

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

// Deserialize user instance from the session

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
