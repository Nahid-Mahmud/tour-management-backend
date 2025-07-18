import { ITourType } from "./tour.interface";
import { TourType } from "./tour.model";

// ---------------------------- Tour Type ---------------------------- //

// Function to create a new tour type
const createTourType = async (tourType: ITourType) => {
  // Check if a tour type with the same name already exists
  const existingTourType = await TourType.findOne({ name: tourType.name });

  // If it exists, throw an error to prevent duplicates
  if (existingTourType) {
    throw new Error(`Tour type with name "${tourType.name}" already exists.`);
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
    throw new Error(`Tour type with name "${tourType.name}" already exists.`);
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
    throw new Error(`Tour type with ID "${id}" does not exist.`);
  }
  // If it exists, delete the tour type
  await TourType.findByIdAndDelete(id);
  return null;
};

export const TourService = {
  createTourType,
  editTourType,
  getAllTourTypes,
  deleteTourType,
};
