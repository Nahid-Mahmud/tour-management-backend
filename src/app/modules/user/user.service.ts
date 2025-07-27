import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { hashPassword } from "../../utils/hashPassword";
import { IAuthProvider, IUser, UserRole } from "./user.interface";
import User from "./user.model";

// create user
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

  // remove password from response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: userPassword, ...userWithoutPassword } = user.toObject();

  return userWithoutPassword;
};

// update user
const updateUser = async (userId: string, payload: Partial<IUser>, decodedToken: JwtPayload) => {
  if (decodedToken.role === UserRole.USER || decodedToken.role === UserRole.GUIDE) {
    if (userId !== decodedToken.userId) {
      throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to update this user");
    }
  }

  // check if user exists

  const user = await User.findById(decodedToken.userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // role update validation

  if (decodedToken.role === UserRole.ADMIN && user.role === UserRole.SUPER_ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to update this user");
  }

  if (payload.role) {
    if (decodedToken.role === UserRole.USER || decodedToken.role === UserRole.GUIDE) {
      throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to change user role");
    }
    // if (payload.role === UserRole.SUPER_ADMIN && decodedToken.role === UserRole.ADMIN) {
    //   throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to change user role");
    // }
  }

  // isActive, isDeleted, isVerified update validation
  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === UserRole.USER || decodedToken.role === UserRole.GUIDE) {
      throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to change user status");
    }
  }

  const updatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  }).select("-password");
  return updatedUser;
};

// get all users
const getAllUsers = async () => {
  const users = await User.find({}).select("-password");
  const totalUsers = await User.countDocuments();
  return { data: users, meta: totalUsers };
};

// get user by ID
const getUserById = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return user;
};

// get logged-in user
const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  return user;
};

export const userServices = {
  creteUser,
  getAllUsers,
  updateUser,
  getUserById,
  getMe,
};
