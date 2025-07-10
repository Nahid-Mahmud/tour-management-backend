import bcryptjs from "bcryptjs";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser } from "./user.interface";
import User from "./user.model";
import { StatusCodes } from "http-status-codes";

const creteUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  // check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(StatusCodes.CONFLICT, "User already exists with this email");
  }

  const hashedPassword = await bcryptjs.hash(password as string, 10);

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string, // using type assertion to ensure providerId is a string. Because Email is guaranteed to be a string because of using zod validation.
  };

  const user = await User.create({
    email,
    password: hashedPassword,
    auths: [authProvider],
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
