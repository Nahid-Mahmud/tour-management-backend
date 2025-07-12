import { StatusCodes } from "http-status-codes";
import { hashPassword } from "../../../utils/hashPassword";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser } from "./user.interface";
import User from "./user.model";

const creteUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  if (!email || !password) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Email and password are required");
  }

  // check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(StatusCodes.CONFLICT, "User already exists with this email");
  }

  const hashedPassword = await hashPassword(password as string);

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string,
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
