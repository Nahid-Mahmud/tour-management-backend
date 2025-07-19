/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ITour, ITourType } from "./tour.interface";
import { TourService } from "./tour.service";

// ---------------------------- Tour Type ---------------------------- //

// Function to create a new tour type
const createTourType = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const tourType: ITourType = req.body;
  const createdTourType = await TourService.createTourType(tourType);
  sendResponse(res, {
    success: true,
    message: "Tour type created successfully",
    data: createdTourType,
    statusCode: StatusCodes.CREATED,
  });
});

// Function to edit a tour type
const editTourType = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const tourType: ITourType = req.body;
  const updatedTourType = await TourService.editTourType(id, tourType);
  sendResponse(res, {
    success: true,
    message: "Tour type updated successfully",
    data: updatedTourType,
    statusCode: StatusCodes.OK,
  });
});

// Function to get all tour types
const getAllTourTypes = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const tourTypes = await TourService.getAllTourTypes();
  sendResponse(res, {
    success: true,
    message: "Tour types fetched successfully",
    data: tourTypes,
    statusCode: StatusCodes.OK,
  });
});

const deleteTourType = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  await TourService.deleteTourType(id);
  sendResponse(res, {
    success: true,
    message: "Tour type deleted successfully",
    statusCode: StatusCodes.OK,
    data: null,
  });
});

// ---------------------------- Tour----------------------------- //

const createTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const tourData: Partial<ITour> = req.body;
  const { division, tourType } = tourData;
  if (!division || !tourType) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Division and Tour Type are required");
  }

  const createdTour = await TourService.createTour(tourData);
  sendResponse(res, {
    success: true,
    message: "Tour created successfully",
    data: createdTour,
    statusCode: StatusCodes.CREATED,
  });
});

const getAllTours = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const query = req.query;
  const tours = await TourService.getAllTours(query as Record<string, string>);
  sendResponse(res, {
    success: true,
    message: "Tours fetched successfully",
    data: tours.tours,
    meta: {
      total: tours.totalTours,
    },
    statusCode: StatusCodes.OK,
  });
});

const updateTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const tourData: Partial<ITour> = req.body;

  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Tour ID is required");
  }

  const { division, tourType } = tourData;
  if (!division || !tourType) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Division and Tour Type are required");
  }

  const updatedTour = await TourService.updateTour(id, tourData);
  sendResponse(res, {
    success: true,
    message: "Tour updated successfully",
    data: updatedTour,
    statusCode: StatusCodes.OK,
  });
});

const deleteTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Tour ID is required");
  }
  await TourService.deleteTour(id);
  sendResponse(res, {
    success: true,
    message: "Tour deleted successfully",
    statusCode: StatusCodes.OK,
    data: null,
  });
});

export const TourController = {
  createTourType,
  editTourType,
  getAllTourTypes,
  deleteTourType,
  createTour,
  getAllTours,
  updateTour,
  deleteTour,
};
