import bcryptjs from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { createNewRefreshToken, generateAuthTokens } from "../../utils/userTokens";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import User from "../user/user.model";
import { passwordValidationSchema } from "./auth.validation";

const credentialLogin = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new AppError(StatusCodes.BAD_REQUEST, `You must provide both email and password`);
  }

  // check if use exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not found with this email");
  }

  // check if password is correct
  const isPasswordMatch = await bcryptjs.compare(password, user.password as string);

  if (!isPasswordMatch) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Password is incorrect");
  }

  // generate access token

  const userAuthTokens = generateAuthTokens(user);

  // remove password from response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: userPassword, ...userWithoutPassword } = user.toObject();

  return {
    user: userWithoutPassword,
    accessToken: userAuthTokens.accessToken,
    refreshToken: userAuthTokens.refreshToken,
  };
};

const generateAccessTokensUsingRefreshToken = async (refreshToken: string) => {
  const newAccessToken = await createNewRefreshToken(refreshToken);

  return {
    accessToken: newAccessToken,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const resetPassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {
  return {};
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setPassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {
  return {};
};

const changePassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {
  if (!decodedToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "You are not authorized to perform this action");
  }

  // validate old password and new password
  if (oldPassword === newPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "New password must be different from old password");
  }

  // validate new password
  const zodPasswordValidationResult = await passwordValidationSchema.parseAsync(newPassword);

  // get user from database
  const userFromDb = await User.findById(decodedToken.userId);

  // check if user exists
  if (!userFromDb) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // check if old password is correct
  const isPasswordMatch = await bcryptjs.compare(oldPassword, userFromDb.password as string);

  // if old password is incorrect, throw error
  if (!isPasswordMatch) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Old password is incorrect");
  }

  // old password and new password should not be the same

  const hashedNewPassword = await bcryptjs.hash(zodPasswordValidationResult, Number(envVariables.BCRYPT_SALT_ROUNDS));

  // update user password
  await User.findByIdAndUpdate(userFromDb._id, { password: hashedNewPassword }, { new: true, runValidators: true });
};

export const authServices = {
  credentialLogin,
  generateAccessTokensUsingRefreshToken,
  resetPassword,
  changePassword,
  setPassword,
};
