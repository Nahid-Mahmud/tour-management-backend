# Passport.js Local Strategy Authentication Guide

This comprehensive guide walks you through the local authentication system (email/password) implemented using Passport.js Local Strategy in your Tour Management Backend application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Dependencies](#dependencies)
5. [Project Structure](#project-structure)
6. [Implementation Details](#implementation-details)
7. [Validation System](#validation-system)
8. [Authentication Flow](#authentication-flow)
9. [Security Features](#security-features)
10. [API Endpoints](#api-endpoints)
11. [Testing the Implementation](#testing-the-implementation)
12. [Error Handling](#error-handling)
13. [Integration with Frontend](#integration-with-frontend)
14. [Security Best Practices](#security-best-practices)
15. [Troubleshooting](#troubleshooting)

## Overview

The local authentication system provides secure email/password-based authentication using Passport.js Local Strategy. This system includes comprehensive validation, password hashing, JWT token management, and robust error handling.

### Key Features

- **Email/Password Authentication**: Secure credential-based authentication
- **Multi-layered Validation**: Zod schema validation + Passport.js validation
- **Password Security**: BCrypt hashing with configurable salt rounds
- **JWT Token Management**: Access and refresh token system
- **Role-Based Access Control**: Different user roles with appropriate permissions
- **Multi-Provider Support**: Works alongside Google OAuth authentication
- **Comprehensive Error Handling**: Detailed error messages and validation feedback

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Basic understanding of Express.js, TypeScript, and Passport.js
- Familiarity with JWT tokens and password hashing

## Environment Variables

Add the following variables to your `.env` file:

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

# Password Hashing
BCRYPT_SALT_ROUNDS=12

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

## Dependencies

The local authentication system uses the following key dependencies:

```json
{
  "passport": "^0.7.0", // Core Passport.js library
  "passport-local": "^1.0.0", // Local strategy for email/password auth
  "bcryptjs": "^3.0.2", // Password hashing
  "jsonwebtoken": "^9.0.2", // JWT token management
  "zod": "^4.0.4", // Schema validation
  "express-session": "^1.18.1", // Session management
  "http-status-codes": "^2.3.0", // HTTP status code constants
  "mongoose": "^8.16.2" // MongoDB object modeling
}
```

## Project Structure

The local authentication system is organized as follows:

```
src/
├── app/
│   ├── config/
│   │   ├── env.ts                    # Environment variable configuration
│   │   └── passport.ts               # Passport strategies configuration
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts    # Authentication controllers
│   │   │   ├── auth.routes.ts        # Authentication routes
│   │   │   └── auth.service.ts       # Authentication business logic
│   │   └── user/
│   │       ├── user.interface.ts     # User type definitions
│   │       ├── user.model.ts         # User MongoDB model
│   │       ├── user.validation.ts    # Zod validation schemas
│   │       ├── user.controller.ts    # User management controllers
│   │       ├── user.service.ts       # User business logic
│   │       └── user.route.ts         # User routes
│   ├── middlewares/
│   │   ├── checkAuth.ts              # JWT authentication middleware
│   │   ├── validateRequest.ts        # Request validation middleware
│   │   └── globalErrorHandler.ts     # Global error handling
│   ├── helpers/
│   │   ├── handleZodError.ts         # Zod error handling
│   │   ├── handleValidationError.ts  # Mongoose validation error handling
│   │   └── handleDuplicateKeyError.ts # MongoDB duplicate key error handling
│   └── utils/
│       ├── userTokens.ts             # JWT token utilities
│       ├── hashPassword.ts           # Password hashing utility
│       ├── setAuthCookie.ts          # Cookie management
│       └── catchAsync.ts             # Async error handling
└── app.ts                            # Express app configuration
```

## Implementation Details

### 1. Passport Local Strategy Configuration

**File**: `src/app/config/passport.ts`

```typescript
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcryptjs from "bcryptjs";
import User from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        // Input validation
        if (!email || !password) {
          return done(null, false, { message: "Email and password are required" });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        // Check user status
        if (user.isActive === IsActive.BLOCKED || user.isActive === IsActive.INACTIVE) {
          return done(null, false, { message: `User is ${user.isActive}` });
        }

        if (user.isDeleted) {
          return done(null, false, { message: "User is deleted" });
        }

        // Check for Google-authenticated users
        const isGoogleAuthenticated = user.auths.some((providerObjects) => providerObjects.provider === "google");

        if (isGoogleAuthenticated && !user.password) {
          return done(null, false, {
            message: "This user is authenticated with Google. Please use Google login.",
          });
        }

        // Verify password
        const isPasswordMatch = await bcryptjs.compare(password, user.password as string);
        if (!isPasswordMatch) {
          return done(null, false, { message: "Password is incorrect" });
        }

        return done(null, user);
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);

// Session serialization
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
```

### 2. User Model and Interface

**File**: `src/app/modules/user/user.interface.ts`

```typescript
import { Types } from "mongoose";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  GUIDE = "GUIDE",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  picture: string;
  password?: string; // Optional for OAuth users
  role: UserRole;
  phone?: string;
  address?: string;
  isDeleted?: boolean;
  isActive?: IsActive;
  isVerified?: boolean;
  bookings?: Types.ObjectId[];
  guides?: Types.ObjectId[];
  auths: IAuthProvider[]; // Multi-provider support
}
```

**File**: `src/app/modules/user/user.model.ts`

```typescript
import { model, Schema } from "mongoose";
import { IAuthProvider, IsActive, IUser, UserRole } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  { _id: false, versionKey: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    picture: { type: String, required: false },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    isActive: {
      type: String,
      enum: Object.values(IsActive),
      default: IsActive.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    auths: [authProviderSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = model<IUser>("User", userSchema);
export default User;
```

### 3. Authentication Controller

**File**: `src/app/modules/auth/auth.controller.ts`

```typescript
import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { catchAsync } from "../../utils/catchAsync";
import { setAuthCookie } from "../../utils/setAuthCookie";
import { generateAuthTokens } from "../../utils/userTokens";
import sendResponse from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";

const credentialLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", async (error: any, user: any, info: any) => {
    if (error) {
      return next(new AppError(StatusCodes.INTERNAL_SERVER_ERROR, info?.message || "Internal server error"));
    }

    if (!user) {
      return next(new AppError(StatusCodes.UNAUTHORIZED, info?.message || "User does not exist"));
    }

    // Generate JWT tokens
    const authTokens = generateAuthTokens(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user.toObject();

    // Set secure HTTP-only cookies
    setAuthCookie(res, {
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
    });

    sendResponse(res, {
      success: true,
      message: "User logged in successfully",
      data: {
        user: userWithoutPassword,
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
      },
      statusCode: StatusCodes.OK,
    });
  })(req, res, next);
});
```

### 4. Authentication Routes

**File**: `src/app/modules/auth/auth.routes.ts`

```typescript
import { Router } from "express";
import { authControllers } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";

const route = Router();

// Local authentication routes
route.post("/login", authControllers.credentialLogin);
route.post("/refresh-token", authControllers.generateAccessTokensUsingRefreshToken);
route.post("/logout", authControllers.logout);
route.patch("/reset-password", checkAuth(...Object.values(UserRole)), authControllers.resetPassword);

export const authRoutes = route;
```

## Validation System

The project implements a comprehensive multi-layered validation system:

### 1. Zod Schema Validation

**File**: `src/app/modules/user/user.validation.ts`

```typescript
import z from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must not exceed 50 characters" }),
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .max(100, { message: "Email must not exceed 100 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, {
      message: "Password must contain at least one number",
    })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
  phone: z
    .string()
    .regex(/^(?:\+880|880|0)(1[3-9])[0-9]{8}$/, {
      message: "Phone number must be a valid Bangladeshi mobile number",
    })
    .optional(),
});
```

### 2. Request Validation Middleware

**File**: `src/app/middlewares/validateRequest.ts`

```typescript
import { NextFunction, Request, Response } from "express";
import { ZodObject, ZodRawShape } from "zod";

export const validateRequest =
  (ZodSchema: ZodObject<ZodRawShape>) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await ZodSchema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
```

### 3. Password Validation in Auth Service

**File**: `src/app/modules/auth/auth.service.ts`

```typescript
import z from "zod";

const passwordValidationSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(/[0-9]/, {
    message: "Password must contain at least one number",
  })
  .regex(/[^A-Za-z0-9]/, {
    message: "Password must contain at least one special character",
  });

const resetPassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {
  // Validate new password using Zod
  const zodPasswordValidationResult = await passwordValidationSchema.parseAsync(newPassword);

  // Additional business logic validation
  if (oldPassword === newPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "New password must be different from old password");
  }

  // ... rest of the password reset logic
};
```

### 4. Authentication Middleware

**File**: `src/app/middlewares/checkAuth.ts`

```typescript
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/jwt";
import AppError from "../errorHelpers/AppError";
import { UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";

export const checkAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;
      if (!accessToken) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Access token is required");
      }

      const verifiedToken = verifyToken(accessToken, envVariables.ACCESS_TOKEN_JWT_SECRET);

      const isUserExist = await User.findOne({ email: verifiedToken.email });

      if (!isUserExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
      }

      // User status validation
      if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(StatusCodes.BAD_REQUEST, `User is ${isUserExist.isActive}`);
      }

      if (isUserExist.isDeleted) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
      }

      // Role-based access control
      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to access this resource");
      }

      req.user = verifiedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
```

## Authentication Flow

### 1. User Registration Flow

1. **Client Request**: POST `/api/v1/users/register`
2. **Request Validation**: Zod schema validation via `validateRequest` middleware
3. **Business Logic**: `userService.createUser()` handles:
   - Email uniqueness check
   - Password hashing with BCrypt
   - User creation with credentials auth provider
4. **Response**: User created (password excluded from response)

### 2. User Login Flow

1. **Client Request**: POST `/api/v1/auth/login`
2. **Passport Authentication**: Local strategy validates:
   - Email and password presence
   - User existence and status
   - Google OAuth conflict check
   - Password verification with BCrypt
3. **Token Generation**: JWT access and refresh tokens
4. **Cookie Setting**: Secure HTTP-only cookies
5. **Response**: User data and tokens

### 3. Protected Route Access

1. **Request**: Any protected route with Authorization header
2. **Middleware**: `checkAuth` middleware validates:
   - Token presence and validity
   - User existence and status
   - Role-based permissions
3. **Route Handler**: Execute protected route logic

### 4. Token Refresh Flow

1. **Client Request**: POST `/api/v1/auth/refresh-token`
2. **Token Validation**: Refresh token validation
3. **New Token Generation**: New access token generation
4. **Response**: New access token

## Security Features

### 1. Password Security

- **BCrypt Hashing**: Passwords hashed with configurable salt rounds
- **Strong Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### 2. Token Security

- **JWT Tokens**: Signed with secret keys
- **Short-lived Access Tokens**: 15 minutes expiry
- **Longer Refresh Tokens**: 7 days expiry
- **HTTP-only Cookies**: Prevent XSS attacks

### 3. User Status Management

- **Account States**: Active, Inactive, Blocked
- **Soft Delete**: Users marked as deleted rather than removed
- **Email Verification**: Optional email verification system

### 4. Multi-Provider Authentication

- **Provider Tracking**: Each user tracks authentication providers
- **Conflict Resolution**: Prevents password login for Google-only users
- **Seamless Integration**: Works with existing Google OAuth system

## API Endpoints

### Authentication Endpoints

#### User Registration

```
POST /api/v1/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+8801712345678"
}
```

#### User Login

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Token Refresh

```
POST /api/v1/auth/refresh-token
Cookie: refreshToken=<refresh_token>
```

#### Password Reset

```
PATCH /api/v1/auth/reset-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "oldPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

#### Logout

```
POST /api/v1/auth/logout
Cookie: accessToken=<access_token>; refreshToken=<refresh_token>
```

### Protected Endpoints Example

```
GET /api/v1/users/
Authorization: Bearer <access_token>
```

## Testing the Implementation

### 1. Manual Testing

#### Test User Registration

```bash
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "phone": "+8801712345678"
  }'
```

#### Test User Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

#### Test Protected Route

```bash
curl -X GET http://localhost:5000/api/v1/users/ \
  -H "Authorization: Bearer <your_access_token>"
```

### 2. Validation Testing

#### Test Password Validation

```bash
# Test weak password
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "weak"
  }'
```

#### Test Email Validation

```bash
# Test invalid email
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "invalid-email",
    "password": "TestPass123!"
  }'
```

### 3. Error Handling Testing

#### Test Duplicate Email

```bash
# Register the same email twice
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

#### Test Invalid Credentials

```bash
# Test with wrong password
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword123!"
  }'
```

## Error Handling

### 1. Validation Error Responses

#### Zod Validation Error

```json
{
  "success": false,
  "message": "Validation Error: email:Invalid email format, password:Password must contain at least one uppercase letter",
  "errorSources": [
    {
      "path": "email",
      "message": "Invalid email format"
    },
    {
      "path": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

#### Passport Authentication Error

```json
{
  "success": false,
  "message": "Password is incorrect",
  "statusCode": 401
}
```

### 2. Business Logic Errors

#### Duplicate Email Error

```json
{
  "success": false,
  "message": "User already exists with this email",
  "statusCode": 409
}
```

#### User Not Found Error

```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 401
}
```

### 3. Authorization Errors

#### Missing Token Error

```json
{
  "success": false,
  "message": "Access token is required",
  "statusCode": 401
}
```

#### Insufficient Permissions Error

```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "statusCode": 403
}
```

## Integration with Frontend

### 1. Login Form Integration

```javascript
// Login form handler
const handleLogin = async (email, password) => {
  try {
    const response = await fetch("http://localhost:5000/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store user data in state/context
      setUser(data.data.user);
      // Redirect to dashboard
      navigate("/dashboard");
    } else {
      // Handle error
      setError(data.message);
    }
  } catch (error) {
    setError("Login failed. Please try again.");
  }
};
```

### 2. Registration Form Integration

```javascript
// Registration form handler
const handleRegister = async (userData) => {
  try {
    const response = await fetch("http://localhost:5000/api/v1/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (data.success) {
      // Redirect to login page
      navigate("/login");
    } else {
      // Handle validation errors
      setErrors(data.errorSources || []);
    }
  } catch (error) {
    setError("Registration failed. Please try again.");
  }
};
```

### 3. Protected Route Integration

```javascript
// API call with authentication
const fetchProtectedData = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/v1/users/", {
      method: "GET",
      credentials: "include", // Include cookies
    });

    if (response.status === 401) {
      // Token expired, redirect to login
      navigate("/login");
      return;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call failed:", error);
  }
};
```

### 4. Form Validation Integration

```javascript
// Client-side validation matching server-side rules
const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return errors;
};
```

## Security Best Practices

### 1. Password Security

- **Never store plain text passwords**: Always hash with BCrypt
- **Use strong hashing**: Configure appropriate salt rounds (12+)
- **Implement password policies**: Enforce complex password requirements
- **Prevent password reuse**: Check against old passwords during reset

### 2. Token Security

- **Use short-lived access tokens**: 15 minutes or less
- **Implement refresh token rotation**: Generate new refresh tokens
- **Secure token storage**: HTTP-only cookies for web apps
- **Validate token claims**: Check user status on each request

### 3. Input Validation

- **Validate all inputs**: Use Zod schemas for comprehensive validation
- **Sanitize data**: Prevent injection attacks
- **Implement rate limiting**: Prevent brute force attacks
- **Log security events**: Monitor failed authentication attempts

### 4. Error Handling

- **Don't expose sensitive information**: Generic error messages
- **Log detailed errors**: For debugging and monitoring
- **Implement proper HTTP status codes**: For API consistency
- **Handle edge cases**: Graceful degradation

## Troubleshooting

### Common Issues

#### 1. "User not found" Error

**Symptoms**: Login fails with "User not found" message
**Causes**:

- Email not registered in database
- Email case sensitivity issues
- User marked as deleted

**Solutions**:

- Verify email exists in database
- Check email case sensitivity
- Ensure user is not soft-deleted

#### 2. "Password is incorrect" Error

**Symptoms**: Login fails with incorrect password message
**Causes**:

- Wrong password entered
- Password not properly hashed during registration
- BCrypt comparison failure

**Solutions**:

- Verify password is correct
- Check BCrypt hashing in registration
- Ensure password is string, not object

#### 3. "Access token is required" Error

**Symptoms**: Protected routes return 401 unauthorized
**Causes**:

- Missing Authorization header
- Token not included in cookies
- Token format incorrect

**Solutions**:

- Include Authorization header: `Bearer <token>`
- Ensure credentials: 'include' for cookies
- Check token format and presence

#### 4. Validation Errors

**Symptoms**: Registration fails with validation errors
**Causes**:

- Invalid email format
- Weak password
- Missing required fields

**Solutions**:

- Implement client-side validation
- Display clear error messages
- Match server-side validation rules

#### 5. "User is BLOCKED/INACTIVE" Error

**Symptoms**: Login fails with user status error
**Causes**:

- User account blocked by admin
- User account deactivated

**Solutions**:

- Check user status in database
- Provide account recovery options
- Contact administrator if needed

### Debug Tips

#### 1. Enable Debug Logging

```typescript
// In passport.ts
console.log("Local Strategy Debug:", { email, userFound: !!user });

// In auth.controller.ts
console.log("Login attempt:", req.body.email);
```

#### 2. Test Database Connectivity

```typescript
// Test MongoDB connection
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});
```

#### 3. Verify Password Hashing

```typescript
// Test password hashing
const testPassword = "TestPass123!";
const hashedPassword = await bcryptjs.hash(testPassword, 12);
const isMatch = await bcryptjs.compare(testPassword, hashedPassword);
console.log("Password hash test:", isMatch);
```

#### 4. Check Token Generation

```typescript
// Test JWT token generation
const testPayload = { userId: "test", email: "test@example.com", role: "USER" };
const token = jwt.sign(testPayload, process.env.ACCESS_TOKEN_JWT_SECRET, { expiresIn: "15m" });
console.log("Generated token:", token);
```

### Development vs Production

#### Development Configuration

```env
NODE_ENV=development
BCRYPT_SALT_ROUNDS=10
ACCESS_TOKEN_JWT_EXPIRATION=1h
REFRESH_TOKEN_JWT_EXPIRATION=7d
```

#### Production Configuration

```env
NODE_ENV=production
BCRYPT_SALT_ROUNDS=12
ACCESS_TOKEN_JWT_EXPIRATION=15m
REFRESH_TOKEN_JWT_EXPIRATION=7d
```

## Conclusion

This comprehensive local authentication system provides:

- **Secure Authentication**: BCrypt password hashing and JWT tokens
- **Robust Validation**: Multi-layered validation with Zod and Passport.js
- **Flexible User Management**: Role-based access control and user status management
- **Multi-Provider Support**: Seamless integration with OAuth providers
- **Production-Ready**: Comprehensive error handling and security features

The system is designed to be secure, scalable, and maintainable while providing a great developer experience with TypeScript support and clear error messages.

For questions or issues, refer to the official documentation:

- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [Passport Local Strategy](http://www.passportjs.org/packages/passport-local/)
- [Zod Documentation](https://zod.dev/)
- [BCrypt Documentation](https://www.npmjs.com/package/bcryptjs)
