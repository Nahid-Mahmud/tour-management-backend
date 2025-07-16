/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userServices } from "./user.service";
import AppError from "../../errorHelpers/AppError";
import { JwtPayload } from "jsonwebtoken";

// create user
const createUser = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await userServices.creteUser(req.body);
  sendResponse(res, {
    success: true,
    message: "User created successfully",
    data: user,
    statusCode: StatusCodes.CREATED,
  });
});

// update user

const updateUser = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.params.userId;

  const decodedToken = req.user;

  const user = await userServices.updateUser(userId, req.body, decodedToken as JwtPayload);

  sendResponse(res, {
    success: true,
    message: "User updated successfully",
    data: user,
    statusCode: StatusCodes.OK,
  });
});

// get all users
const getAllUsers = catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
  const result = await userServices.getAllUsers();
  sendResponse(res, {
    success: true,
    message: "Users retrieved successfully",
    data: result.data,
    statusCode: StatusCodes.OK,
    meta: {
      total: result.meta,
    },
  });
});

export const userControllers = {
  createUser,
  getAllUsers,
  updateUser,
};
