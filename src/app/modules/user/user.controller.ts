import { NextFunction, Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { userServices } from "./user.service";

const crateUser = async (req: Request, res: Response, next: NextFunction) => {
  // throw new AppError(StatusCodes.BAD_REQUEST, "Test Error"); // This line is for testing the global error handler
  try {
    const user = await userServices.creteUser(req.body);
    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user,
    });
  } catch (error: unknown) {
    // res.status(StatusCodes.BAD_REQUEST).json({ message: "Internal Server Error", error });
    next(error); // Pass the error to the global error handler
  }
};

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userServices.getAllUsers();
    res.status(StatusCodes.OK).json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const userControllers = {
  crateUser,
  getAllUsers,
};
