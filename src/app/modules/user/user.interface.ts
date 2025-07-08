import { Types } from "mongoose";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  GUIDE = "GUIDE",
  SUPER_ADMIN = "SUPER_ADMIN",
}

// auth provider
export interface IAuthProvider {
  provider: string; // google , credential
  providerId: string;
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  address?: string;
  isDeleted?: boolean;
  isActive?: IsActive;
  isVerified?: boolean;
  bookings?: Types.ObjectId[];
  guides?: Types.ObjectId[];
  auths: IAuthProvider[];
}
