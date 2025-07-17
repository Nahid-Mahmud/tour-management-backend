import { IDivision } from "./division.interface";
import { Division } from "./division.model";

const createDivision = async (division: IDivision) => {
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
