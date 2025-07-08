import { NextFunction, Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { userServices } from "./user.service";

const crateUser = async (req: Request, res: Response, next: NextFunction) => {
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

export const userControllers = {
  crateUser,
};
