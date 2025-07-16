import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../utils/jwt";
import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive, UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";

export const checkAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;
      if (!accessToken) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Access token is required");
      }
      const verifiedToken = verifyToken(accessToken, envVariables.ACCESS_TOKEN_JWT_SECRET);

      const isUserExist = await User.findOne({ email: verifiedToken.email });

      if (!isUserExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
      }
      if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(StatusCodes.BAD_REQUEST, `User is ${isUserExist.isActive}`);
      }
      if (isUserExist.isDeleted) {
        throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to access this resource");
      }

      req.user = verifiedToken;

      next();
    } catch (error) {
      next(error);
    }
  };
