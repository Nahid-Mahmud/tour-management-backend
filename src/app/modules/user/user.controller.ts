/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { userServices } from "./user.service";

const createUser = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await userServices.creteUser(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User created successfully",
    user,
  });
});

const getAllUsers = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
  const users = await userServices.getAllUsers();
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Users retrieved successfully",
    users,
  });
});

export const userControllers = {
  createUser,
  getAllUsers,
};
