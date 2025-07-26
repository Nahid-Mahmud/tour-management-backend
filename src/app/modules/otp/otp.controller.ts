/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { otpServices } from "./otp.service";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

const sendOtp = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const { email, name } = req.body;

  await otpServices.sendOtp(email, name);
  sendResponse(res, {
    success: true,
    message: "OTP sent successfully",
    statusCode: StatusCodes.OK,
    data: null,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const { email, otp } = req.body;
  await otpServices.verifyOtp(email, otp);
  sendResponse(res, {
    success: true,
    message: "OTP verified successfully",
    statusCode: StatusCodes.OK,
    data: null,
  });
});

export const otpController = {
  sendOtp,
  verifyOtp,
};
