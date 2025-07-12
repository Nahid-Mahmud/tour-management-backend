import { NextFunction, Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../../../utils/jwt";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { validateRequest } from "../../middlewares/validateRequest";
import { userControllers } from "./user.controller";
import { UserRole } from "./user.interface";
import { createUserSchema } from "./user.validation";

const router = Router();

router.post("/register", validateRequest(createUserSchema), userControllers.createUser);
router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;
      if (!accessToken) {
        throw new AppError(StatusCodes.UNAUTHORIZED, "Access token is required");
      }
      const verifiedToken = verifyToken(accessToken, envVariables.JWT_SECRET);

      const role = verifiedToken.role;

      //   if (role !== UserRole.ADMIN || role !== UserRole.SUPER_ADMIN) {
      //     throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to access this resource");
      //   }

      if (role !== UserRole.ADMIN) {
        throw new AppError(StatusCodes.FORBIDDEN, "You do not have permission to access this resource");
      }

      next();
    } catch (error) {
      next(error);
    }
  },
  userControllers.getAllUsers
);

export const userRoutes = router;
