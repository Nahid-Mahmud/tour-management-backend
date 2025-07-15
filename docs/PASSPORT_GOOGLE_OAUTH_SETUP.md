# Passport.js Google OAuth2 Setup Guide

This comprehensive guide walks you through setting up Google OAuth2 authentication using Passport.js in your Tour Management Backend application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google OAuth Setup](#google-oauth-setup)
3. [Environment Variables](#environment-variables)
4. [Dependencies](#dependencies)
5. [Project Structure](#project-structure)
6. [Implementation Steps](#implementation-steps)
7. [Testing the Implementation](#testing-the-implementation)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Google Cloud Console account
- Basic understanding of Express.js and TypeScript

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if required) and Google OAuth2 API

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** for user type (unless you have a Google Workspace)
3. Fill in the required information:
   - App name: `Tour Management App`
   - User support email: Your email
   - Developer contact information: Your email
4. Add authorized domains if deploying to production
5. Save and continue through the scopes and test users sections

### 3. Create OAuth2 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure the client:
   - **Name**: `Tour Management OAuth Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:5000` (development)
     - Your production domain (when deploying)
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/v1/auth/google/callback` (development)
     - Your production callback URL (when deploying)
5. Save and note down the **Client ID** and **Client Secret**

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/tour-management

# JWT Configuration
ACCESS_TOKEN_JWT_SECRET=your-access-token-secret-here
ACCESS_TOKEN_JWT_EXPIRATION=15m
REFRESH_TOKEN_JWT_SECRET=your-refresh-token-secret-here
REFRESH_TOKEN_JWT_EXPIRATION=7d

# Session Configuration
EXPRESS_SESSION_SECRET=your-session-secret-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# Frontend URL (for redirects after authentication)
FRONTEND_URL=http://localhost:3000

# Super Admin Configuration
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=secure-password

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=12
```

## Dependencies

The project already includes the necessary dependencies. Here's what each package does:

```json
{
  "passport": "^0.7.0", // Core Passport.js library
  "passport-google-oauth20": "^2.0.0", // Google OAuth2 strategy
  "express-session": "^1.18.1", // Session management
  "cookie-parser": "^1.4.7", // Parse cookies
  "@types/passport": "^1.0.17", // TypeScript types for Passport
  "@types/passport-google-oauth20": "^2.0.16", // TypeScript types for Google strategy
  "@types/express-session": "^1.18.2" // TypeScript types for sessions
}
```

## Project Structure

The authentication system is organized as follows:

```
src/
├── app/
│   ├── config/
│   │   ├── env.ts                    # Environment variable configuration
│   │   └── passport.ts               # Passport strategy configuration
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts    # Authentication controllers
│   │   │   ├── auth.routes.ts        # Authentication routes
│   │   │   └── auth.service.ts       # Authentication business logic
│   │   └── user/
│   │       ├── user.interface.ts     # User type definitions
│   │       ├── user.model.ts         # User MongoDB model
│   │       └── ...
│   └── middlewares/
│       └── checkAuth.ts              # Authentication middleware
├── utils/
│   ├── userTokens.ts                 # JWT token utilities
│   └── setAuthCookie.ts              # Cookie management utilities
└── app.ts                            # Express app configuration
```

## Implementation Steps

### Step 1: Environment Configuration (`src/app/config/env.ts`)

This file validates and loads all required environment variables:

```typescript
interface EnvVariables {
  // ... other variables
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  EXPRESS_SESSION_SECRET: string;
  FRONTEND_URL: string;
}
```

### Step 2: Passport Strategy Configuration (`src/app/config/passport.ts`)

The Passport Google OAuth2 strategy configuration:

```typescript
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(
  new GoogleStrategy(
    {
      clientID: envVariables.GOOGLE_CLIENT_ID,
      clientSecret: envVariables.GOOGLE_CLIENT_SECRET,
      callbackURL: envVariables.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      // Handle user authentication logic
      // Check if user exists, create new user if not
      // Return user object for session serialization
    }
  )
);

// Serialize user for session storage
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
```

### Step 3: User Model Configuration (`src/app/modules/user/user.model.ts`)

The User model supports multiple authentication providers:

```typescript
interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}

interface IUser {
  name: string;
  email: string;
  picture: string;
  password?: string; // Optional for OAuth users
  role: UserRole;
  isVerified?: boolean; // Auto-verified for OAuth
  auths: IAuthProvider[]; // Array of auth providers
}
```

### Step 4: Express App Configuration (`src/app.ts`)

Configure Express middleware for Passport:

```typescript
import passport from "passport";
import expressSession from "express-session";
import "./app/config/passport"; // Import passport configuration

app.use(
  expressSession({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
```

### Step 5: Authentication Routes (`src/app/modules/auth/auth.routes.ts`)

Define OAuth routes:

```typescript
// Initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Handle OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  authControllers.googleCallback
);
```

### Step 6: Authentication Controller (`src/app/modules/auth/auth.controller.ts`)

Handle OAuth callback and token generation:

```typescript
const googleCallback = async (req: Request, res: Response) => {
  const user = req.user;

  // Generate JWT tokens
  const tokenInfo = generateAuthTokens(user);

  // Set secure HTTP-only cookies
  setAuthCookie(res, {
    accessToken: tokenInfo.accessToken,
    refreshToken: tokenInfo.refreshToken,
  });

  // Redirect to frontend
  res.redirect(envVariables.FRONTEND_URL);
};
```

## Authentication Flow

### 1. User Initiation

- User clicks "Login with Google" button
- Frontend redirects to: `GET /api/v1/auth/google`

### 2. Google Authorization

- Passport redirects user to Google OAuth consent screen
- User grants permissions
- Google redirects back to callback URL

### 3. Callback Processing

- `GET /api/v1/auth/google/callback` receives authorization code
- Passport exchanges code for access token and user profile
- Strategy function processes user data

### 4. User Management

- Check if user exists in database by email
- If new user: Create user record with Google auth provider
- If existing user: Update auth providers if needed

### 5. Token Generation

- Generate JWT access token (15 minutes expiry)
- Generate JWT refresh token (7 days expiry)
- Set secure HTTP-only cookies

### 6. Frontend Redirect

- Redirect user to frontend application
- Frontend can access user data via authenticated API calls

## Security Features

### 1. Secure Cookie Configuration

```typescript
const cookieOptions = {
  httpOnly: true, // Prevent XSS attacks
  secure: NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax" as const, // CSRF protection
  maxAge: 15 * 60 * 1000, // 15 minutes for access token
};
```

### 2. Environment Variable Validation

- All sensitive configuration is validated at startup
- Application fails fast if required variables are missing

### 3. Multi-Provider Authentication

- Users can have multiple authentication methods
- Graceful handling of account linking

### 4. Role-Based Access Control

- Automatic role assignment for new OAuth users
- Middleware for route protection based on user roles

## Testing the Implementation

### 1. Start the Development Server

```bash
pnpm run dev
```

### 2. Test OAuth Flow

1. Open browser to: `http://localhost:5000/api/v1/auth/google`
2. Complete Google OAuth flow
3. Verify redirect to frontend
4. Check database for user creation
5. Verify cookies are set properly

### 3. Test API Endpoints

```bash
# Test protected route (should work after OAuth)
curl -b cookies.txt http://localhost:5000/api/v1/protected-route

# Test token refresh
curl -X POST -b cookies.txt http://localhost:5000/api/v1/auth/refresh-token
```

### 4. Frontend Integration

```javascript
// Frontend login button
<button onClick={() => (window.location.href = "http://localhost:5000/api/v1/auth/google")}>Login with Google</button>;

// Check authentication status
fetch("http://localhost:5000/api/v1/auth/profile", {
  credentials: "include", // Include cookies
});
```

## Security Considerations

### 1. Production Configuration

- Use HTTPS for all OAuth URLs
- Set secure cookie flags
- Configure proper CORS origins
- Use strong session secrets

### 2. Database Security

- Index email field for performance
- Implement proper data validation
- Use MongoDB security best practices

### 3. Token Management

- Short-lived access tokens (15 minutes)
- Longer refresh tokens (7 days)
- Automatic token rotation
- Secure token storage in HTTP-only cookies

### 4. Error Handling

- Don't expose sensitive information in error messages
- Log security events for monitoring
- Implement rate limiting for authentication endpoints

## Troubleshooting

### Common Issues

#### 1. "Redirect URI Mismatch"

- **Cause**: OAuth callback URL doesn't match Google Console configuration
- **Solution**: Verify URLs match exactly (including protocol and port)

#### 2. "Invalid Client ID"

- **Cause**: Incorrect or missing Google Client ID
- **Solution**: Check environment variables and Google Console credentials

#### 3. "Session Not Found"

- **Cause**: Session middleware not properly configured
- **Solution**: Verify session secret and middleware order

#### 4. "CORS Issues"

- **Cause**: Frontend and backend domains not properly configured
- **Solution**: Configure CORS with proper origins and credentials

#### 5. "User Not Created"

- **Cause**: Database connection issues or validation errors
- **Solution**: Check MongoDB connection and user model validation

### Debug Tips

1. **Enable Debug Logging**:

```typescript
app.use(morgan("dev")); // Log all requests
```

2. **Check Environment Variables**:

```bash
node -e "console.log(process.env.GOOGLE_CLIENT_ID)"
```

3. **Test Database Connection**:

```typescript
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});
```

4. **Verify Passport Configuration**:

```typescript
console.log("Registered strategies:", Object.keys(passport._strategies));
```

## Production Deployment

### 1. Environment Variables

- Use secure environment variable management
- Never commit secrets to version control
- Use different OAuth credentials for production

### 2. HTTPS Configuration

- Enable HTTPS for OAuth to work properly
- Update Google Console with production URLs
- Configure secure cookie settings

### 3. Database Security

- Use MongoDB Atlas or secure self-hosted instance
- Enable authentication and encryption
- Regular security updates

### 4. Monitoring

- Implement logging for authentication events
- Monitor for failed authentication attempts
- Set up alerts for security issues

## Conclusion

This implementation provides a robust, secure Google OAuth2 authentication system using Passport.js. The modular structure allows for easy maintenance and extension to support additional OAuth providers in the future.

Key benefits of this implementation:

- Type-safe TypeScript implementation
- Secure cookie-based token management
- Multi-provider authentication support
- Comprehensive error handling
- Production-ready security features

For questions or issues, refer to the official documentation:

- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Express Session Documentation](https://github.com/expressjs/session)
