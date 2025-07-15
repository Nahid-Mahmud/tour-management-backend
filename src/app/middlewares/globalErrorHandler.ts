/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";
import { ZodError } from "zod";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = "Something Went Wrong!!";

  if (err.code === 11000) {
    // MongoDB duplicate key error
    const matchedArray = err.message.match(/"([^"]*)"/);
    statusCode = 409;
    message = `${matchedArray[1]}`;
  } else if (err.name === "CastError") {
    // MongoDB Cast Error
    statusCode = 400;
    message = `Invalid mongodb ${err.path}: ${err.value}. Please provide a valid id}.`;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = `Validation Error: ${err.issues.map((issue) => issue.path + ":" + issue.message).join(", ")}`;
    err = err.issues;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: err,
    stack: envVariables.NODE_ENV === "development" ? err.stack : null,
  });
};
