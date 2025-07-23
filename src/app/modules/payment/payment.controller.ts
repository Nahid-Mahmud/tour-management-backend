/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";

const successPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //
});

const failPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //
});

const cancelPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  //
});

export const paymentController = {
  successPayment,
  failPayment,
  cancelPayment,
};
