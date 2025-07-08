import cors from "cors";
import express, { Request, Response } from "express";
import morgan from "morgan";
import { router } from "./app/modules/routes";

import StatusCodes from "http-status-codes";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";

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

app.use(globalErrorHandler);

app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: "Route not found",
    status: "failed",
  });
});
