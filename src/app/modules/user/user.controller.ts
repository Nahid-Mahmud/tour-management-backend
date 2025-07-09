/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { catchAsync } from "../../../utils/catchAsync";
import { userServices } from "./user.service";
import sendResponse from "../../../utils/sendResponse";

const createUser = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await userServices.creteUser(req.body);
  sendResponse(res, {
    success: true,
    message: "User created successfully",
    data: user,
    statusCode: StatusCodes.CREATED,
  });
});

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
};
