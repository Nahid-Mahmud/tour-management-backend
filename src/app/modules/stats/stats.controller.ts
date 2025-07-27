/* eslint-disable @typescript-eslint/no-unused-vars */
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { statsService } from "./stats.service";
import { NextFunction, Request, Response } from "express";

const getBookingStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await statsService.getBookingStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Booking stats retrieved successfully",
    data: result,
  });
});

const getTourStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await statsService.getTourStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tour stats retrieved successfully",
    data: result,
  });
});

const getUserStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await statsService.getUserStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User stats retrieved successfully",
    data: result,
  });
});

const getPaymentStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await statsService.getPaymentStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Payment stats retrieved successfully",
    data: result,
  });
});

export const statsController = { getBookingStats, getTourStats, getUserStats, getPaymentStats };
