import cors from "cors";
import express, { Request, Response } from "express";
import morgan from "morgan";
import { router } from "./app/modules/routes";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";

export const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
// cookie parser
app.use(cookieParser());

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Tour Management API",
    status: "success",
  });
});

// route not match

app.use(globalErrorHandler);

app.use(notFound);
