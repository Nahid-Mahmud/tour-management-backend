import bcryptjs from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import { createNewRefreshToken, generateAuthTokens } from "../../../utils/userTokens";
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

export const authServices = {
  credentialLogin,
  getNewAccessToken,
  generateAuthTokens,
};
