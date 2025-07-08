import express, { Request, Response } from "express";
import morgan from "morgan";

export const app = express();
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Tour Management API",
    status: "success",
  });
});
