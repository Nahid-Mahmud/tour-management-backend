import bcryptjs from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { generateAuthTokens } from "../../../utils/generateAuthTokens";
import { generateJwtToken, verifyToken } from "../../../utils/jwt";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IsActive } from "../user/user.interface";
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
  if (!refreshToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Refresh token is required");
  }

  const decodedToken = verifyToken(refreshToken, envVariables.REFRESH_TOKEN_JWT_SECRET);

  //  check if user exists
  const user = await User.findById(decodedToken.userId);
  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  // check if user is blocked or deleted

  if (user.isActive === IsActive.BLOCKED) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User is blocked");
  }
  if (user.isActive === IsActive.INACTIVE) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User is inactive");
  }

  if (user.isDeleted) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User is deleted");
  }

  const newAccessToken = generateJwtToken(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    envVariables.ACCESS_TOKEN_JWT_SECRET,
    envVariables.ACCESS_TOKEN_JWT_EXPIRATION
  );
  return {
    accessToken: newAccessToken,
  };
};

export const authServices = {
  credentialLogin,
  getNewAccessToken,
  generateAuthTokens,
};
