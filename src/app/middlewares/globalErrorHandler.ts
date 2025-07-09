/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const globalErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = `Something went wrong!! ${error?.message}`;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof Error) {
    statusCode = 400;
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error,
    stack: envVariables.NODE_ENV === "development" ? error?.stack : null,
  });
};
