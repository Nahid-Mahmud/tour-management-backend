/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";
import { ZodError } from "zod";

// const handleDublicateKeyError = (err: any) => {
//   const matchedArray = err.message.match(/"([^"]*)"/);

//   return {
//     statusCode: 409,
//   };
// };

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = "Something Went Wrong!!";
  const errorSources: any[] = [];

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const matchedArray = err.message.match(/"([^"]*)"/);
    statusCode = 409;
    message = `${matchedArray[1]} already exists. Please provide a unique value.`;
  }
  // MongoDB Cast Error (objectId Error)
  else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid mongodb ${err.path}: ${err.value}. Please provide a valid id}.`;
  }

  // Mongoose validation error
  else if (err.name === "ValidationError") {
    const errors = Object.values(err.errors);
    errors.forEach((errorObject: any) =>
      errorSources.push({
        path: errorObject.path,
        message: errorObject.message,
      })
    );
    statusCode = 400;
    message = `Validation Error: ${err.message}`;
    err = err.errors;
  }

  // Zod validation error
  else if (err instanceof ZodError) {
    const errorDetails = err.issues;
    // console.log("Zod Error Details:", errorDetails);
    errorDetails.forEach((issue) => {
      errorSources.push({
        path: issue.path.join("."),
        message: issue.message,
      });
    });
    statusCode = 400;
    message = `Validation Error: ${err.issues.map((issue) => issue.path + ":" + issue.message).join(", ")}`;
    err = err.issues;
  }
  // Custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Generic Error
  else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: err,
    errorSources,
    stack: envVariables.NODE_ENV === "development" ? err.stack : null,
  });
};
