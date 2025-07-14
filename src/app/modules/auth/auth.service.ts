import bcryptjs from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { createNewRefreshToken, generateAuthTokens } from "../../../utils/userTokens";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import User from "../user/user.model";

import z from "zod";

const passwordValidationSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(/[0-9]/, {
    message: "Password must contain at least one number",
  })
  .regex(/[^A-Za-z0-9]/, {
    message: "Password must contain at least one special character",
  });

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
    accessToken: userAuthTokens.accessToken,
    user: userWithoutPassword,
    refreshToken: userAuthTokens.refreshToken,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewRefreshToken(refreshToken);

  return {
    accessToken: newAccessToken,
  };
};

const resetPassword = async (oldPassword: string, newPassword: string, decodedToken: JwtPayload) => {
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
  getNewAccessToken,
  generateAuthTokens,
  resetPassword,
};
