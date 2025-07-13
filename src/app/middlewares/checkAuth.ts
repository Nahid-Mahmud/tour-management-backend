import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../../utils/jwt";
import envVariables from "../config/env";
import AppError from "../errorHelpers/AppError";
import { UserRole } from "../modules/user/user.interface";

export const checkAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;
      if (!accessToken) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Access token is required");
      }
      const verifiedToken = verifyToken(accessToken, envVariables.JWT_SECRET);
      req.user = verifiedToken;

      const role = verifiedToken.role;
      if (!authRoles.includes(role)) {
        throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to access this resource");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
