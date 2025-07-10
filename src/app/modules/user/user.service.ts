import AppError from "../../errorHelpers/AppError";
import { IUser } from "./user.interface";
import User from "./user.model";
import { StatusCodes } from "http-status-codes";

const creteUser = async (payload: Partial<IUser>) => {
  const { email, ...rest } = payload;

  // check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(StatusCodes.CONFLICT, "User already exists with this email");
  }

  const user = await User.create({
    email,
    ...rest,
  });
  return user;
};

const getAllUsers = async () => {
  const users = await User.find({});
  const totalUsers = await User.countDocuments();
  return { data: users, meta: totalUsers };
};

export const userServices = {
  creteUser,
  getAllUsers,
};
