import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import User from "./user.model";

const crateUser = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const user = await User.create({
      name,
      email,
    });
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
