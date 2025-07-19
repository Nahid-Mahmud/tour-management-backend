import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Division } from "../division/division.model";
import { ITour, ITourType } from "./tour.interface";
import { Tour, TourType } from "./tour.model";

// ---------------------------- Tour Type ---------------------------- //

// Function to create a new tour type
const createTourType = async (tourType: ITourType) => {
  // Check if a tour type with the same name already exists
  const existingTourType = await TourType.findOne({ name: tourType.name });

  // If it exists, throw an error to prevent duplicates
  if (existingTourType) {
    throw new AppError(StatusCodes.CONFLICT, `Tour type with name "${tourType.name}" already exists.`);
  }

  // If it doesn't exist, create a new tour type
  const res = await TourType.create(tourType);

  // Return the created tour type
  return res;
};

// function to edit a tour type
const editTourType = async (id: string, tourType: ITourType) => {
  // Check if a tour type with the same name already exists, excluding the current one
  const existingTourType = await TourType.findOne({ name: tourType.name, _id: { $ne: id } });

  // If it exists, throw an error to prevent duplicates
  if (existingTourType) {
    throw new AppError(StatusCodes.CONFLICT, `Tour type with name "${tourType.name}" already exists.`);
  }

  // If it doesn't exist, update the tour type
  const res = await TourType.findByIdAndUpdate(id, tourType, { new: true, runValidators: true });

  // Return the updated tour type
  return res;
};

// function to get all tour types
const getAllTourTypes = async () => {
  // Fetch all tour types from the database
  const res = await TourType.find({});
  return res;
};

//function to delete a tour type
const deleteTourType = async (id: string) => {
  // Check if the tour type exists
  const existingTourType = await TourType.findById(id);
  if (!existingTourType) {
    throw new AppError(StatusCodes.NOT_FOUND, `Tour type with ID "${id}" does not exist.`);
  }
  // If it exists, delete the tour type
  await TourType.findByIdAndDelete(id);
  return null;
};

//---------------------------Tour---------------------------//

const createTour = async (tourData: Partial<ITour>) => {
  const { division, tourType } = tourData;

  // check if division exists
  const existingDivision = await Division.findById(division);
  if (!existingDivision) {
    throw new AppError(StatusCodes.NOT_FOUND, `Division with ID "${division}" does not exist.`);
  }

  // check if tour type exists
  const existingTourType = await TourType.findById(tourType);

  if (!existingTourType) {
    throw new AppError(StatusCodes.NOT_FOUND, `Tour type with ID "${tourType}" does not exist.`);
  }

  const newTour = new Tour(tourData);
  const tour = await newTour.save();
  return tour;
};

const editTour = async (id: string, tourData: Partial<ITour>) => {
  const existingTour = await Tour.findById(id);
  if (!existingTour) {
    throw new AppError(StatusCodes.NOT_FOUND, `Tour with ID "${id}" does not exist.`);
  }
  const updatedTour = await Tour.findOneAndUpdate({ _id: id }, tourData, { new: true, runValidators: true });
  return updatedTour;
};

const getAllTours = async () => {
  const tours = await Tour.find().populate("division").populate("tourType");
  const totalTours = await Tour.countDocuments();
  return { tours, totalTours };
};

const updateTour = async (id: string, tourData: Partial<ITour>) => {
  const existingTour = await Tour.findById(id);

  const { division, tourType } = tourData;
  if (division) {
    const existingDivision = await Division.findById(division);
    if (!existingDivision) {
      throw new AppError(StatusCodes.NOT_FOUND, `Division with ID "${division}" does not exist.`);
    }
  }

  if (tourType) {
    const existingTourType = await TourType.findById(tourType);
    if (!existingTourType) {
      throw new AppError(StatusCodes.NOT_FOUND, `Tour type with ID "${tourType}" does not exist.`);
    }
  }

  if (!existingTour) {
    throw new AppError(StatusCodes.NOT_FOUND, `Tour with ID "${id}" does not exist.`);
  }
  const updatedTour = await Tour.findByIdAndUpdate(id, tourData, { new: true, runValidators: true });
  return updatedTour;
};

const deleteTour = async (id: string) => {
  const existingTour = await Tour.findById(id);
  if (!existingTour) {
    throw new AppError(StatusCodes.NOT_FOUND, `Tour with ID "${id}" does not exist.`);
  }
  await Tour.findByIdAndDelete(id);
  return null;
};

export const TourService = {
  createTourType,
  editTourType,
  getAllTourTypes,
  deleteTourType,
  createTour,
  editTour,
  getAllTours,
  updateTour,
  deleteTour,
};
