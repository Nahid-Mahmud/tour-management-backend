/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { authServices } from "./auth.service";
import envVariables from "../../config/env";
import { setCookie } from "../../../utils/setCookie";

const credentialLogin = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  //  validate email and password and returns user auth tokens
  const response = await authServices.credentialLogin(req.body);

  // set cookies for access and refresh tokens
  setCookie(res, {
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

const generateAuthTokens = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const refreshToken = req.cookies.refreshToken;
  // validate refresh token and generate new access token
  const response = await authServices.getNewAccessToken(refreshToken);

  // set new access token cookie
  setCookie(res, {
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

export const authControllers = {
  credentialLogin,
  generateAuthTokens,
  logout,
};
