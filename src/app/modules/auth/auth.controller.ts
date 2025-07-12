import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { authServices } from "./auth.service";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const credentialLogin = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const user = await authServices.credentialLogin(req.body);

  sendResponse(res, {
    success: true,
    message: "User logged in successfully",
    data: user,
    statusCode: 200,
  });
});

export const authControllers = {
  credentialLogin,
};
