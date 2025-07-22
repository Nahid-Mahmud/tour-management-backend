import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/queryBuilder";
import { Division } from "../division/division.model";
import { tourSearchableFields } from "./tour.constant";
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

// // get all tours with optional query parameters for filtering
// const getAllTours = async (query: Record<string, string>) => {
//   // specific fields to have in the filter
//   const filter = query;
//   //  search to broad Searchable fields
//   const searchTerm = filter?.searchTerm || "";
//   //  sort by createdAt by default or by the provided sort query
//   const sort = query?.sort || "-createdAt";

//   // fields to select in the response
//   const fields = query.fields?.split(",").join(" ") || "";

//   // page and limit for pagination
//   const page = query.page ? parseInt(query.page, 10) : 1;
//   const limit = query.limit ? parseInt(query.limit, 10) : 10;

//   // Calculate the skip value for pagination
//   const skip = (page - 1) * limit;

//   for (const field of excludeFields) {
//     // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
//     delete filter[field];
//   }

//   const searchQuery = {
//     $or: tourSearchableFields.map((field: string) => ({ [field]: { $regex: searchTerm, $options: "i" } })),
//   };

//   // fist pattern to get all data
//   // const tours = await Tour.find(searchQuery).find(filter).sort(sort).select(fields).skip(skip).limit(limit);

//   // second  pattern to get all data with pagination

//   const filterQuery = Tour.find(filter);
//   const toursWithSearchQuery = filterQuery.find(searchQuery);
//   const tours = await toursWithSearchQuery.sort(sort).select(fields).skip(skip).limit(limit);

//   const totalDocument = await Tour.countDocuments();
//   const totalPages = Math.ceil(totalDocument / limit);

//   const meta = {
//     page,
//     limit,
//     total: totalDocument,
//     totalPages,
//   };

//   return { tours, meta };
// };

// get all tours with optional query parameters for filtering
const getAllTours = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Tour.find(), query);

  // optimum order of method calls
  // 1. filter
  // 2. search
  // 3. sort
  // 4. fields
  // 5. paginate
  // 6. build the query

  // 1st pattern to get all data and meta data
  /*
  const tours = await queryBuilder.filter().search(tourSearchableFields).sort().fields().paginate().build();
  const meta = await queryBuilder.getMeta();
  */

  // 2nd pattern to get all data and meta data

  const tours = queryBuilder.filter().search(tourSearchableFields).sort().fields().paginate();
  const [data, meta] = await Promise.all([tours.build(), queryBuilder.getMeta()]);

  return {
    tours: data,
    meta,
  };
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
