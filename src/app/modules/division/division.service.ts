import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { IDivision } from "./division.interface";
import { Division } from "./division.model";

const createDivision = async (division: IDivision) => {
  const existingDivision = await Division.findOne({ name: division.name });

  if (existingDivision) {
    throw new AppError(StatusCodes.CONFLICT, "Division with this name already exists");
  }

  division.slug = division.name.toLowerCase().replace(/\s+/g, "-");
  const res = await Division.create(division);
  return res;
};

const getAllDivisions = async () => {
  const res = await Division.find({});
  // eslint-disable-next-line no-console
  console.log(res);
  return res;
};

export const DivisionService = {
  createDivision,
  getAllDivisions,
};
