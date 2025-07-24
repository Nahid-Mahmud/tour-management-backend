/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { DivisionService } from "./division.service";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { IDivision } from "./division.interface";

// Function to create a new division
const createDivision = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // console.log({
  //   file: req.file,
  //   body: req.body,
  // });

  const payload: IDivision = {
    ...req.body,
    thumbnail: req.file?.path, // Assuming the file is uploaded and its path is stored in req.file.path
  };

  const result = await DivisionService.createDivision(payload);
  sendResponse(res, {
    success: true,
    message: "Division created successfully",
    data: result,
    statusCode: StatusCodes.CREATED,
  });
});

// Function to get all divisions
const getAllDivisions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await DivisionService.getAllDivisions();
  sendResponse(res, {
    success: true,
    message: "Divisions retrieved successfully",
    data: result,
    statusCode: StatusCodes.OK,
  });
});

// Function to update a division by ID
const updateDivision = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const division = req.body;
  const result = await DivisionService.updateDivision(id, division);
  sendResponse(res, {
    success: true,
    message: "Division updated successfully",
    data: result,
    statusCode: StatusCodes.OK,
  });
});

// Function to delete a division by ID
const deleteDivision = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  await DivisionService.deleteDivision(id);

  sendResponse(res, {
    success: true,
    message: "Division deleted successfully",
    statusCode: StatusCodes.OK,
    data: null,
  });
});

// Function to get a division by slug
const getDivisionBySlug = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  const result = await DivisionService.getDivisionBySlug(slug);
  sendResponse(res, {
    success: true,
    message: "Division retrieved successfully",
    data: result,
    statusCode: StatusCodes.OK,
  });
});

export const divisionControllers = {
  createDivision,
  getAllDivisions,
  updateDivision,
  deleteDivision,
  getDivisionBySlug,
};
