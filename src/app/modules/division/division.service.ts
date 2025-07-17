import { IDivision } from "./division.interface";
import { Division } from "./division.model";

const createDivision = async (division: IDivision) => {
  const res = await Division.create(division);
  return res;
};

export const DivisionService = {
  createDivision,
};
