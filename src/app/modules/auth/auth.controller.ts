/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { setAuthCookie } from "../../utils/setAuthCookie";
import envVariables from "../../config/env";
import { authServices } from "./auth.service";
import AppError from "../../errorHelpers/AppError";
import { generateAuthTokens } from "../../utils/userTokens";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";

const credentialLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //  validate email and password and returns user auth tokens with custom validation
  // const response = await authServices.credentialLogin(req.body);

  // authenticate user with email and password using passport.js

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passport.authenticate("local", async (error: any, user: any, info: any) => {
    if (error) {
      return next(new AppError(StatusCodes.INTERNAL_SERVER_ERROR, info.message || "Internal server error"));
    }

    if (!user) {
      return next(new AppError(StatusCodes.UNAUTHORIZED, info.message || "User does not exist"));
    }

    const authTokens = generateAuthTokens(user);

    const { password, ...userWithoutPassword } = user.toObject();

    // generate access and refresh tokens
    // set cookies for access and refresh tokens
    setAuthCookie(res, {
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
    });

    sendResponse(res, {
      success: true,
      message: "User logged in successfully",
      data: { user: userWithoutPassword, accessToken: authTokens.accessToken, refreshToken: authTokens.refreshToken },
      statusCode: 200,
    });
  })(req, res, next);

  // // set cookies for access and refresh tokens
  // setAuthCookie(res, {
  //   accessToken: response.accessToken,
  //   refreshToken: response.refreshToken,
  // });

  // sendResponse(res, {
  //   success: true,
  //   message: "User logged in successfully",
  //   data: { user: response.user, accessToken: response.accessToken, refreshToken: response.refreshToken },
  //   statusCode: 200,
  // });
});

const generateAccessTokensUsingRefreshToken = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const refreshToken = req.cookies.refreshToken;
  // validate refresh token and generate new access token
  const response = await authServices.generateAccessTokensUsingRefreshToken(refreshToken);

  // set new access token cookie
  setAuthCookie(res, {
    accessToken: response.accessToken,
  });

  sendResponse(res, {
    success: true,
    message: "New access token generated successfully",
    data: { accessToken: response.accessToken },
    statusCode: 200,
  });
});

const logout = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: envVariables.NODE_ENV === "production",
    sameSite: "lax",
  });

  sendResponse(res, {
    success: true,
    message: "User logged out successfully",
    statusCode: 200,
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const decodedToken = req.user;

  const { oldPassword, newPassword } = req.body;

  await authServices.resetPassword(oldPassword, newPassword, decodedToken as JwtPayload);

  sendResponse(res, {
    success: true,
    message: "Password reset successfully",
    statusCode: StatusCodes.OK,
    data: null,
  });
});

const setPassword = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const decodedToken = req.user;

  const { oldPassword, newPassword } = req.body;

  await authServices.setPassword(oldPassword, newPassword, decodedToken as JwtPayload);

  sendResponse(res, {
    success: true,
    message: "Password reset successfully",
    statusCode: StatusCodes.OK,
    data: null,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const decodedToken = req.user;

  const { oldPassword, newPassword } = req.body;

  await authServices.changePassword(oldPassword, newPassword, decodedToken as JwtPayload);

  sendResponse(res, {
    success: true,
    message: "Password reset successfully",
    statusCode: StatusCodes.OK,
    data: null,
  });
});

const googleCallback = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  let redirectTo = req.query.state ? (req.query.state as string) : "";

  if (redirectTo.startsWith("/")) {
    // Remove leading slash if present
    redirectTo = redirectTo.slice(1);
  }

  const user = req.user;

  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  // set cookies for access and refresh tokens

  const tokenInfo = generateAuthTokens(user);

  setAuthCookie(res, {
    accessToken: tokenInfo.accessToken,
    refreshToken: tokenInfo.refreshToken,
  });

  // Redirect to the frontend URL with the specified path
  res.redirect(`${envVariables.FRONTEND_URL}/${redirectTo}`);
});

export const authControllers = {
  credentialLogin,
  logout,
  resetPassword,
  googleCallback,
  generateAccessTokensUsingRefreshToken,
  changePassword,
  setPassword,
};
