import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import { router } from "./app/modules/routes";

import StatusCodes from "http-status-codes";
import envVariables from "./app/config/env";

export const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Tour Management API",
    status: "success",
  });
});

// route not match

app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: "Route not found",
    status: "failed",
  });
});

// global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    message: `Something went wrong!! ${error?.message}`,
    error,
    stack: envVariables.NODE_ENV === "development" ? error?.stack : null,
  });
});
