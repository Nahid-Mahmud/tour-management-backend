import { model, Schema } from "mongoose";
import { IDivision } from "./division.interface";

const divisionSchema = new Schema<IDivision>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    thumbnail: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Division = model<IDivision>("Division", divisionSchema);
