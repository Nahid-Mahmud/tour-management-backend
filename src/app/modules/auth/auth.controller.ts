import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { authServices } from "./auth.service";
import envVariables from "../../config/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const credentialLogin = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const response = await authServices.credentialLogin(req.body);

  res.cookie("accessToken", response.accessToken, {
    httpOnly: true,
    secure: envVariables.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
  });

  // set refresh token in cookie
  res.cookie("refreshToken", response.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
  });

  sendResponse(res, {
    success: true,
    message: "User logged in successfully",
    data: response.user,
    statusCode: 200,
  });
});

export const authControllers = {
  credentialLogin,
};
