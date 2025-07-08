/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import envVariables from "../config/env";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const globalErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    message: `Something went wrong!! ${error?.message}`,
    error,
    stack: envVariables.NODE_ENV === "development" ? error?.stack : null,
  });
};
