import bcryptjs from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { generateToken } from "../../../utils/jwt";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import User from "../user/user.model";

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

  const accessTokenPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(accessTokenPayload, envVariables.JWT_SECRET, envVariables.JWT_EXPIRATION);

  return {
    accessToken,
    user,
  };
};

export const authServices = {
  credentialLogin,
};
