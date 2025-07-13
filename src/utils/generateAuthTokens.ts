import envVariables from "../app/config/env";
import { IUser } from "../app/modules/user/user.interface";
import { generateJwtToken } from "./jwt";

export const generateAuthTokens = (user: Partial<IUser>) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateJwtToken(
    jwtPayload,
    envVariables.ACCESS_TOKEN_JWT_SECRET,
    envVariables.ACCESS_TOKEN_JWT_EXPIRATION
  );

  const refreshToken = generateJwtToken(
    jwtPayload,
    envVariables.REFRESH_TOKEN_JWT_SECRET,
    envVariables.REFRESH_TOKEN_JWT_EXPIRATION
  );

  return {
    accessToken,
    refreshToken,
  };
};
