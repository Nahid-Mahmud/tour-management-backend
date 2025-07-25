import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { IDivision } from "./division.interface";
import { Division } from "./division.model";
import { deleteImageFormCloudinary } from "../../config/cloudinary.config";

// Function to create a new division
const createDivision = async (payload: IDivision) => {
  const existingDivision = await Division.findOne({ name: payload.name });
  if (existingDivision) {
    throw new Error("A division with this name already exists.");
  }

  const division = await Division.create(payload);

  return division;
};

// Function to get all divisions
const getAllDivisions = async () => {
  const res = await Division.find({});
  // eslint-disable-next-line no-console
  console.log(res);
  return res;
};

// Function to update a division by ID
const updateDivision = async (id: string, payload: Partial<IDivision>) => {
  const existingDivision = await Division.findById(id);
  if (!existingDivision) {
    throw new Error("Division not found.");
  }

  const duplicateDivision = await Division.findOne({
    name: payload.name,
    _id: { $ne: id },
  });

  if (duplicateDivision) {
    throw new Error("A division with this name already exists.");
  }

  const updatedDivision = await Division.findByIdAndUpdate(id, payload, { new: true, runValidators: true });

  if (payload.thumbnail && existingDivision.thumbnail) {
    await deleteImageFormCloudinary(existingDivision.thumbnail);
  }

  return updatedDivision;
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

// Function to get a division by slug
const getDivisionBySlug = async (slug: string) => {
  const division = await Division.findOne({ slug });
  if (!division) {
    throw new AppError(StatusCodes.NOT_FOUND, "Division not found");
  }
  return division;
};

export const DivisionService = {
  createDivision,
  getAllDivisions,
  updateDivision,
  deleteDivision,
  getDivisionBySlug,
};
