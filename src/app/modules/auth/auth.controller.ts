/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { setAuthCookie } from "../../../utils/setAuthCookie";
import envVariables from "../../config/env";
import { authServices } from "./auth.service";
import AppError from "../../errorHelpers/AppError";
import { generateAuthTokens } from "../../../utils/userTokens";
import { JwtPayload } from "jsonwebtoken";

const credentialLogin = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  //  validate email and password and returns user auth tokens
  const response = await authServices.credentialLogin(req.body);

  // set cookies for access and refresh tokens
  setAuthCookie(res, {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });

  sendResponse(res, {
    success: true,
    message: "User logged in successfully",
    data: { user: response.user, accessToken: response.accessToken, refreshToken: response.refreshToken },
    statusCode: 200,
  });
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

const googleCallback = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
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

  res.redirect(envVariables.FRONTEND_URL);
});

export const authControllers = {
  credentialLogin,
  logout,
  resetPassword,
  googleCallback,
  generateAccessTokensUsingRefreshToken,
};
