import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { DivisionService } from "./division.service";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createDivision = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const division = req.body;
  const result = await DivisionService.createDivision(division);
  sendResponse(res, {
    success: true,
    message: "Division created successfully",
    data: result,
    statusCode: StatusCodes.CREATED,
  });
});

export const divisionControllers = {
  createDivision,
};
