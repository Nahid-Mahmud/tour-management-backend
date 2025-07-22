import { Types } from "mongoose";

export enum BOOKING_STATUS {
  PENDING = "PENDING",
  CANCEL = "CANCEL",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IBooking {
  user: Types.ObjectId;
  tour: Types.ObjectId;
  payment?: Types.ObjectId;
  guestCount: number;
  status: BOOKING_STATUS;
}
