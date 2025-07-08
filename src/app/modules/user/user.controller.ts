import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { userServices } from "./user.service";

const crateUser = async (req: Request, res: Response) => {
  try {
    const user = await userServices.creteUser(req.body);
    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user,
    });
  } catch (error: unknown) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "Internal Server Error", error });
  }
};

export const userControllers = {
  crateUser,
};
