import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { IDivision } from "./division.interface";
import { Division } from "./division.model";
import createSlug from "../../utils/createSlug";

// Function to create a new division
const createDivision = async (division: IDivision) => {
  const existingDivision = await Division.findOne({ name: division.name });

  if (existingDivision) {
    throw new AppError(StatusCodes.CONFLICT, "Division with this name already exists");
  }

  // create a slug from the division name
  division.slug = createSlug(division.name);
  const res = await Division.create(division);
  return res;
};

// Function to get all divisions
const getAllDivisions = async () => {
  const res = await Division.find({});
  // eslint-disable-next-line no-console
  console.log(res);
  return res;
};

// Function to update a division by ID
const updateDivision = async (id: string, division: Partial<IDivision>) => {
  const existingDivision = await Division.findById(id);

  if (!existingDivision) {
    throw new AppError(StatusCodes.NOT_FOUND, "Division not found");
  }

  // Duplicate name check

  const duplicateDivision = await Division.findOne({
    name: division.name,
    _id: { $ne: id },
  });

  if (duplicateDivision) {
    throw new AppError(StatusCodes.CONFLICT, "Division with this name already exists");
  }

  if (division.name) {
    division.slug = createSlug(division.name);
  }

  const res = await Division.findByIdAndUpdate(id, division, {
    new: true,
    runValidators: true,
  });

  return res;
};

// function to delete a division by ID
const deleteDivision = async (id: string) => {
  const existingDivision = await Division.findById(id);
  if (!existingDivision) {
    throw new AppError(StatusCodes.NOT_FOUND, "Division not found");
  }
  await Division.findByIdAndDelete(id);
  return null;
};

export const DivisionService = {
  createDivision,
  getAllDivisions,
  updateDivision,
  deleteDivision,
};
