/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import { ZodError } from "zod";
import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";
import { TErrorSources } from "../interfaces/error.types";
import { handleDuplicateKeyError } from "../errorHelpers/handleDuplicateKeyError";
import { handleCastError } from "../errorHelpers/handleCastError";
import { handleValidationError } from "../errorHelpers/handleValidationError";
import { handleZodError } from "../errorHelpers/handleZodError";
import { deleteImageFormCloudinary } from "../config/cloudinary.config";

export const globalErrorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
  if (envVariables.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("Global Error Handler:", err);
  }

  // cloudinary image deletion if an error occurs after uploading an image in modules

  if (req.file) {
    await deleteImageFormCloudinary(req.file.path);
  }

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const imageUrls = (req.files as Express.Multer.File[]).map((file) => file.path);

    await Promise.all(imageUrls.map((url) => deleteImageFormCloudinary(url)));
  }

  let statusCode = 500;
  let message = "Something Went Wrong!!";
  let errorSources: TErrorSources[] = [];

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const simplifiedError = handleDuplicateKeyError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  // MongoDB Cast Error (objectId Error)
  else if (err.name === "CastError") {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }

  // Mongoose validation error
  else if (err.name === "ValidationError") {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources as TErrorSources[];
    err = err.errors;
  }

  // Zod validation error
  else if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    err = err.issues;
    errorSources = simplifiedError.errorSources as TErrorSources[];
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
    error: envVariables.NODE_ENV === "development" ? err : null,
    errorSources,
    stack: envVariables.NODE_ENV === "development" ? err.stack : null,
  });
};
